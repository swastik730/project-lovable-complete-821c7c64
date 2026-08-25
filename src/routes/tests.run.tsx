import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Timer, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AttemptGuard } from "@/components/exam/AttemptGuard";
import { ExamRunner } from "@/components/exam/ExamRunner";
import { ResultBreakdown } from "@/components/exam/ResultBreakdown";
import { SolutionCard } from "@/components/exam/SolutionCard";
import type { Question } from "@/lib/curriculum";
import { dedupeQuestions, filterPool, useQuestionPool, useShuffleSeed } from "@/lib/questions";
import { findTest, pickFresh, questionsForTest } from "@/lib/testEngine";
import { clearProgress, loadProgress, saveProgress, type RunProgress } from "@/lib/testProgress";
import { recordAttempt, toggleBookmark, useAppState, useSeenQuestionIds } from "@/lib/store";

type Search = {
  test: string;
  subject: string;
  chapter: string;
  difficulty: string;
  count: number;
  minutes: number;
  title: string;
  done?: "1" | undefined;
};

export const Route = createFileRoute("/tests/run")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    test: typeof search["test"] === "string" ? search["test"] : "",
    subject: typeof search["subject"] === "string" ? search["subject"] : "mixed",
    chapter: typeof search["chapter"] === "string" ? search["chapter"] : "all",
    difficulty: typeof search["difficulty"] === "string" ? search["difficulty"] : "mixed",
    count: Number(search["count"]) > 0 ? Math.min(Number(search["count"]), 60) : 15,
    minutes: Number(search["minutes"]) > 0 ? Math.min(Number(search["minutes"]), 240) : 20,
    title: typeof search["title"] === "string" ? search["title"] : "Mock Test",
    done: search["done"] === "1" ? ("1" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Timed Test | BoardBuddy" },
      {
        name: "description",
        content:
          "Attempt a timed Class 10 test with question palette, marked-for-review tracking and auto-submit.",
      },
      { property: "og:title", content: "Timed Test | BoardBuddy" },
      { property: "og:description", content: "Timed Class 10 test with instant analysis." },
      { name: "robots", content: "noindex" },
    ],
  }),

  component: TestRun,
});

