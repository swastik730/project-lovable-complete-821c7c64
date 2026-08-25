import { SUBJECTS } from "./curriculum";
import { useAppState } from "./store";

export type ChapterStat = {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectShort: string;
  answered: number;
  correct: number;
  accuracy: number;
  secondsPerQuestion: number;
};

const CHAPTER_INDEX = new Map<string, { name: string; subjectId: string; short: string }>(
  SUBJECTS.flatMap((s) => s.chapters.map((c) => [c.id, { name: c.name, subjectId: s.id, short: s.short }] as const)),
);

/** Phase 6: chapter-wise accuracy + average time per question, from stored attempts. */
export function useChapterStats() {
  const state = useAppState();
  const map = new Map<string, { answered: number; correct: number; seconds: number; count: number }>();

  for (const a of state.attempts) {
    if (!a.chapterId) continue;
    const cur = map.get(a.chapterId) ?? { answered: 0, correct: 0, seconds: 0, count: 0 };
    cur.answered += a.total - a.unanswered;
    cur.correct += a.correct;
    cur.seconds += a.seconds;
    cur.count += a.total;
    map.set(a.chapterId, cur);
  }

  const stats: ChapterStat[] = [];
  for (const [chapterId, v] of map) {
    const meta = CHAPTER_INDEX.get(chapterId);
    stats.push({
      chapterId,
      chapterName: meta?.name ?? chapterId,
      subjectId: meta?.subjectId ?? "",
      subjectShort: meta?.short ?? "—",
      answered: v.answered,
      correct: v.correct,
      accuracy: v.answered ? Math.round((v.correct / v.answered) * 100) : 0,
      secondsPerQuestion: v.count ? Math.round(v.seconds / v.count) : 0,
    });
  }
  return stats;
}

export function useWeakChapters(limit = 5) {
  return useChapterStats()
    .filter((c) => c.answered >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export function useStrongChapters(limit = 3) {
  return useChapterStats()
    .filter((c) => c.answered >= 3)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);
}

/** Average seconds per question across all attempts. */
export function useTimePerQuestion() {
  const state = useAppState();
  const totals = state.attempts.reduce(
    (acc, a) => {
      acc.seconds += a.seconds;
      acc.questions += a.total;
      return acc;
    },
    { seconds: 0, questions: 0 },
  );
  const avg = totals.questions ? totals.seconds / totals.questions : 0;
  return {
    seconds: Math.round(avg),
    label: totals.questions ? `${Math.round(avg)}s` : "—",
    totalMinutes: Math.round(totals.seconds / 60),
    questions: totals.questions,
  };
}
