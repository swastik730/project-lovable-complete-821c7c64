import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, PlayCircle, Search, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getSubject, questionsFor } from "@/lib/curriculum";
import { useQuestionPool } from "@/lib/questions";
import { buildSeries } from "@/lib/testEngine";
import { useAppState } from "@/lib/store";

import { SubjectIcon } from "@/components/SubjectIcon";

export const Route = createFileRoute("/learn/$subjectId")({
  loader: ({ params }) => {
    const subject = getSubject(params.subjectId);
    if (!subject) throw notFound();
    return { subject };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Subject not found | BoardBuddy" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.subject.name} — Class 10 Chapters | BoardBuddy`;
    return {
      meta: [
        { title },
        { name: "description", content: `${loaderData.subject.blurb}. Chapter list, topics and practice quizzes for Class 10.` },
        { property: "og:title", content: title },
        { property: "og:description", content: `Class 10 ${loaderData.subject.name} chapters with topics and quizzes.` },
      ],
    };
  },
  component: SubjectPage,
});

function SubjectPage() {
  const { subject } = Route.useLoaderData();
  const state = useAppState();
  const { pool, loading } = useQuestionPool();
  const subjectTests = useMemo(
    () => (loading ? [] : buildSeries(pool).filter((t) => t.subjectId === subject.id).slice(0, 3)),
    [pool, loading, subject.id],
  );
  const done = subject.chapters.filter((c) => state.completedChapters.includes(c.id)).length;
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const chapters = useMemo(
    () =>
      subject.chapters.filter((c, i) =>
        !q
          ? true
          : c.name.toLowerCase().includes(q) ||
            c.topics.some((t) => t.toLowerCase().includes(q)) ||
            `chapter ${i + 1}`.includes(q),
      ),
    [subject.chapters, q],
  );

  return (
    <AppShell title={subject.name}>
      <div className="surface mb-4 p-4">
        <div className="flex items-center gap-3">
          <SubjectIcon subjectId={subject.id} short={subject.short} name={subject.name} size="lg" />
          <div className="min-w-0">
            <p className="text-base font-extrabold">{subject.name}</p>
            <p className="text-xs text-muted-foreground">{subject.chapters.length} chapters</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{subject.blurb}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="brand-gradient h-full rounded-full"
              style={{ width: `${Math.round((done / subject.chapters.length) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold">
            {done}/{subject.chapters.length}
          </span>
        </div>
        <Link
          to="/quiz/$subjectId"
          params={{ subjectId: subject.id }}
          className="brand-gradient mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-primary-foreground"
        >
          <PlayCircle className="h-4 w-4" /> Subject Quiz
        </Link>
      </div>

      {subjectTests.length > 0 && (
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Timer className="h-4 w-4 text-primary" /> {subject.name} Tests
            </h2>
            <Link to="/tests" className="text-xs font-bold text-primary">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {subjectTests.map((t) => (
              <Link
                key={t.id}
                to="/tests/run"
                search={{
                  test: t.id,
                  subject: subject.id,
                  chapter: "all",
                  difficulty: t.difficulty,
                  count: t.questionIds.length,
                  minutes: t.minutes,
                  title: t.title,
                }}
                className="surface flex items-center gap-3 p-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Timer className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{t.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.questionIds.length} questions · {t.minutes} min
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="surface mb-3 flex items-center gap-2 px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters or topics…"
          aria-label="Search chapters"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-3">
        {chapters.length === 0 && (
          <p className="surface p-4 text-center text-xs text-muted-foreground">
            No chapters matched.
          </p>
        )}
        {chapters.map((c) => {
          const i = subject.chapters.indexOf(c);
          const complete = state.completedChapters.includes(c.id);
          const qCount = questionsFor({ subjectId: subject.id, chapterId: c.id }).length;
          return (
            <article key={c.id} className="surface p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Chapter {i + 1}
                    </p>
                    {complete && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                        <CheckCircle2 className="h-3 w-3" /> Covered
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold leading-tight">{c.name}</h2>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.topics.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                  {qCount > 0 ? (
                    <Link
                      to="/quiz/$subjectId"
                      params={{ subjectId: subject.id }}
                      search={{ chapter: c.id }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-accent-foreground"
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> Practice {qCount} questions
                    </Link>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Questions coming soon</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
