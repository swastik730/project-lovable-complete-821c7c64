import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SUBJECTS } from "@/lib/curriculum";
import { useStrongChapters, useWeakChapters } from "@/lib/analytics";
import { useAppState, useStats, useSubjectAccuracy } from "@/lib/store";
import { PageHero } from "@/components/PageHero";
import heroAnalysis from "@/assets/hero-analysis.webp";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "My Analysis | BoardBuddy" },
      {
        name: "description",
        content:
          "Detailed performance insights for Class 10 board prep: overall accuracy, topic-wise strengths and weaknesses, and test history.",
      },
      { property: "og:title", content: "My Analysis | BoardBuddy" },
      {
        property: "og:description",
        content: "See your accuracy, strengths and weaknesses across every subject and chapter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalysisPage,
});

type Tab = "overall" | "topics" | "tests";

function AnalysisPage() {
  const [tab, setTab] = useState<Tab>("overall");
  const state = useAppState();
  const stats = useStats();
  const acc = useSubjectAccuracy();
  const weak = useWeakChapters();
  const strong = useStrongChapters();

  const incorrect = Math.max(0, stats.answered - stats.correct);
  const tests = state.attempts.filter((a) => a.mode === "test");

  return (
    <AppShell title="My Analysis">
      <PageHero
        eyebrow="Insights"
        eyebrowIcon={<Sparkles className="h-3.5 w-3.5" />}
        title="Analyse"
        titleAccent="your preparation"
        description="Understand where you stand with data, not guesswork — subject, chapter and accuracy trends."
        image={heroAnalysis}
        imageAlt="Charts and magnifying glass analytics illustration"
        tint="amber"
      />
      <p className="mb-4 -mt-1 text-sm text-muted-foreground">Detailed performance insights</p>

      <div className="surface mb-4 grid grid-cols-3 gap-1 p-1 text-center text-xs font-bold">
        {(["overall", "topics", "tests"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              "rounded-xl py-2 capitalize transition-colors " +
              (tab === t ? "brand-gradient text-primary-foreground" : "text-muted-foreground hover:bg-muted")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overall" ? (
        <>
          <div className="surface mb-4 flex flex-col items-center p-6">
            <AccuracyRing value={stats.accuracy} />
            <div className="mt-6 grid w-full grid-cols-3 gap-3 text-center">
              <Stat label="Correct" value={stats.correct} tone="text-success" />
              <Stat label="Incorrect" value={incorrect} tone="text-destructive" />
              <Stat label="Total" value={stats.questions} tone="text-foreground" />
            </div>
          </div>

          <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
            <TrendingUp className="h-4 w-4 text-success" /> Strengths
          </h2>
          <BarList
            rows={strong.map((c) => ({ key: c.chapterId, label: c.chapterName, pct: c.accuracy }))}
            empty="Attempt 3+ questions per chapter — your strengths will show up here."
            tone="bg-success"
          />

          <h2 className="mb-3 mt-4 flex items-center gap-2 text-base font-bold">
            <TrendingDown className="h-4 w-4 text-destructive" /> Weaknesses
          </h2>
          <BarList
            rows={weak.map((c) => ({ key: c.chapterId, label: c.chapterName, pct: c.accuracy }))}
            empty="No weak chapters found yet. Keep practising."
            tone="bg-destructive"
          />
        </>
      ) : null}

      {tab === "topics" ? (
        <div className="surface mb-4 divide-y divide-border">
          {SUBJECTS.map((s) => {
            const d = acc.get(s.id);
            const pct = d && d.answered ? Math.round((d.correct / d.answered) * 100) : 0;
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-10 text-[11px] font-extrabold text-muted-foreground">{s.short}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="brand-gradient h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="w-12 text-right text-xs font-bold">{d?.answered ? `${pct}%` : "—"}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "tests" ? (
        tests.length === 0 ? (
          <div className="surface p-6 text-center">
            <p className="text-sm text-muted-foreground">You haven't attempted any test yet.</p>
            <Link
              to="/tests"
              className="brand-gradient mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Take a test <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="surface divide-y divide-border">
            {tests.map((a) => {
              const pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.correct}/{a.total} correct · {Math.round(a.seconds / 60)} min
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-extrabold text-primary">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )
      ) : null}
    </AppShell>
  );
}

function AccuracyRing({ value }: { value: number }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-44 w-44 place-items-center">
      <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="14" className="stroke-muted" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, value)) / 100}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-extrabold">{value}%</p>
        <p className="text-[11px] font-semibold text-muted-foreground">Overall Accuracy</p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function BarList({
  rows,
  empty,
  tone,
}: {
  rows: { key: string; label: string; pct: number }[];
  empty: string;
  tone: string;
}) {
  if (rows.length === 0) {
    return <div className="surface p-5 text-center text-xs text-muted-foreground">{empty}</div>;
  }
  return (
    <div className="surface divide-y divide-border">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{r.label}</p>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${r.pct}%` }} />
          </div>
          <span className="w-10 text-right text-xs font-bold">{r.pct}%</span>
        </div>
      ))}
    </div>
  );
}