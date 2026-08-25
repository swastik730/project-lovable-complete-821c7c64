import { BarChart3, Target } from "lucide-react";
import type { Question } from "@/lib/curriculum";
import { getSubject } from "@/lib/curriculum";

type Row = { key: string; label: string; total: number; correct: number; wrong: number; skipped: number };

function rows(questions: Question[], answers: Record<string, number>, by: (q: Question) => string): Row[] {
  const map = new Map<string, Row>();
  for (const q of questions) {
    const key = by(q);
    const row = map.get(key) ?? { key, label: key, total: 0, correct: 0, wrong: 0, skipped: 0 };
    row.total += 1;
    const chosen = answers[q.id];
    if (chosen === undefined) row.skipped += 1;
    else if (chosen === q.answer) row.correct += 1;
    else row.wrong += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function Table({ title, icon, data }: { title: string; icon: React.ReactNode; data: Row[] }) {
  return (
    <div className="surface mb-4 overflow-hidden">
      <p className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-bold">
        {icon} {title}
      </p>
      <div className="divide-y divide-border">
        {data.map((r) => {
          const pct = Math.round((r.correct / r.total) * 100);
          return (
            <div key={r.key} className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold capitalize">{r.label}</p>
                <span className="shrink-0 text-xs font-extrabold tabular-nums">
                  {r.correct}/{r.total} · {pct}%
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <span className="bg-success" style={{ width: `${(r.correct / r.total) * 100}%` }} />
                <span className="bg-destructive" style={{ width: `${(r.wrong / r.total) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {r.correct} correct · {r.wrong} wrong · {r.skipped} skipped
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResultBreakdown({
  questions,
  answers,
}: {
  questions: Question[];
  answers: Record<string, number>;
}) {
  const bySubject = rows(questions, answers, (q) => getSubject(q.subjectId)?.name ?? q.subjectId);
  const byDifficulty = rows(questions, answers, (q) => q.difficulty);

  return (
    <>
      {bySubject.length > 1 && (
        <Table title="Subject-wise analysis" icon={<BarChart3 className="h-4 w-4 text-primary" />} data={bySubject} />
      )}
      <Table title="Difficulty-wise analysis" icon={<Target className="h-4 w-4 text-primary" />} data={byDifficulty} />
    </>
  );
}
