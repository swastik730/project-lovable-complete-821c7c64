/** Username-based auth helpers (no real email address required). */

export const USERNAME_DOMAIN = "boardbuddy.app";

export const RECOVERY_QUESTIONS = [
  "Aapke best friend ka naam?",
  "Aapke school ka naam?",
  "Aapka favourite subject?",
  "Aapke pet / favourite animal ka naam?",
];

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  return /^[a-z0-9._]{3,20}$/.test(normalizeUsername(value));
}

/** Field-level username check — returns a Hinglish message, or null when valid. */
export function usernameError(value: string): string | null {
  const v = normalizeUsername(value);
  if (!v) return "Username daaliye.";
  if (v.includes(" ")) return "Username mein space nahi ho sakta.";
  if (v.length < 3) return "Username kam se kam 3 characters ka ho.";
  if (v.length > 20) return "Username 20 characters se zyada nahi ho sakta.";
  if (!/^[a-z0-9._]+$/.test(v)) return "Sirf letters, numbers, dot (.) aur underscore (_) allowed hain.";
  if (!/^[a-z0-9]/.test(v)) return "Username letter ya number se shuru hona chahiye.";
  return null;
}

/** Field-level password check — returns a Hinglish message, or null when valid. */
export function passwordError(value: string, username?: string): string | null {
  if (!value) return "Password daaliye.";
  if (value.length < 6) return "Password kam se kam 6 characters ka ho.";
  if (value.length > 72) return "Password 72 characters se zyada nahi ho sakta.";
  if (/\s/.test(value)) return "Password mein space nahi ho sakta.";
  if (username && normalizeUsername(value) === normalizeUsername(username)) {
    return "Password username jaisa nahi ho sakta.";
  }
  return null;
}


/** Login field accepts a username, or an email for the owner account. */
export function identifierToEmail(value: string): string {
  const raw = value.trim();
  if (raw.includes("@")) return raw.toLowerCase();
  return `${normalizeUsername(raw)}@${USERNAME_DOMAIN}`;
}

/** Deterministic hash of the secret answer — the plain answer never leaves the device. */
export async function hashAnswer(username: string, answer: string): Promise<string> {
  const data = new TextEncoder().encode(
    `${normalizeUsername(username)}:${answer.trim().toLowerCase()}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
