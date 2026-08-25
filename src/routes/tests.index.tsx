import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList, CheckCircle2, ChevronRight, Loader2, RotateCcw, Sliders, Timer, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SUBJECTS, getSubject } from "@/lib/curriculum";
import { filterPool, useQuestionPool } from "@/lib/questions";
import { buildSeries } from "@/lib/testEngine";
import { useAppState } from "@/lib/store";
import { PageHero } from "@/components/PageHero";
import { SUBJECT_ICONS } from "@/lib/subjectIcons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import heroTests from "@/assets/hero-tests.webp";
import tilesTests from "@/assets/tiles/tests.webp";

/** Rotating colorful panel tints for the auto-generated test series cards. */
const CARD_PANELS = ["test-panel", "amber-panel", "purple-panel"] as const;

/** Colorful chip styling per difficulty in the custom test builder. */
const DIFFICULTY_CHIPS: Record<string, { active: string; idle: string }> = {
  mixed: {
    active: "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-card)]",
    idle: "border-input bg-primary-soft/40 text-primary",
  },
  easy: {
    active: "border-transparent bg-hero-green text-background shadow-[var(--shadow-card)]",
    idle: "border-input bg-success-soft/50 text-hero-green",
  },
  medium: {
    active: "border-transparent bg-hero-amber text-background shadow-[var(--shadow-card)]",
    idle: "border-input bg-warning-soft/50 text-hero-amber",
  },
  hard: {
    active: "border-transparent bg-hero-purple text-background shadow-[var(--shadow-card)]",
    idle: "border-input bg-reward-soft/50 text-hero-purple",
  },
};

export const Route = createFileRoute("/tests/")({
  head: () => ({
    meta: [
      { title: "Mock Tests & Custom Test Builder | BoardBuddy" },
      {
        name: "description",
        content:
          "Class 10 mock test series with timer, question palette and auto-submit — every test has a different question set, plus a custom test builder.",
      },
      { property: "og:title", content: "Mock Tests — Class 10 | BoardBuddy" },
      {
        property: "og:description",
        content: "Auto-generated mock test series with non-repeating questions and instant analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestsPage,
});

function TestsPage() {
  const navigate = useNavigate();
  const { pool, loading } = useQuestionPool();
  const state = useAppState();
  const [subjectId, setSubjectId] = useState("mixed");
  const [chapterId, setChapterId] = useState("all");
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(15);
  const [minutes, setMinutes] = useState(20);

  const series = useMemo(() => (loading ? [] : buildSeries(pool)), [pool, loading]);

  const attemptsByTest = useMemo(() => {
    const map = new Map<string, { count: number; best: number }>();
    for (const a of state.attempts) {
      if (!a.testId) continue;
      const pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
      const prev = map.get(a.testId);
      map.set(a.testId, { count: (prev?.count ?? 0) + 1, best: Math.max(prev?.best ?? 0, pct) });
    }
    return map;
  }, [state.attempts]);

  const chapters = useMemo(() => (subjectId === "mixed" ? [] : (getSubject(subjectId)?.chapters ?? [])), [subjectId]);
  const available = useMemo(
    () => filterPool(pool, { subjectId, chapterId, difficulty }).length,
    [pool, subjectId, chapterId, difficulty],
  );

  return (
    <AppShell title="Mock Tests">
      <PageHero
        eyebrow="Exams"
        eyebrowIcon={<ClipboardList className="h-3.5 w-3.5" />}
        title="Test"
        titleAccent="like board day"
        description="Timed, full-length and board-pattern — everything you need before the real paper."
        image={heroTests}
        imageAlt="Exam clipboard with answer sheet and stopwatch"
        tint="amber"
      />
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
        <Trophy className="h-4 w-4 text-hero-amber" /> Test Series
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Tests are generated automatically from the question bank — no question repeats across any two tests.
      </p>
      <div className="mb-6 space-y-3">
        {loading ? (
          <p className="surface flex items-center justify-center gap-2 p-5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building your test series…
          </p>
        ) : series.length === 0 ? (
          <p className="surface p-5 text-center text-xs text-muted-foreground">
            At least 30 questions are needed in the question bank to build tests. Add questions from the owner panel.
          </p>
        ) : (
          series.map((t, i) => {
            const done = attemptsByTest.get(t.id);
            const panel = CARD_PANELS[i % CARD_PANELS.length];
            const subject = t.subjectId ? getSubject(t.subjectId) : undefined;
            const icon = t.subjectId ? SUBJECT_ICONS[t.subjectId] : undefined;
            return (
              <Link
                key={t.id}
                to="/tests/run"
                search={{
                  test: t.id,
                  subject: t.subjectId ?? "mixed",
                  chapter: "all",
                  difficulty: t.difficulty,
                  count: t.questionIds.length,
                  minutes: t.minutes,
                  title: t.title,
                }}
                className={`${panel} flex items-center gap-4 p-4 shadow-[var(--shadow-card)] transition-transform active:scale-[0.99]`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-background/70">
                  <img
                    src={icon ?? tilesTests}
                    alt={subject ? `${subject.name} test` : "Mock test"}
                    width={512}
                    height={512}
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-10 object-contain drop-shadow"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{t.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <ClipboardList className="h-3 w-3" /> {t.questionIds.length} Q
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold text-hero-purple">
                      <Timer className="h-3 w-3" /> {t.minutes} min
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold text-hero-amber capitalize">
                      {t.subtitle}
                    </span>
                  </div>
                  {done && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-success">
                      <CheckCircle2 className="h-3 w-3" /> <RotateCcw className="h-3 w-3" /> Re-attempt · best{" "}
                      {done.best}%
                      {done.count > 1 ? ` · ${done.count} attempts` : ""}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })
        )}
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <Sliders className="h-4 w-4 text-hero-amber" /> Custom Test Builder
      </h2>
      <div className="surface space-y-4 p-5">
        <Field label="Subject">
          <Select
            value={subjectId}
            onValueChange={(value) => {
              setSubjectId(value);
              setChapterId("all");
            }}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-input bg-background text-sm">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent className="z-[60] max-h-72">
              <SelectItem value="mixed">All subjects</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {chapters.length > 0 && (
          <Field label="Chapter">
            <Select value={chapterId} onValueChange={(value) => setChapterId(value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-input bg-background text-sm">
                <SelectValue placeholder="All chapters" />
              </SelectTrigger>
              <SelectContent className="z-[60] max-h-72">
                <SelectItem value="all">All chapters</SelectItem>
                {chapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}


        <Field label="Difficulty">
          <div className="grid grid-cols-4 gap-2">
            {["mixed", "easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={
                  "h-10 rounded-xl border text-xs font-bold capitalize transition-all active:scale-95 " +
                  (difficulty === d ? (DIFFICULTY_CHIPS[d]?.active ?? "") : (DIFFICULTY_CHIPS[d]?.idle ?? ""))
                }
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Questions — ${count}`}>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
          />
        </Field>

        <Field label={`Duration — ${minutes} min`}>
          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
          />
        </Field>

        <p className="text-xs text-muted-foreground">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading question bank…
            </span>
          ) : (
            `${available} questions available in this filter — the ones you have never attempted come first.`
          )}
        </p>

        <button
          type="button"
          disabled={available === 0}
          onClick={() =>
            void navigate({
              to: "/tests/run",
              search: {
                test: "",
                subject: subjectId,
                chapter: chapterId,
                difficulty,
                count,
                minutes,
                title: "Custom Test",
              },
            })
          }
          className="brand-gradient h-12 w-full rounded-xl text-sm font-bold text-primary-foreground shadow-[var(--shadow-card)] transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          Start test
        </button>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
