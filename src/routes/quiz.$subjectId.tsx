import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, ShieldCheck, Timer, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AttemptGuard } from "@/components/exam/AttemptGuard";
import { ExamRunner } from "@/components/exam/ExamRunner";
import { SolutionCard } from "@/components/exam/SolutionCard";
import { getSubject, type Question } from "@/lib/curriculum";
import { filterPool, seededShuffle, useQuestionPool, useShuffleSeed } from "@/lib/questions";
import { pickFresh } from "@/lib/testEngine";
import { recordAttempt, toggleBookmark, useAppState, useSeenQuestionIds } from "@/lib/store";
import { cn } from "@/lib/utils";

type Search = { chapter?: string | undefined; done?: "1" | undefined };

export const Route = createFileRoute("/quiz/$subjectId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    chapter: typeof search["chapter"] === "string" ? (search["chapter"] as string) : undefined,
    done: search["done"] === "1" ? ("1" as const) : undefined,
  }),
  head: ({ params }) => {
    const subject = getSubject(params.subjectId);
    const name = subject ? subject.name : "Mixed";
    const title = `${name} Quiz — Class 10 Practice | BoardBuddy`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Attempt a Class 10 ${name} quiz with instant results, explanations and exam tips.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Class 10 ${name} MCQ practice with detailed solutions.`,
        },
      ],
    };
  },
  component: QuizPage,
});

function QuizPage() {
  const { subjectId } = Route.useParams();
  const { chapter, done } = Route.useSearch();
  const navigate = useNavigate();
  const subject = getSubject(subjectId);
  const label = subject ? subject.name : "Daily Challenge";

  const [seed, reshuffle] = useShuffleSeed();
  const { pool, loading } = useQuestionPool();
  const seen = useSeenQuestionIds();

  const runKey = `${subjectId}:${chapter ?? "all"}:${seed}`;

  // The paper is built ONCE per run and then frozen. Without this freeze the
  // question list was rebuilt whenever XP / attempts / bookmarks changed
  // (e.g. right after submitting), remounting the runner and making the
  // student re-attempt the very same paper before seeing the result.
  const [paper, setPaper] = useState<{ key: string; questions: Question[] } | null>(null);

  // Latest values, without making them re-run the builder.
  const seenRef = useRef(seen);
  seenRef.current = seen;
  const seedRef = useRef(seed);
  seedRef.current = seed;

  useEffect(() => {
    if (loading) return;
    if (done) return; // submitted attempt — never rebuild the paper
    if (paper && paper.key === runKey) return;

    const filtered = filterPool(pool, {
      subjectId,
      chapterId: chapter ?? "all",
      difficulty: "mixed",
    });
    // seed 0 = server render → stable order, no hydration mismatch.
    const built =
      seedRef.current === 0
        ? seededShuffle(filtered, 1).slice(0, 10)
        : pickFresh(filtered, 10, seenRef.current, seedRef.current);

    setPaper({ key: runKey, questions: built });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pool, runKey]);

  const questions = paper && paper.key === runKey ? paper.questions : [];

  // Fresh attempt: drop the done flag from the URL and deal new questions.
  const startFresh = () => {
    void navigate({
      to: "/quiz/$subjectId",
      params: { subjectId },
      search: chapter ? { chapter } : {},
      replace: true,
    });
    reshuffle();
  };

  // Anti-reopen: a submitted attempt (marked ?done=1 via history.replaceState on
  // submit) can never show the question paper again — back/forward navigation
  // lands here instead of silently restarting the same quiz.
  if (done) {
    return (
      <AppShell title={label}>
        <div className="surface p-6 text-center">
          <span className="brand-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <p className="mt-3 text-sm font-bold">This quiz attempt is already submitted</p>
          <p className="mt-1 text-xs text-muted-foreground">
            For fair practice, a submitted attempt can&apos;t be reopened.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={startFresh}
              className="brand-gradient flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Start a new quiz
            </button>
            <Link
              to="/practice"
              className="grid flex-1 place-items-center rounded-xl border border-input px-4 py-2.5 text-sm font-bold"
            >
              Practice home
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading || !paper || paper.key !== runKey) {
    return (
      <AppShell title={label}>
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading questions…
        </p>
      </AppShell>
    );
  }

  if (questions.length === 0) {
    return (
      <AppShell title={label}>
        <div className="surface p-6 text-center">
          <p className="text-sm font-semibold">No questions available yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This chapter&apos;s question bank is being prepared. Try another chapter meanwhile.
          </p>
          <Link
            to="/practice"
            className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Back to Practice
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <QuizRunner
      key={runKey}
      questions={questions}
      label={label}
      subjectId={subjectId}
      chapter={chapter}
      onRetry={startFresh}
    />
  );
}

function QuizRunner({
  questions,
  label,
  subjectId,
  chapter,
  onRetry,
}: {
  questions: Question[];
  label: string;
  subjectId: string;
  chapter?: string | undefined;
  onRetry: () => void;
}) {
  const state = useAppState();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [times, setTimes] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setSeconds((s) => s + 1);
      const q = questions[index];
      if (q) setTimes((m) => ({ ...m, [q.id]: (m[q.id] ?? 0) + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [finished, index, questions]);

  const submit = () => {
    recordAttempt({
      mode: subjectId === "mixed" ? "challenge" : "quiz",
      label,
      subjectId,
      chapterId: chapter,
      total: questions.length,
      correct: questions.filter((x) => answers[x.id] === x.answer).length,
      unanswered: questions.filter((x) => answers[x.id] === undefined).length,
      seconds,
      perQuestion: questions.map((x) => ({
        questionId: x.id,
        difficulty: x.difficulty,
        correct: answers[x.id] === x.answer,
      })),
    });
    // Stamp the current history entry with done=1 so pressing back after the
    // result (then forward) shows the "already submitted" guard, not the quiz.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("done", "1");
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* non-browser environment */
    }
    setFinished(true);
  };

  if (finished) {
    return (
      <ResultView
        questions={questions}
        answers={answers}
        times={times}
        seconds={seconds}
        label={label}
        onRetry={() => {
          onRetry();
          setIndex(0);
          setAnswers({});
          setMarked({});
          setTimes({});
          setSeconds(0);
          setFinished(false);
        }}
      />
    );
  }

  const q = questions[index]!;

  return (
    <AppShell title={label}>
      <AttemptGuard active kind="quiz" />
      <ExamRunner
        title={label}
        questions={questions}
        index={index}
        answers={answers}
        marked={marked}
        bookmarks={state.bookmarks}
        timerLabel={formatTime(seconds)}
        submitLabel="Submit quiz"
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
        onSubmit={submit}
      />
    </AppShell>
  );
}

function ResultView({
  questions,
  answers,
  times,
  seconds,
  label,
  onRetry,
}: {
  questions: Question[];
  answers: Record<string, number>;
  times: Record<string, number>;
  seconds: number;
  label: string;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  const wrong = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== q.answer,
  ).length;
  const skipped = questions.length - correct - wrong;
  const accuracy = Math.round((correct / questions.length) * 100);

  return (
    <AppShell title="Result">
      <div className="surface mb-4 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-5xl font-extrabold text-primary">{accuracy}%</p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
          {correct} of {questions.length} correct · <Timer className="h-3.5 w-3.5" />{" "}
          {formatTime(seconds)}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Pill tone="success" label="Correct" value={correct} />
          <Pill tone="destructive" label="Wrong" value={wrong} />
          <Pill tone="muted" label="Skipped" value={skipped} />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-bold"
          >
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
          <button
            type="button"
            onClick={() => void navigate({ to: "/progress" })}
            className="brand-gradient flex-1 rounded-xl py-3 text-sm font-bold text-primary-foreground"
          >
            View Progress
          </button>
        </div>
        <Link
          to="/leaderboard"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-bold"
        >
          <Trophy className="h-4 w-4 text-primary" /> Go to Leaderboard
        </Link>
      </div>

      <h2 className="mb-3 text-base font-bold">Solutions</h2>
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

function Pill({
  tone,
  label,
  value,
}: {
  tone: "success" | "destructive" | "muted";
  label: string;
  value: number;
}) {
  const cls = {
    success: "bg-success-soft text-success",
    destructive: "bg-destructive-soft text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <div className={cn("rounded-xl px-3 py-2", cls)}>
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[11px] font-semibold">{label}</p>
    </div>
  );
}

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
