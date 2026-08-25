import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Check, Flame, Lock, Target, Timer, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppState, useStats } from "@/lib/store";
import { TOTAL_CHAPTERS } from "@/lib/curriculum";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements | BoardBuddy" },
      {
        name: "description",
        content:
          "Unlock badges as you study: first quiz, quiz master, study streaks, accuracy champ and full-length test milestones.",
      },
      { property: "og:title", content: "Achievements | BoardBuddy" },
      { property: "og:description", content: "Track the badges you have unlocked on your Class 10 board journey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AchievementsPage,
});

type Filter = "all" | "unlocked" | "locked";

function AchievementsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const state = useAppState();
  const stats = useStats();
  const tests = state.attempts.filter((a) => a.mode === "test").length;

  const list = [
    {
      id: "first",
      icon: Zap,
      label: "First Step",
      hint: "Attempt 10 questions",
      done: stats.questions >= 10,
      progress: Math.min(1, stats.questions / 10),
    },
    {
      id: "quiz-master",
      icon: Trophy,
      label: "Quiz Master",
      hint: "Score 80% in any quiz",
      done: state.attempts.some((a) => a.total > 0 && a.correct / a.total >= 0.8),
      progress: state.attempts.length ? 1 : 0,
    },
    {
      id: "streak3",
      icon: Flame,
      label: "Streak 3",
      hint: "Maintain a 3 day streak",
      done: state.streak >= 3,
      progress: Math.min(1, state.streak / 3),
    },
    {
      id: "accuracy",
      icon: Target,
      label: "Accuracy Champ",
      hint: "Achieve 60% overall accuracy",
      done: stats.answered >= 20 && stats.accuracy >= 60,
      progress: Math.min(1, stats.accuracy / 60),
    },
    {
      id: "test-taker",
      icon: Timer,
      label: "Test Taker",
      hint: "Attempt 5 full tests",
      done: tests >= 5,
      progress: Math.min(1, tests / 5),
    },
    {
      id: "syllabus",
      icon: Award,
      label: "Syllabus Star",
      hint: `Complete all ${TOTAL_CHAPTERS} chapters`,
      done: state.completedChapters.length >= TOTAL_CHAPTERS,
      progress: Math.min(1, state.completedChapters.length / TOTAL_CHAPTERS),
    },
  ];

  const unlocked = list.filter((a) => a.done).length;
  const shown = list.filter((a) => (filter === "all" ? true : filter === "unlocked" ? a.done : !a.done));

  return (
    <AppShell title="Achievements">
      <section className="brand-gradient mb-4 flex items-center gap-4 rounded-3xl p-5 text-primary-foreground">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold">Keep Going! 🔥</h2>
          <p className="text-xs opacity-90">
            You&apos;re on the right track — {unlocked} of {list.length} badges unlocked.
          </p>
        </div>
        <Trophy className="h-12 w-12 shrink-0 opacity-90" />
      </section>

      <div className="surface mb-4 grid grid-cols-3 gap-1 p-1 text-center text-xs font-bold">
        {(["all", "unlocked", "locked"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "rounded-xl py-2 capitalize transition-colors " +
              (filter === f ? "brand-gradient text-primary-foreground" : "text-muted-foreground hover:bg-muted")
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="surface divide-y divide-border">
        {shown.map(({ id, icon: Icon, label, hint, done, progress }) => (
          <div key={id} className="flex items-center gap-3 px-4 py-4">
            <span
              className={
                "grid h-10 w-10 shrink-0 place-items-center rounded-2xl " +
                (done ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")
              }
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{label}</p>
              <p className="text-[11px] text-muted-foreground">{hint}</p>
              {!done ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="brand-gradient h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              ) : null}
            </div>
            {done ? (
              <Check className="h-5 w-5 shrink-0 text-success" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
        {shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">No badges in this filter.</p>
        ) : null}
      </div>
    </AppShell>
  );
}