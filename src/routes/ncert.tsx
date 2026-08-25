import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpenCheck, ChevronDown, Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SUBJECTS } from "@/lib/curriculum";
import { type NcertSolution } from "@/lib/ncert";
import { useAllNcertSolutions } from "@/lib/ncertRemote";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ncert")({
  head: () => ({
    meta: [
      { title: "NCERT Solutions Class 10 — Chapter-wise Answers | BoardBuddy" },
      {
        name: "description",
        content:
          "NCERT Solutions for Class 10 Science, Maths, Social Science, English and Hindi — chapter-wise textbook questions with board-style answers.",
      },
      { property: "og:title", content: "NCERT Solutions Class 10 | BoardBuddy" },
      {
        property: "og:description",
        content: "Chapter-wise NCERT textbook questions and detailed answers for Class 10, available offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NcertPage,
});

function NcertPage() {
  const { solutions: allSolutions } = useAllNcertSolutions();
  const subjectsWithSolutions = useMemo(
    () => SUBJECTS.filter((s) => allSolutions.some((n) => n.subjectId === s.id)),
    [allSolutions],
  );
  const [subjectId, setSubjectId] = useState(subjectsWithSolutions[0]?.id ?? SUBJECTS[0]!.id);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allSolutions) {
      if (s.subjectId !== subjectId) continue;
      map.set(s.chapterId, (map.get(s.chapterId) ?? 0) + 1);
    }
    return map;
  }, [allSolutions, subjectId]);
  const q = query.trim().toLowerCase();

  const searching = q.length > 1;

  const results: NcertSolution[] = useMemo(() => {
    if (!searching) return [];
    return allSolutions.filter(
      (s) =>
        s.question.toLowerCase().includes(q) ||
        s.answer.some((a) => a.toLowerCase().includes(q)),
    ).slice(0, 40);
  }, [allSolutions, q, searching]);

  const chapters = (subject?.chapters ?? []).filter((c) => (counts.get(c.id) ?? 0) > 0);

  const total = allSolutions.length;

  return (
    <AppShell title="NCERT Solutions">
      <header className="surface mb-4 flex items-start gap-3 p-4">
        <span className="brand-gradient grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-primary-foreground">
          <BookOpenCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-extrabold">NCERT Solutions</h1>
          <p className="text-[11px] text-muted-foreground">
            {total} chapter-wise textbook answers, written in board-exam style. Works offline.
          </p>
        </div>
      </header>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any NCERT question…"
          className="h-11 w-full rounded-2xl border border-input bg-card pl-9 pr-9 text-sm font-semibold outline-none focus:border-primary"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {searching ? (
        <>
          <p className="mb-2 text-xs font-bold text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for “{query.trim()}”
          </p>
          <div className="space-y-2.5">
            {results.map((s) => (
              <SolutionRow
                key={s.id}
                solution={s}
                open={openId === s.id}
                onToggle={() => setOpenId((id) => (id === s.id ? null : s.id))}
                caption={SUBJECTS.find((x) => x.id === s.subjectId)?.name ?? s.subjectId}
              />
            ))}
            {results.length === 0 ? (
              <div className="surface p-6 text-center text-sm text-muted-foreground">
                No solution matched that search. Try a keyword from the chapter.
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2">
              {subjectsWithSolutions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSubjectId(s.id);
                    setOpenId(null);
                  }}
                  className={cn(
                    "h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition-colors",
                    s.id === subjectId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {chapters.map((c) => {
              const items = allSolutions.filter((s) => s.subjectId === subjectId && s.chapterId === c.id);
              return (
                <section key={c.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="min-w-0 truncate text-sm font-bold">{c.name}</h2>
                    <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-extrabold text-primary">
                      {items.length} Q
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((s) => (
                      <SolutionRow
                        key={s.id}
                        solution={s}
                        open={openId === s.id}
                        onToggle={() => setOpenId((id) => (id === s.id ? null : s.id))}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            {chapters.length === 0 ? (
              <div className="surface p-6 text-center text-sm text-muted-foreground">
                Solutions for this subject are being added.
              </div>
            ) : null}
          </div>
        </>
      )}
    </AppShell>
  );
}

function SolutionRow({
  solution,
  open,
  onToggle,
  caption,
}: {
  solution: NcertSolution;
  open: boolean;
  onToggle: () => void;
  caption?: string;
}) {
  return (
    <article className="surface overflow-hidden">
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          {caption ? (
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-primary">{caption}</p>
          ) : null}
          <p className="text-sm font-bold leading-snug">{solution.question}</p>
        </div>
        <ChevronDown
          className={cn("mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t border-border bg-muted/40 px-4 py-3">
          <ul className="space-y-1.5">
            {solution.answer.map((line, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
