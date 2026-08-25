import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Difficulty } from "./curriculum";
import { normalizeAvatarUrl } from "./avatars";

export type Attempt = {
  id: string;
  mode: "quiz" | "test" | "challenge";
  label: string;
  subjectId: string;
  chapterId?: string | undefined;
  /** Series test id (e.g. "t-full-1") when this attempt came from the test series. */
  testId?: string | undefined;
  total: number;
  correct: number;
  unanswered: number;
  seconds: number;
  date: string;
  perQuestion: { questionId: string; difficulty: Difficulty; correct: boolean }[];
};

export type Plan = "free" | "premium";

export type SyncStatus = "offline" | "syncing" | "synced" | "error";

export type Sink = {
  onProfileChange: () => void;
  onAttempt: (attempt: Attempt) => void;
  onBookmark: (questionId: string, added: boolean) => void;
  onChapter: (chapterId: string, done: boolean) => void;
  onReset: () => void;
};

export type AppState = {
  name: string;
  avatarUrl: string | null;
  onboarded: boolean;
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  dailyGoal: number;
  todayCount: number;
  todayDate: string | null;
  attempts: Attempt[];
  bookmarks: string[];
  completedChapters: string[];
  plan: Plan;
  planSince: string | null;
};

const KEY = "tenbuddy.state.v1";

const initial: AppState = {
  name: "Student",
  avatarUrl: null,
  onboarded: false,
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  dailyGoal: 20,
  todayCount: 0,
  todayDate: null,
  attempts: [],
  bookmarks: [],
  completedChapters: [],
  plan: "free",
  planSince: null,
};

let state: AppState = initial;
let hydrated = false;
const listeners = new Set<() => void>();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function read(): AppState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = { ...initial, ...(JSON.parse(raw) as Partial<AppState>) };
    // Legacy saves may point at removed .png avatar files — remap them.
    parsed.avatarUrl = normalizeAvatarUrl(parsed.avatarUrl);
    return parsed;
  } catch {
    return initial;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function write(next: AppState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = read();
    queueMicrotask(emit);
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}

export function update(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  write({ ...state, ...next });
  sink?.onProfileChange();
}

/* ---------------- cloud sync plumbing ---------------- */

let sink: Sink | null = null;
let syncStatus: SyncStatus = "offline";
const syncListeners = new Set<() => void>();

export function registerSink(next: Sink) {
  sink = next;
}

export function getState() {
  return state;
}

export function setSyncStatus(next: SyncStatus) {
  syncStatus = next;
  syncListeners.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      syncListeners.add(l);
      return () => syncListeners.delete(l);
    },
    () => syncStatus,
    () => "offline" as SyncStatus,
  );
}

/** Replace local state with the merged cloud snapshot (no push-back loop). */
export function applyCloudSnapshot(snapshot: Partial<AppState>) {
  write({ ...state, ...snapshot });
}

function bumpStreak(s: AppState): Pick<AppState, "streak" | "lastStudyDate"> {
  const today = todayKey();
  if (s.lastStudyDate === today) return { streak: s.streak, lastStudyDate: today };
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return { streak: s.lastStudyDate === yest ? s.streak + 1 : 1, lastStudyDate: today };
}

export function recordAttempt(attempt: Omit<Attempt, "id" | "date">) {
  const full: Attempt = { ...attempt, id: crypto.randomUUID(), date: new Date().toISOString() };
  // A chapter counts as covered once the student has practised it and got at
  // least half of the questions right — there is no manual tick button.
  const chapterId = attempt.chapterId;
  const earnsChapter =
    !!chapterId &&
    attempt.total > 0 &&
    attempt.correct * 2 >= attempt.total &&
    !state.completedChapters.includes(chapterId);

  update((s) => {
    const today = todayKey();
    const sameDay = s.todayDate === today;
    return {
      attempts: [full, ...s.attempts].slice(0, 200),
      xp: s.xp + attempt.correct * 10 + 5,
      todayDate: today,
      todayCount: (sameDay ? s.todayCount : 0) + attempt.total,
      completedChapters:
        earnsChapter && chapterId ? [chapterId, ...s.completedChapters] : s.completedChapters,
      ...bumpStreak(s),
    };
  });
  sink?.onAttempt(full);
  if (earnsChapter && chapterId) sink?.onChapter(chapterId, true);
}


export function toggleBookmark(questionId: string) {
  const added = !state.bookmarks.includes(questionId);
  update((s) => ({
    bookmarks: added ? [questionId, ...s.bookmarks] : s.bookmarks.filter((b) => b !== questionId),
  }));
  sink?.onBookmark(questionId, added);
}

export function toggleChapterDone(chapterId: string) {
  const done = !state.completedChapters.includes(chapterId);
  update((s) => ({
    completedChapters: done
      ? [chapterId, ...s.completedChapters]
      : s.completedChapters.filter((c) => c !== chapterId),
  }));
  sink?.onChapter(chapterId, done);
}

export function resetProgress() {
  write({ ...initial, name: state.name, avatarUrl: state.avatarUrl, onboarded: state.onboarded });
  sink?.onReset();
}

/** Wipe device state on sign-out so the next account starts clean. */
export function clearLocalState() {
  write({ ...initial });
}

export function useTodayCount() {
  const s = useAppState();
  return s.todayDate === todayKey() ? s.todayCount : 0;
}

/** Every question id the student has ever attempted — used to avoid repeats. */
export function useSeenQuestionIds() {
  const s = useAppState();
  const ids = new Set<string>();
  for (const a of s.attempts) for (const q of a.perQuestion) ids.add(q.questionId);
  return ids;
}

export function useStats() {
  const s = useAppState();
  const totals = s.attempts.reduce(
    (acc, a) => {
      acc.answered += a.total - a.unanswered;
      acc.correct += a.correct;
      acc.questions += a.total;
      acc.seconds += a.seconds;
      return acc;
    },
    { answered: 0, correct: 0, questions: 0, seconds: 0 },
  );
  const accuracy = totals.answered ? Math.round((totals.correct / totals.answered) * 100) : 0;
  return { ...totals, accuracy, attempts: s.attempts.length };
}

export function useSubjectAccuracy() {
  const s = useAppState();
  const map = new Map<string, { correct: number; answered: number }>();
  for (const a of s.attempts) {
    const cur = map.get(a.subjectId) ?? { correct: 0, answered: 0 };
    cur.correct += a.correct;
    cur.answered += a.total - a.unanswered;
    map.set(a.subjectId, cur);
  }
  return map;
}

export function useSetName() {
  return useCallback((name: string) => update({ name: name.trim() || "Student", onboarded: true }), []);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Time-based greeting, computed only after hydration to avoid SSR mismatch. */
export function useGreeting() {
  const [text, setText] = useState("Hello");
  useEffect(() => setText(greeting()), []);
  return text;
}

/** Phase 7: premium switch (device-level plan flag). */
export function setPlan(plan: Plan) {
  update({ plan, planSince: plan === "premium" ? new Date().toISOString() : null });
}

export function usePlan() {
  const s = useAppState();
  return { plan: s.plan, isPremium: s.plan === "premium", since: s.planSince };
}
