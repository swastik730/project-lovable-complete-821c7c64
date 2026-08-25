import { createFileRoute, Link } from "@tanstack/react-router";
import { normalizeAvatarUrl } from "@/lib/avatars";
import { useEffect, useState } from "react";
import { Crown, Loader2, Medal, Plus, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import heroLeaderboard from "@/assets/hero-leaderboard.webp";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import { useAppState, useStats } from "@/lib/store";
import { useVerifiedUsers } from "@/lib/subscription";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Top Class 10 Students | BoardBuddy" },
      {
        name: "description",
        content:
          "See the top Class 10 students on BoardBuddy ranked by XP and accuracy. Practise daily, earn XP and climb the board exam leaderboard.",
      },
      { property: "og:title", content: "Leaderboard — Top Class 10 Students | BoardBuddy" },
      { property: "og:description", content: "Ranked by XP and accuracy. Climb the BoardBuddy leaderboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

type Row = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  accuracy: number | string | null;
  tests: number | null;
};

function LeaderboardPage() {
  const { user } = useSession();
  const state = useAppState();
  const stats = useStats();
  const [scope, setScope] = useState<"top10" | "all">("top10");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const verified = useVerifiedUsers();

  useEffect(() => {
    let active = true;
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void supabase.rpc("get_leaderboard", { _limit: 100 }).then(({ data }) => {
      if (!active) return;
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const base = rows
    .map((r) => ({ ...r, accuracyPct: Math.round(Number(r.accuracy ?? 0)), tests: r.tests ?? 0 }))
    .sort((a, b) => b.xp - a.xp);
  const list = scope === "top10" ? base.slice(0, 10) : base;

  const myXp = state.xp;
  const myRank = base.filter((r) => r.xp > myXp).length + 1;

  return (
    <AppShell title="Leaderboard">
      <PageHero
        eyebrow="Ranks"
        eyebrowIcon={<Trophy className="h-3.5 w-3.5" />}
        title="Climb the"
        titleAccent="Class 10 board"
        description="XP, accuracy and streaks decide your place. Practise daily and watch your name rise."
        image={heroLeaderboard}
        imageAlt="Golden trophy on a winner podium"
        tint="amber"
      />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {scope === "top10" ? "Top 10 students" : `All students (${base.length})`}
        </p>
        <Link
          to="/practice"
          aria-label="Earn XP"
          className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      <div className="surface mb-4 grid grid-cols-2 gap-1 p-1">
        {(["top10", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
              scope === s
                ? s === "top10"
                  ? "gold-gradient shadow-[var(--shadow-gold)]"
                  : "brand-gradient text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {s === "top10" ? <Medal className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
            {s === "top10" ? "Top 10" : "All students"}
          </button>
        ))}
      </div>

      {!user ? (
        <div className="surface p-6 text-center">
          <p className="text-sm font-bold">Sign in to see the leaderboard</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your account — your rank, XP and accuracy update live.
          </p>
          <Link
            to="/auth"
            className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Create account
          </Link>
        </div>
      ) : loading ? (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading ranks…
        </p>
      ) : base.length === 0 ? (
        <div className="surface p-6 text-center">
          <p className="text-sm font-bold">The leaderboard is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">Complete your first quiz and see your name at the top.</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="grid grid-cols-[42px_1fr_54px_58px_46px] items-center bg-secondary px-3 py-2.5 text-[11px] font-bold text-muted-foreground">
            <span>Rank</span>
            <span>Student</span>
            <span className="text-right">XP</span>
            <span className="text-right">Accuracy</span>
            <span className="text-right">Tests</span>
          </div>
          <ol className="divide-y divide-border">
            {list.map((r, i) => (
              <li
                key={r.user_id}
                className={`grid grid-cols-[42px_1fr_54px_58px_46px] items-center px-3 py-3 ${
                  i === 0 ? "gold-row" : i === 1 ? "silver-row" : i === 2 ? "bronze-row" : ""
                }`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-extrabold ${
                    i === 0
                      ? "gold-gradient shadow-[var(--shadow-gold)]"
                      : i === 1
                        ? "silver-gradient"
                        : i === 2
                          ? "bronze-gradient"
                          : "text-muted-foreground"
                  }`}
                >
                  {i === 0 ? (
                    <Crown className="h-3.5 w-3.5" />
                  ) : i < 3 ? (
                    <Medal className="h-3.5 w-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  {normalizeAvatarUrl(r.avatar_url) ? (
                    <img
                      src={normalizeAvatarUrl(r.avatar_url) ?? ""}
                      alt=""
                      width={512}
                      height={512}
                      loading="lazy"
                      decoding="async"
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {r.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="flex min-w-0 items-center gap-1">
                    <span className="truncate text-sm font-semibold">
                      {user.id === r.user_id ? "You" : r.name}
                    </span>
                    {verified.has(r.user_id) && <VerifiedBadge className="h-3.5 w-3.5" />}
                  </span>
                </span>
                <span className="text-right text-sm font-bold">{r.xp}</span>
                <span className="text-right text-sm font-bold text-success">{r.accuracyPct}%</span>
                <span className="text-right text-xs font-semibold text-muted-foreground">{r.tests}</span>
              </li>
            ))}
          </ol>
          <div className="rank-gradient grid grid-cols-[42px_1fr_54px_58px_46px] items-center border-t-2 border-primary/30 px-3 py-3">
            <span className="brand-gradient grid h-7 w-7 place-items-center rounded-lg text-[11px] font-extrabold text-primary-foreground">
              {myRank}
            </span>
            <span className="text-sm font-extrabold text-primary">Your rank</span>
            <span className="text-right text-sm font-bold">{myXp}</span>
            <span className="text-right text-sm font-bold text-success">{stats.accuracy}%</span>
            <span className="text-right text-xs font-semibold text-muted-foreground">{state.attempts.length}</span>
          </div>
        </div>
      )}


      <p className="mt-3 pb-2 text-center text-[11px] text-muted-foreground">
        Rank is based on XP and accuracy — practise daily to climb higher.
      </p>
    </AppShell>
  );
}
