import avatar1 from "@/assets/avatars/avatar-1.webp";
import avatar2 from "@/assets/avatars/avatar-2.webp";
import avatar3 from "@/assets/avatars/avatar-3.webp";
import avatar4 from "@/assets/avatars/avatar-4.webp";
import avatar5 from "@/assets/avatars/avatar-5.webp";
import avatar6 from "@/assets/avatars/avatar-6.webp";
import avatar7 from "@/assets/avatars/avatar-7.webp";
import avatar8 from "@/assets/avatars/avatar-8.webp";

/** Bundled avatar image URLs (index 0 = avatar-1). */
export const AVATARS: string[] = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
];

/**
 * Older builds stored avatar URLs pointing at `/src/assets/avatars/avatar-N.png`
 * (or any non-hashed path). Those files no longer exist, so saved profiles
 * rendered a broken image. Map any legacy `avatar-N.*` path back onto the
 * current bundled asset URL.
 */
export function normalizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (AVATARS.includes(url)) return url;
  const match = /avatar-([1-8])\.(png|jpg|jpeg|webp)/i.exec(url);
  if (match) return AVATARS[Number(match[1]) - 1] ?? null;
  // Remote / uploaded avatars are kept as-is.
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return null;
}
