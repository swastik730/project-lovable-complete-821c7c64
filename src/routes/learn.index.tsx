import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SUBJECTS } from "@/lib/curriculum";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/PageHero";
import heroLearn from "@/assets/hero-learn.webp";
import { SubjectIcon } from "@/components/SubjectIcon";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn — Class 10 Subjects & Chapters | BoardBuddy" },
      {
        name: "description",
        content:
          "Browse every Class 10 subject and chapter — Science, Mathematics, Social Science, English and Hindi — with topics and quick revision.",
      },
      { property: "og:title", content: "Learn — Class 10 Subjects | BoardBuddy" },
      { property: "og:description", content: "Chapter-wise Class 10 syllabus with topics, revision and quizzes." },
    ],
  }),
  component: LearnIndex,
});

function LearnIndex() {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const q = query.trim().toLowerCase();
  const chapterHits = useMemo(() => {
    if (!q) return [];
    return SUBJECTS.flatMap((s) =>
      s.chapters
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.topics.some((t) => t.toLowerCase().includes(q)),
        )
        .map((c) => ({ subject: s, chapter: c })),
    ).slice(0, 8);
  }, [q]);

  const visible = useMemo(
    () =>
      SUBJECTS.filter((s) => (filter === "all" ? true : s.id === filter)).filter((s) =>
        !q ? true : s.name.toLowerCase().includes(q) || s.short.toLowerCase().includes(q),
      ),
    [filter, q],
  );

  return (
    <AppShell title="Learn">
      <PageHero
        eyebrow="Study essentials"
        eyebrowIcon={<BookOpen className="h-3.5 w-3.5" />}
        title="Everything to"
        titleAccent="revise faster"
        description="Class 10 syllabus, chapter by chapter — notes, key points and quick revision in one place."
        image={heroLearn}
        imageAlt="Open book with highlighted notes and a light bulb"
        tint="green"
      />
      <p className="mb-3 text-sm text-muted-foreground">
        Class 10 syllabus, chapter by chapter. Tap a subject to start.
      </p>

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

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ id: "all", short: "All" }, ...SUBJECTS].map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
              filter === chip.id
                ? "brand-gradient text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {chip.id === "all" ? "All" : chip.short}
          </button>
        ))}
      </div>

      {chapterHits.length > 0 && (
        <div className="mb-4 space-y-2">
          <h2 className="text-sm font-bold">Chapters</h2>
          {chapterHits.map(({ subject, chapter }) => (
            <Link
              key={chapter.id}
              to="/learn/$subjectId"
              params={{ subjectId: subject.id }}
              className="surface flex items-center gap-3 p-3.5"
            >
              <SubjectIcon subjectId={subject.id} short={subject.short} name={subject.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{chapter.name}</span>
                <span className="block text-xs text-muted-foreground">{subject.name}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visible.map((s) => {
          const done = s.chapters.filter((c) => state.completedChapters.includes(c.id)).length;
          const pct = Math.round((done / s.chapters.length) * 100);
          return (
            <Link
              key={s.id}
              to="/learn/$subjectId"
              params={{ subjectId: s.id }}
              className="surface flex items-center gap-4 p-4 transition-transform active:scale-[0.99]"
            >
              <SubjectIcon subjectId={s.id} short={s.short} name={s.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">{s.blurb}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {done}/{s.chapters.length}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
