import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bookmark,
  CalendarDays,
  Flame,
  LayoutGrid,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { SyncPrompt } from "@/components/SyncPrompt";
import heroHome from "@/assets/hero-home.webp";
import { SubjectIcon } from "@/components/SubjectIcon";
import { useSession } from "@/lib/auth";
import { SUBJECTS, TOTAL_CHAPTERS } from "@/lib/curriculum";
import { useGreeting, useAppState, useStats, useTodayCount } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BoardBuddy — Class 10 Board Exam Preparation" },
      {
        name: "description",
        content:
          "BoardBuddy is a Class 10 board preparation app: chapter-wise quizzes, mock tests, revision notes, 3D science models, progress tracking and daily goals.",
      },
      { property: "og:title", content: "BoardBuddy — Your Smart Board Exam Partner" },
      {
        property: "og:description",
        content: "Class 10 board prep made simple: learn, practice, and track your improvement every day.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const state = useAppState();
  const hello = useGreeting();
  const stats = useStats();
  const today = useTodayCount();
  const { user } = useSession();
  const chapterProgress = Math.round((state.completedChapters.length / TOTAL_CHAPTERS) * 100);
  const goalPct = Math.min(100, Math.round((today / state.dailyGoal) * 100));

  return (
    <AppShell>
      <PageHero
        eyebrow={`${hello}, ${state.name}`}
        eyebrowIcon={<Sparkles className="h-3.5 w-3.5" />}
        title="Let's make today count"
        titleAccent="for your Class 10 boards"
        description={
          user
            ? "Finish today's target — your progress is safe in the cloud."
            : "Learn chapter-wise, practise daily and watch your score climb."
        }
        image={heroHome}
        imageAlt="Class 10 student studying at a desk"
        tint="blue"
        compact
        priority
      >
        <div className="surface inline-flex items-center gap-3 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
            <Flame className="h-4 w-4 text-warning" /> {state.streak}
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">
              day streak
            </span>
          </span>
          <Link to="/leaderboard" className="text-xs font-bold text-primary">
            Leaderboard
          </Link>
        </div>
      </PageHero>


      <Link
        to="/practice"
        className="goal-hero relative mb-5 flex items-center gap-4 overflow-hidden rounded-3xl p-5"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-primary-foreground/70">Today&apos;s Goal</p>
          <p className="mt-1 text-2xl font-extrabold text-primary-foreground">
            {today} / {state.dailyGoal}
          </p>
          <p className="text-sm font-semibold text-primary-foreground/70">Questions</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full bg-primary" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="mt-2 text-[11px] font-medium text-primary-foreground/70">
            {goalPct >= 100 ? "You did it! Keep it up 🔥" : "Keep going — almost there! 🔥"}
          </p>
        </div>
        <GoalRing pct={goalPct} />
        <ArrowRight className="h-4 w-4 shrink-0 text-primary-foreground/70" />
      </Link>

      <section className="mb-5 grid grid-cols-3 gap-3">
        <StatCard icon={<Flame className="h-4 w-4 text-warning" />} tint="warning" label="Day Streak" value={`${state.streak}`} />
        <StatCard icon={<Trophy className="h-4 w-4 text-reward" />} tint="reward" label="XP Earned" value={`${state.xp}`} />
        <StatCard icon={<Target className="h-4 w-4 text-primary" />} tint="primary" label="Accuracy" value={`${stats.accuracy}%`} />
      </section>

      <section className="mb-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold">Quick Access</h2>
          <Link to="/more" className="text-xs font-semibold text-primary">Edit</Link>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <QuickLink to="/practice" label="Chapter Quiz" icon={<BookOpenCheck className="h-5 w-5" />} />
          <QuickLink to="/tests" label="Mock Tests" icon={<Timer className="h-5 w-5" />} />
          <QuickLink to="/bookmarks" label="Bookmarks" icon={<Bookmark className="h-5 w-5" />} />
          <QuickLink to="/analysis" label="My Analysis" icon={<Target className="h-5 w-5" />} />
        </div>
      </section>

      <section className="mb-5">
        <SectionTitle title="Subjects" to="/learn" />
        <div className="surface divide-y divide-border">
          {SUBJECTS.map((s) => {
            const done = s.chapters.filter((c) => state.completedChapters.includes(c.id)).length;
            const pct = Math.round((done / s.chapters.length) * 100);
            return (
              <Link
                key={s.id}
                to="/learn/$subjectId"
                params={{ subjectId: s.id }}
                className="flex items-center gap-3 p-3.5"
              >
                <SubjectIcon subjectId={s.id} short={s.short} name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.chapters.length} Chapters</p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{pct}%</span>
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Syllabus completion: {chapterProgress}%
        </p>
      </section>

      <SyncPrompt className="mb-5" />


      <section className="surface mb-5 overflow-hidden p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-achievement">
          <Zap className="h-4 w-4" /> Daily Challenge
        </div>
        <h2 className="mt-2 text-lg font-extrabold">10 Mixed Questions</h2>
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> 10 minutes
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-reward">
            <Trophy className="h-3.5 w-3.5" /> +20 XP
          </span>
        </div>
        <Link
          to="/quiz/$subjectId"
          params={{ subjectId: "mixed" }}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-border bg-secondary py-3 text-sm font-bold text-secondary-foreground transition-colors hover:bg-accent"
        >
          Start Challenge
        </Link>
      </section>

      <Link to="/learn" className="goal-hero relative mb-5 flex items-center gap-4 overflow-hidden rounded-3xl p-5">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-primary-foreground">Revision Notes</p>
          <p className="mt-1 text-xs text-primary-foreground/70">Chapter-wise concepts, short &amp; exam-ready</p>
          <span className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-xs font-bold text-primary-foreground">
            Start Revising
          </span>
        </div>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-foreground/15">
          <BookOpenCheck className="h-8 w-8 text-primary-foreground" />
        </span>
      </Link>




      <section className="mb-5">
        <SectionTitle title="Practice Zone" to="/practice" />
        <div className="grid grid-cols-2 gap-3">
          <TileLink to="/practice" label="Chapter Quiz" hint="Topic-wise MCQs" tint="primary" icon={<BookOpenCheck className="h-4 w-4" />} />
          <TileLink to="/practice" label="Mock Tests" hint="Full board pattern" tint="warning" icon={<Timer className="h-4 w-4" />} />
          <TileLink to="/bookmarks" label="Bookmarks" hint={`${state.bookmarks.length} saved`} tint="achievement" icon={<Bookmark className="h-4 w-4" />} />
          <TileLink to="/analysis" label="My Analysis" hint={`${stats.accuracy}% accuracy`} tint="success" icon={<Target className="h-4 w-4" />} />
        </div>
      </section>

      {!user && (
        <section className="surface relative mb-5 overflow-hidden p-5 text-center">
          <div
            aria-hidden
            className="brand-gradient pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full opacity-20 blur-2xl"
          />
          <h2 className="relative text-lg font-extrabold">Never lose your progress</h2>
          <p className="relative mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
            Create your account — your streak, bookmarks and test analysis sync across every device.
          </p>
          <Link
            to="/auth"
            className="brand-gradient relative mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Create account <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Made for Class 10 board students · Built for the 2026 boards
      </p>

    </AppShell>
  );
}

function QuickLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform active:scale-95">
        {icon}
      </span>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </Link>
  );
}

function SectionTitle({ title, to }: { title: string; to: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      <Link to={to} className="text-xs font-semibold text-primary">
        View all
      </Link>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: "warning" | "primary" | "success" | "reward";
}) {
  const bg = {
    warning: "bg-warning-soft",
    primary: "bg-primary-soft",
    success: "bg-success-soft",
    reward: "bg-reward-soft",
  }[tint];
  return (
    <div className="surface p-3 text-center">
      <span className={`mx-auto grid h-9 w-9 place-items-center rounded-full ${bg}`}>{icon}</span>
      <p className="mt-2 text-base font-extrabold">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function GoalRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-primary-foreground/20" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        className="stroke-success transition-all duration-500"
        strokeDasharray={c}
        strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
      />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        transform="rotate(90 32 32)"
        className="fill-primary-foreground text-[14px] font-extrabold"
      >
        {pct}%
      </text>
    </svg>
  );
}

const TILE_TINTS = {
  primary: { card: "bg-primary-soft/60 border-primary/20", icon: "bg-primary text-primary-foreground" },
  warning: { card: "bg-warning-soft/70 border-warning/25", icon: "bg-warning text-primary-foreground" },
  achievement: { card: "bg-achievement-soft/70 border-achievement/25", icon: "bg-achievement text-primary-foreground" },
  success: { card: "bg-success-soft/70 border-success/25", icon: "bg-success text-primary-foreground" },
} as const;

function TileLink({
  to,
  label,
  hint,
  icon,
  tint = "primary",
}: {
  to: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  tint?: keyof typeof TILE_TINTS;
}) {
  const t = TILE_TINTS[tint];
  return (
    <Link
      to={to}
      className={`flex flex-col gap-1 rounded-2xl border p-4 shadow-sm transition-transform active:scale-[0.98] ${t.card}`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl shadow-sm ${t.icon}`}>{icon}</span>
      <p className="mt-1 text-sm font-bold">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