function TestRun() {
  const search = Route.useSearch();
  const { pool, loading } = useQuestionPool();
  const [seed] = useShuffleSeed();
  const seen = useSeenQuestionIds();

  const runKey = search.test
    ? `t:${search.test}`
    : `c:${search.subject}:${search.chapter}:${search.difficulty}:${search.count}:${search.minutes}`;

  // The paper is built ONCE per run and then frozen. Without this freeze the
  // question list was rebuilt whenever XP / attempts / bookmarks changed
  // (e.g. right after submitting), which remounted the runner and made the
  // student attempt the very same paper a second time before seeing results.
  const [paper, setPaper] = useState<{
    key: string;
    questions: Question[];
    saved: RunProgress | null;
  } | null>(null);

  // Latest values without making them re-run the builder.
  const seenRef = useRef(seen);
  seenRef.current = seen;
  const seedRef = useRef(seed);
  seedRef.current = seed;

  useEffect(() => {
    if (loading) return;
    if (search.done) return; // submitted attempt — never rebuild the paper
    if (paper && paper.key === runKey) return;

    const byId = new Map(pool.map((q) => [q.id, q]));
    const saved = loadProgress(runKey);

    // Resume-on-refresh: rebuild the exact same paper the student was doing.
    if (saved && saved.questionIds.length) {
      const restored = saved.questionIds
        .map((id) => byId.get(id))
        .filter((q): q is Question => !!q);
      if (restored.length === saved.questionIds.length) {
        setPaper({ key: runKey, questions: dedupeQuestions(restored), saved });
        return;
      }
    }

    let built: Question[];
    if (search.test) {
      // Series test → fixed question set, identical on every device and re-attempt.
      const test = findTest(pool, search.test);
      built = test ? questionsForTest(pool, test) : [];
    } else {
      // Custom test → fresh (never attempted) questions first.
      const filtered = filterPool(pool, {
        subjectId: search.subject,
        chapterId: search.chapter,
        difficulty: search.difficulty,
      });
      built = pickFresh(
        dedupeQuestions(filtered),
        search.count,
        seenRef.current,
        seedRef.current || 1,
      );
    }

    setPaper({ key: runKey, questions: dedupeQuestions(built), saved: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pool, runKey]);

  // Anti-reopen: a submitted attempt (marked ?done=1 via history.replaceState on
  // submit) can never show the question paper again — back/forward navigation
  // lands here instead of silently restarting the same test.
  if (search.done) {
    return (
      <AppShell title={search.title}>
        <div className="surface p-6 text-center">
          <span className="brand-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <p className="mt-3 text-sm font-bold">This attempt is already submitted</p>
          <p className="mt-1 text-xs text-muted-foreground">
            For fair practice, a submitted test can&apos;t be reopened. Start a fresh attempt from
            the test list.
          </p>
          <Link
            to="/tests"
            className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Choose a test
          </Link>
        </div>
      </AppShell>
    );
  }

  if (loading || !paper || paper.key !== runKey) {
    return (
      <AppShell title={search.title}>
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing your test…
        </p>
      </AppShell>
    );
  }

  if (paper.questions.length === 0) {
    return (
      <AppShell title={search.title}>
        <div className="surface p-6 text-center">
          <p className="text-sm font-bold">No questions available for this filter yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick another subject/chapter, or change the difficulty.
          </p>
          <Link
            to="/tests"
            className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Back to tests
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <Runner
      key={paper.key}
      questions={paper.questions}
      search={search}
      runKey={runKey}
      saved={
        paper.saved && paper.saved.questionIds.length === paper.questions.length
          ? paper.saved
          : null
      }
    />
  );
}

function Runner({
  questions,
  search,
  runKey,
  saved,
}: {
  questions: Question[];
  search: Search;
  runKey: string;
  saved: RunProgress | null;
}) {
  const navigate = useNavigate();
  const state = useAppState();
  const [index, setIndex] = useState(saved?.index ?? 0);
  const [answers, setAnswers] = useState<Record<string, number>>(saved?.answers ?? {});
  const [marked, setMarked] = useState<Record<string, boolean>>(saved?.marked ?? {});
  const [times, setTimes] = useState<Record<string, number>>(saved?.times ?? {});
  const [left, setLeft] = useState(saved?.left ?? search.minutes * 60);
  const [finished, setFinished] = useState(false);
  const [switches, setSwitches] = useState(0);
  const [warned, setWarned] = useState(false);

  // Save progress so a refresh / accidental app switch resumes the same test.
  useEffect(() => {
    if (finished) return;
    saveProgress({
      runKey,
      questionIds: questions.map((q) => q.id),
      answers,
      marked,
      times,
      index,
      left,
    });
  }, [runKey, questions, answers, marked, times, index, left, finished]);

  // Anti-cheat: tab/app switching is counted, 3rd switch auto-submits the test.
  useEffect(() => {
    if (finished) return;
    const onHidden = () => {
      if (document.visibilityState !== "hidden") return;
      setSwitches((n) => {
        const next = n + 1;
        if (next >= 3) setFinished(true);
        else setWarned(true);
        return next;
      });
    };
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", onHidden);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", onHidden);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [finished]);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
      const q = questions[index];
      if (q) setTimes((m) => ({ ...m, [q.id]: (m[q.id] ?? 0) + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [finished, index, questions]);

  const submitted = finished;
  const correctCount = questions.filter((q) => answers[q.id] === q.answer).length;
  const attempted = questions.filter((q) => answers[q.id] !== undefined).length;

  useEffect(() => {
    if (!submitted) return;
    clearProgress(runKey);
    // Stamp the current history entry with done=1 so pressing back after the
    // result (then forward) shows the "already submitted" guard, not the paper.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("done", "1");
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* non-browser environment */
    }
    recordAttempt({
      mode: "test",
      testId: search.test || undefined,
      label: search.title,
      subjectId: search.subject,
      chapterId: search.chapter === "all" ? undefined : search.chapter,
      total: questions.length,
      correct: correctCount,
      unanswered: questions.length - attempted,
      seconds: search.minutes * 60 - left,
      perQuestion: questions.map((q) => ({
        questionId: q.id,
        difficulty: q.difficulty,
        correct: answers[q.id] === q.answer,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  if (submitted) {
    const pct = Math.round((correctCount / questions.length) * 100);
    const spent = search.minutes * 60 - left;
    const avg = Math.round(spent / questions.length);
    return (
      <AppShell title="Test Result">
        <div className="brand-gradient mb-4 rounded-3xl p-6 text-center text-primary-foreground">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/20">
            <Trophy className="h-8 w-8" />
          </span>
          <h2 className="mt-3 text-2xl font-extrabold">
            {pct >= 80 ? "Excellent! 🎉" : pct >= 50 ? "Great Work! 🎯" : "Keep Practising 💪"}
          </h2>
          <p className="text-xs opacity-90">{search.title}</p>
          <p className="mt-4 text-5xl font-extrabold tabular-nums">{pct}%</p>
          <p className="text-xs font-semibold opacity-90">
            {correctCount} out of {questions.length} correct
          </p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="surface p-3">
            <p className="text-xl font-extrabold text-success">{correctCount}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Correct</p>
          </div>
          <div className="surface p-3">
            <p className="text-xl font-extrabold text-destructive">{attempted - correctCount}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Incorrect</p>
          </div>
          <div className="surface p-3">
            <p className="text-xl font-extrabold text-muted-foreground">
              {questions.length - attempted}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground">Skipped</p>
          </div>
        </div>

        <div className="surface mb-4 divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" /> Time taken
            </span>
            <span className="font-bold">
              {Math.floor(spent / 60)}m {spent % 60}s
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Avg. per question</span>
            <span className="font-bold">{avg}s</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Accuracy</span>
            <span className="font-bold">
              {attempted ? Math.round((correctCount / attempted) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="surface mb-4 space-y-2 p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void navigate({ to: "/tests" })}
              className="h-11 flex-1 rounded-xl border border-input text-sm font-bold"
            >
              Retake / More tests
            </button>
            <Link
              to="/analysis"
              className="brand-gradient grid h-11 flex-1 place-items-center rounded-xl text-sm font-bold text-primary-foreground"
            >
              See analysis
            </Link>
          </div>
          <Link
            to="/leaderboard"
            className="grid h-11 w-full place-items-center rounded-xl border border-input text-sm font-bold"
          >
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Go to Leaderboard
            </span>
          </Link>
        </div>

        <h2 className="mb-3 text-base font-bold">Solutions</h2>
        <div className="mb-4">
          <ResultBreakdown questions={questions} answers={answers} />
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <SolutionCard
              key={q.id}
              question={q}
              index={i}
              chosen={answers[q.id]}
              seconds={times[q.id] ?? 0}
            />
          ))}
        </div>
      </AppShell>
    );
  }

  const q = questions[index]!;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <AppShell title={search.title}>
      <AttemptGuard active kind="test" />
      <ExamRunner
        title={search.title}
        questions={questions}
        index={index}
        answers={answers}
        marked={marked}
        bookmarks={state.bookmarks}
        timerLabel={`${mm}:${ss}`}
        timeLow={left <= 60}
        submitLabel="Submit test"
        {...(warned && switches < 3
          ? {
              warning: `Tab switch detected (${switches}/3). The test auto-submits on the third switch.`,
            }
          : {})}
        onIndexChange={setIndex}
        onSelect={(i) => setAnswers((a) => ({ ...a, [q.id]: i }))}
        onToggleMark={() => setMarked((m) => ({ ...m, [q.id]: !m[q.id] }))}
        onToggleBookmark={() => toggleBookmark(q.id)}
        onClear={() =>
          setAnswers((a) => {
            const next = { ...a };
            delete next[q.id];
            return next;
          })
        }
        onSubmit={() => setFinished(true)}
      />
    </AppShell>
  );
}
