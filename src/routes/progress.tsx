import { createFileRoute, Link } from "@tanstack/react-router";
import { AlarmClock, Award, BarChart3, Flame, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SyncPrompt } from "@/components/SyncPrompt";
import { SUBJECTS, TOTAL_CHAPTERS } from "@/lib/curriculum";
import { useStrongChapters, useTimePerQuestion, useWeakChapters } from "@/lib/analytics";
import { useAppState, useStats, useSubjectAccuracy } from "@/lib/store";
import { PageHero } from "@/components/PageHero";
import { SUBJECT_TINTS } from "@/lib/subjectIcons";
import heroProgress from "@/assets/hero-progress.webp";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress & Analysis | BoardBuddy" },
      {
        name: "description",
        content:
          "Track your Class 10 board preparation: accuracy, subject-wise strength, streak, XP, syllabus completion and recent attempts.",
      },
      { property: "og:title", content: "Progress & Analysis | BoardBuddy" },
      { property: "og:description", content: "Real progress tracking for Class 10 board preparation." },
    ],
  }),
  component: ProgressPage,
});

const ACHIEVEMENTS = [
  { id: "first", label: "First Quiz", test: (a: number) => a >= 1 },
  { id: "ten", label: "10 Quizzes", test: (a: number) => a >= 10 },
  { id: "streak7", label: "7 Day Streak", test: (_: number, s = 0) => s >= 7 },
];

