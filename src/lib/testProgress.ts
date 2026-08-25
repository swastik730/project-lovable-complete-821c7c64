/** Resume-on-refresh storage for an in-progress test run. */

export type RunProgress = {
  runKey: string;
  questionIds: string[];
  answers: Record<string, number>;
  marked: Record<string, boolean>;
  times: Record<string, number>;
  index: number;
  left: number;
  savedAt: number;
};

const PREFIX = "tenbuddy.run.";

export function loadProgress(runKey: string): RunProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + runKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RunProgress;
    if (parsed.runKey !== runKey) return null;
    // Drop stale runs older than 12 hours.
    if (Date.now() - parsed.savedAt > 12 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(p: Omit<RunProgress, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + p.runKey, JSON.stringify({ ...p, savedAt: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

export function clearProgress(runKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + runKey);
  } catch {
    /* storage unavailable */
  }
}
