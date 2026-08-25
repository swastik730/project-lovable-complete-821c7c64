/**
 * Owner-managed NCERT solutions stored in the cloud, merged with the
 * built-in static set so the page still works fully offline.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { NCERT_SOLUTIONS, type NcertSolution } from "@/lib/ncert";

export type NcertRow = {
  id: string;
  subject_id: string;
  chapter_id: string;
  question: string;
  answer: unknown;
  status: string;
  created_at: string;
};

export function toAnswerLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter((v) => v.trim().length > 0);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [];
}

export function rowToSolution(row: NcertRow): NcertSolution {
  return {
    id: row.id,
    subjectId: row.subject_id,
    chapterId: row.chapter_id,
    question: row.question,
    answer: toAnswerLines(row.answer),
  };
}

/** Simple stable hash used for the unique content_hash column. */
export function hashSolution(subjectId: string, chapterId: string, question: string): string {
  const input = `${subjectId}|${chapterId}|${question.trim().toLowerCase()}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    h1 = (h1 ^ input.charCodeAt(i)) * 16777619;
    h2 = (h2 + input.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return `${(h1 >>> 0).toString(16)}${h2.toString(16)}`;
}

export async function fetchNcertRows(all = false): Promise<NcertRow[]> {
  let query = supabase
    .from("ncert_solutions")
    .select("id,subject_id,chapter_id,question,answer,status,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (!all) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as NcertRow[];
}

/** Static solutions plus published cloud solutions added from the owner panel. */
export function useAllNcertSolutions(): { solutions: NcertSolution[]; loading: boolean } {
  const [remote, setRemote] = useState<NcertSolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void fetchNcertRows().then((rows) => {
      if (!alive) return;
      setRemote(rows.map(rowToSolution).filter((s) => s.answer.length > 0));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { solutions: [...NCERT_SOLUTIONS, ...remote], loading };
}