function ProgressPage() {
  const state = useAppState();
  const stats = useStats();
  const acc = useSubjectAccuracy();
  const weak = useWeakChapters();
  const strong = useStrongChapters();
  const timing = useTimePerQuestion();
  const syllabus = Math.round((state.completedChapters.length / TOTAL_CHAPTERS) * 100);

  return (
    <AppShell title="Progress">
      <PageHero
        eyebrow="Your progress"
        eyebrowIcon={<TrendingUp className="h-3.5 w-3.5" />}
        title="See yourself"
        titleAccent="getting better"
        description="Accuracy, streak, XP and syllabus completion — all your board prep in one view."
        image={heroProgress}
        imageAlt="Progress chart illustration with rising bars"
        tint="green"
      />
      <SyncPrompt className="mb-4" />

      {/* Headline stat strip — one color per metric */}
      <div className="surface mb-4 overflow-hidden p-0">
        <div className="hero-panel-green px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{state.name}</p>
              <p className="text-xs text-muted-foreground">Class 10 · Board 2027 batch</p>
            </div>
            <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] font-bold text-hero-green">
              {stats.attempts} attempts
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 p-4">
          <Metric
            tile="bg-warning-soft"
            icon={<Flame className="h-4 w-4 text-warning" />}
            value={`${state.streak}`}
            label="Day streak"
          />
          <Metric
            tile="bg-reward-soft"
            icon={<Award className="h-4 w-4 text-reward" />}
            value={`${state.xp}`}
            label="XP earned"
          />
          <Metric
            tile="bg-success-soft"
            icon={<Target className="h-4 w-4 text-success" />}
            value={`${stats.accuracy}%`}
            label="Accuracy"
          />
        </div>
      </div>

      {/* Syllabus completion with gold accent */}
      <div className="surface mb-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Syllabus Completion</h2>
          <span className="gold-text text-lg font-extrabold">{syllabus}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${syllabus}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {state.completedChapters.length} of {TOTAL_CHAPTERS} chapters covered
        </p>
      </div>

      <SectionTitle icon={<BarChart3 className="h-4 w-4" />} tint="bg-hero-green/10 text-hero-green">
        This Week
      </SectionTitle>
      <WeeklyChart attempts={state.attempts} />

      <SectionTitle icon={<TrendingUp className="h-4 w-4" />} tint="bg-primary-soft text-primary">
        Subject-wise Accuracy
      </SectionTitle>
      <div className="surface mb-4 divide-y divide-border p-1">
        {SUBJECTS.map((s) => {
          const d = acc.get(s.id);
          const pct = d && d.answered ? Math.round((d.correct / d.answered) * 100) : 0;
          const tint = SUBJECT_TINTS[s.id] ?? "bg-primary-soft";
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-extrabold ${tint}`}
              >
                {s.short}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-destructive"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs font-bold">{d?.answered ? `${pct}%` : "—"}</span>
            </div>
          );
        })}
      </div>

      <SectionTitle icon={<AlarmClock className="h-4 w-4" />} tint="bg-primary-soft text-primary">
        Speed & Timing
      </SectionTitle>
      <div className="surface mb-4 grid grid-cols-3 gap-2.5 p-4 text-center">
        <Metric tile="bg-primary-soft" icon={<AlarmClock className="h-4 w-4 text-primary" />} value={timing.label} label="Per question" />
        <Metric tile="bg-success-soft" icon={<Target className="h-4 w-4 text-success" />} value={`${timing.questions}`} label="Questions" />
        <Metric tile="bg-warning-soft" icon={<Flame className="h-4 w-4 text-warning" />} value={`${timing.totalMinutes}m`} label="Study time" />
      </div>

      <SectionTitle icon={<TrendingDown className="h-4 w-4" />} tint="bg-destructive/10 text-destructive">
        Weak Chapters
      </SectionTitle>
      {weak.length === 0 ? (
        <div className="surface mb-4 p-5 text-center text-xs text-muted-foreground">
          Attempt 3+ questions per chapter — your weak chapters and revision plan will appear here.
        </div>
      ) : (
        <div className="surface mb-4 divide-y divide-border">
          {weak.map((c) => (
            <div key={c.chapterId} className="flex items-center gap-3 px-4 py-3">
              <span className="w-10 text-[11px] font-extrabold text-muted-foreground">{c.subjectShort}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.chapterName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {c.correct}/{c.answered} correct · {c.secondsPerQuestion}s per question
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                  c.accuracy >= 70 ? "bg-success-soft text-success" : c.accuracy >= 40 ? "bg-warning-soft text-warning" : "bg-destructive/10 text-destructive"
                }`}
              >
                {c.accuracy}%
              </span>
            </div>
          ))}
        </div>
      )}

      {strong.length > 0 && (
        <>
          <SectionTitle icon={<Sparkles className="h-4 w-4" />} tint="bg-success-soft text-success">
            Strong Chapters
          </SectionTitle>
          <div className="surface mb-4 divide-y divide-border">
            {strong.map((c) => (
              <div key={c.chapterId} className="flex items-center gap-3 px-4 py-3">
                <span className="w-10 text-[11px] font-extrabold text-muted-foreground">{c.subjectShort}</span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{c.chapterName}</p>
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-extrabold text-success">
                  {c.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-bold">Achievements</h2>
        <Link to="/achievements" className="text-xs font-semibold text-primary">
          View all
        </Link>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = a.test(stats.attempts, state.streak);
          return (
            <div
              key={a.id}
              className={`surface p-3 text-center ${unlocked ? "ring-1 ring-reward/40" : "opacity-50"}`}
            >
              <span
                className={`mx-auto grid h-9 w-9 place-items-center rounded-full ${
                  unlocked ? "gold-gradient" : "bg-achievement-soft text-achievement"
                }`}
              >
                <Award className="h-4 w-4" />
              </span>
              <p className="mt-2 text-[11px] font-bold leading-tight">{a.label}</p>
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 text-base font-bold">Recent Attempts</h2>
      {state.attempts.length === 0 ? (
        <div className="surface p-6 text-center">
          <p className="text-sm font-semibold">No attempts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Finish your first quiz to unlock analysis.</p>
          <Link to="/practice" className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground">
            Start practising
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {state.attempts.slice(0, 12).map((a) => {
            const pct = Math.round((a.correct / a.total) * 100);
            return (
              <div key={a.id} className="surface flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="text-sm font-bold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                    {a.correct}/{a.total} correct
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    pct >= 80
                      ? "bg-success-soft text-success"
                      : pct >= 50
                        ? "bg-warning-soft text-warning"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function SectionTitle({
  icon,
  tint,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
      <span className={`grid h-7 w-7 place-items-center rounded-lg ${tint}`}>{icon}</span>
      {children}
    </h2>
  );
}

function Metric({
  icon,
  value,
  label,
  tile = "bg-muted",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tile?: string;
}) {
  return (
    <div className={`rounded-xl px-2 py-3 ${tile}`}>
      <span className="mx-auto mb-1 grid h-7 w-7 place-items-center">{icon}</span>
      <p className="text-base font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function WeeklyChart({ attempts }: { attempts: { date: string; total: number }[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const count = attempts
      .filter((a) => a.date.slice(0, 10) === key)
      .reduce((n, a) => n + a.total, 0);
    return { label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()] ?? "", count, today: i === 6 };
  });
  const max = Math.max(10, ...days.map((d) => d.count));

  return (
    <div className="surface mb-4 p-5">
      <div className="flex h-32 items-end gap-2">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <span className={`text-[10px] font-bold ${d.count ? "text-foreground" : "text-muted-foreground"}`}>
              {d.count || ""}
            </span>
            <div className="flex h-full w-full items-end overflow-hidden rounded-lg bg-muted">
              <div
                className={`w-full rounded-lg transition-all ${d.today ? "gold-gradient" : "brand-gradient"}`}
                style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold ${d.today ? "text-reward" : "text-muted-foreground"}`}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">Questions attempted per day (last 7 days)</p>
    </div>
  );
}
