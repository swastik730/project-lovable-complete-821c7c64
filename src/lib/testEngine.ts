import type { Question } from "./curriculum";
import { SUBJECTS } from "./curriculum";
import { seededShuffle } from "./questions";

export type SeriesTest = {
  id: string;
  title: string;
  subtitle: string;
  subjectId: string | null;
  difficulty: "mixed" | "easy" | "medium" | "hard";
  minutes: number;
  questionIds: string[];
};

/** Fixed seed → SSR and client build exactly the same series (no hydration mismatch). */
const SERIES_SEED = 20260820;

const SUBJECT_TEST_SIZE = 15;
const FULL_TEST_SIZE = 30;
/** How much of a subject's bank may be consumed by subject-only tests. */
const SUBJECT_SHARE = 0.6;

function sortedById(pool: Question[]) {
  return [...pool].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Builds the whole mock-test series out of the question bank.
 *
 * Every test gets its own slice of the bank, so no two tests in the series ever
 * share a question. Adding more questions automatically creates more tests.
 */
export function buildSeries(pool: Question[]): SeriesTest[] {
  const shuffled = seededShuffle(sortedById(pool), SERIES_SEED);
  const used = new Set<string>();
  const subjectTests: SeriesTest[] = [];

  for (const subject of SUBJECTS) {
    const items = shuffled.filter((q) => q.subjectId === subject.id);
    const budget = Math.floor((items.length * SUBJECT_SHARE) / SUBJECT_TEST_SIZE);
    for (let n = 0; n < budget; n++) {
      const slice = items.slice(n * SUBJECT_TEST_SIZE, (n + 1) * SUBJECT_TEST_SIZE);
      if (slice.length < SUBJECT_TEST_SIZE) break;
      slice.forEach((q) => used.add(q.id));
      subjectTests.push({
        id: `t-${subject.id}-${n + 1}`,
        title: `${subject.name} Test ${n + 1}`,
        subtitle: `${subject.short} · chapter mix`,
        subjectId: subject.id,
        difficulty: "mixed",
        minutes: SUBJECT_TEST_SIZE,
        questionIds: slice.map((q) => q.id),
      });
    }
  }

  const rest = shuffled.filter((q) => !used.has(q.id));
  const fullTests: SeriesTest[] = [];
  const fullCount = Math.floor(rest.length / FULL_TEST_SIZE);
  for (let n = 0; n < fullCount; n++) {
    const slice = rest.slice(n * FULL_TEST_SIZE, (n + 1) * FULL_TEST_SIZE);
    slice.forEach((q) => used.add(q.id));
    fullTests.push({
      id: `t-full-${n + 1}`,
      title: `Full Syllabus Mock Test ${n + 1}`,
      subtitle: "All subjects · board pattern",
      subjectId: null,
      difficulty: "mixed",
      minutes: FULL_TEST_SIZE,
      questionIds: slice.map((q) => q.id),
    });
  }

  return [...fullTests, ...subjectTests];
}

export function findTest(pool: Question[], testId: string): SeriesTest | null {
  return buildSeries(pool).find((t) => t.id === testId) ?? null;
}

export function questionsForTest(pool: Question[], test: SeriesTest): Question[] {
  const byId = new Map(pool.map((q) => [q.id, q]));
  return test.questionIds.map((id) => byId.get(id)).filter((q): q is Question => !!q);
}

/**
 * Picks questions for practice/custom tests, always preferring questions the
 * student has never seen before, so back-to-back attempts don't repeat.
 */
export function pickFresh(pool: Question[], count: number, seenIds: Set<string>, seed: number): Question[] {
  const shuffled = seededShuffle(sortedById(pool), seed || 1);
  const fresh = shuffled.filter((q) => !seenIds.has(q.id));
  const rest = shuffled.filter((q) => seenIds.has(q.id));
  return [...fresh, ...rest].slice(0, count);
}
