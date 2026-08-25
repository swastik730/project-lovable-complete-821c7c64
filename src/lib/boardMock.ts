/**
 * Full Board Mock — 80 marks · 3 hours · board pattern.
 *
 * Pattern (MCQ-based, auto-graded):
 *   Section A — 20 questions × 1 mark  (easy)
 *   Section B — 10 questions × 2 marks (medium)
 *   Section C —  8 questions × 3 marks (medium/hard)
 *   Section D —  4 questions × 4 marks (hard)
 *   Total: 42 questions · 80 marks · 180 minutes
 */
import type { Question } from "./curriculum";
import { seededShuffle } from "./questions";

export const BOARD_PATTERN = [
  { section: "A", count: 20, marks: 1, difficulty: "easy" },
  { section: "B", count: 10, marks: 2, difficulty: "medium" },
  { section: "C", count: 8, marks: 3, difficulty: "medium" },
  { section: "D", count: 4, marks: 4, difficulty: "hard" },
] as const;

export const BOARD_TOTAL_QUESTIONS = BOARD_PATTERN.reduce((n, s) => n + s.count, 0);
export const BOARD_TOTAL_MARKS = BOARD_PATTERN.reduce((n, s) => n + s.count * s.marks, 0);
export const BOARD_MINUTES = 180;

/** URL-safe marks pattern, e.g. "20x1,10x2,8x3,4x4" — parsed back by expandMarks. */
export const BOARD_MARKS_PATTERN = BOARD_PATTERN.map((s) => `${s.count}x${s.marks}`).join(",");

/** Expands "20x1,10x2,8x3,4x4" into a per-question marks array. */
export function expandMarks(pattern: string): number[] {
  const out: number[] = [];
  for (const part of pattern.split(",")) {
    const [c, m] = part.split("x").map(Number);
    if (!c || !m) continue;
    for (let i = 0; i < c; i++) out.push(m);
  }
  return out;
}

/**
 * Builds one board-pattern paper for a subject. Prefers matching difficulty per
 * section; backfills from other difficulties when the bank is thin so a paper
 * is always full-length when the subject has enough questions overall.
 */
export function buildBoardPaper(pool: Question[], subjectId: string, seed: number): Question[] {
  const subject = pool.filter((q) => q.subjectId === subjectId);
  if (subject.length < BOARD_TOTAL_QUESTIONS) return [];
  const shuffled = seededShuffle(subject, seed || 1);
  const used = new Set<string>();
  const paper: Question[] = [];

  for (const sec of BOARD_PATTERN) {
    const preferred = shuffled.filter((q) => !used.has(q.id) && q.difficulty === sec.difficulty);
    const rest = shuffled.filter((q) => !used.has(q.id) && q.difficulty !== sec.difficulty);
    const picked = [...preferred, ...rest].slice(0, sec.count);
    picked.forEach((q) => used.add(q.id));
    paper.push(...picked);
  }
  return paper;
}

/** Section label for a question index on a board paper (for the runner header). */
export function sectionForIndex(index: number): { section: string; marks: number } {
  let offset = 0;
  for (const sec of BOARD_PATTERN) {
    if (index < offset + sec.count) return { section: sec.section, marks: sec.marks };
    offset += sec.count;
  }
  return { section: "A", marks: 1 };
}
