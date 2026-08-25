import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { QUESTIONS, type Difficulty, type Question } from "./curriculum";

export type BankStatus = "draft" | "review" | "published";

export type BankQuestion = {
  id: string;
  subject_id: string;
  chapter_id: string;
  difficulty: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  status: string;
  source: string | null;
  created_at: string;
};

export function bankToQuestion(row: BankQuestion): Question {
  return {
    id: row.id,
    subjectId: row.subject_id,
    chapterId: row.chapter_id,
    difficulty: (["easy", "medium", "hard"].includes(row.difficulty)
      ? row.difficulty
      : "medium") as Difficulty,
    question: row.question,
    options: row.options,
    answer: row.correct_index,
    explanation: row.explanation ?? "",
    concept: row.source ?? "Question bank",
  };
}

const CACHE_KEY = "boardbuddy.questionbank.v1";

function readCachedBank(): BankQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as BankQuestion[]) : [];
  } catch {
    return [];
  }
}

function writeCachedBank(rows: BankQuestion[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    /* storage full or unavailable */
  }
}

/**
 * Local seed questions + published cloud questions.
 * The cloud bank is mirrored to localStorage so practice keeps working
 * on a weak connection or fully offline.
 */
export function useQuestionPool() {
  const [pool, setPool] = useState<Question[]>(QUESTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const cached = readCachedBank();
    if (cached.length) {
      setPool(dedupeQuestions([...QUESTIONS, ...cached.map(bankToQuestion)]));
      setLoading(false);
    }

    void (async () => {
      try {
        const { data } = await supabase
          .from("questions")
          .select(
            "id,subject_id,chapter_id,difficulty,question,options,correct_index,explanation,status,source,created_at",
          )
          .eq("status", "published")
          .limit(2000);
        if (!active) return;
        const rows = (data ?? []) as unknown as BankQuestion[];
        if (rows.length) writeCachedBank(rows);
        setPool(dedupeQuestions([...QUESTIONS, ...rows.map(bankToQuestion)]));
      } catch {
        // Cloud unavailable — keep seed + cached bank so practice still works.
        if (active) setPool(dedupeQuestions([...QUESTIONS, ...cached.map(bankToQuestion)]));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);


  return { pool, loading };
}

export function filterPool(
  pool: Question[],
  opts: {
    subjectId?: string | undefined;
    chapterId?: string | undefined;
    difficulty?: string | undefined;
  },
) {
  return pool.filter((q) => {
    if (opts.subjectId && opts.subjectId !== "mixed" && q.subjectId !== opts.subjectId)
      return false;
    if (opts.chapterId && opts.chapterId !== "all" && q.chapterId !== opts.chapterId) return false;
    if (opts.difficulty && opts.difficulty !== "mixed" && q.difficulty !== opts.difficulty)
      return false;
    return true;
  });
}

/**
 * Removes duplicates from a question list — both by id and by the actual
 * question text, so the same question imported twice (local seed bank + cloud
 * bank) can never appear twice in one paper.
 */
export function dedupeQuestions(list: Question[]): Question[] {
  const seenIds = new Set<string>();
  const seenText = new Set<string>();
  const out: Question[] = [];
  for (const q of list) {
    const text = q.question.replace(/\s+/g, " ").trim().toLowerCase();
    if (seenIds.has(q.id) || seenText.has(text)) continue;
    seenIds.add(q.id);
    seenText.add(text);
    out.push(q);
  }
  return out;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** Deterministic PRNG so SSR and the client render the same question order. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed || 1);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/**
 * Returns 0 during SSR + first client render (identical markup, no hydration
 * mismatch), then a random seed after mount so each attempt is freshly shuffled.
 */
export function useShuffleSeed() {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1_000_000) + 1);
  }, []);
  return [seed, () => setSeed(Math.floor(Math.random() * 1_000_000) + 1)] as const;
}
