import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  LayoutGrid,
  Timer,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExamQuestionCard } from "@/components/exam/QuestionCard";
import type { Question } from "@/lib/curriculum";
import { getSubject } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export type ExamRunnerProps = {
  /** Paper title shown in the sticky top bar. */
  title: string;
  questions: Question[];
  index: number;
  answers: Record<string, number>;
  marked: Record<string, boolean>;
  bookmarks?: string[] | undefined;
  /** mm:ss label. */
  timerLabel: string;
  /** true → timer turns red (last minute / overtime). */
  timeLow?: boolean | undefined;
  /** Label of the submit action in the top bar. */
  submitLabel?: string | undefined;
  /** Show Correct / Incorrect counts instead of Answered (post-submit review). */
  showCorrectness?: boolean | undefined;
  /** Inline warning banner (e.g. tab-switch anti-cheat notice). */
  warning?: string | undefined;
  onIndexChange: (index: number) => void;
  onSelect?: ((optionIndex: number) => void) | undefined;
  onClear?: (() => void) | undefined;
  onToggleMark?: (() => void) | undefined;
  onToggleBookmark?: (() => void) | undefined;
  onSubmit: () => void;
};

const REPORT_REASONS = [
  "Question is incorrect",
  "Wrong answer / solution",
  "Typo or formatting issue",
  "Image or option not visible",
  "Out of syllabus",
];

export function ExamRunner({
  title,
  questions,
  index,
  answers,
  marked,
  bookmarks = [],
  timerLabel,
  timeLow = false,
  submitLabel = "Submit DPP",
  showCorrectness = false,
  warning,
  onIndexChange,
  onSelect,
  onClear,
  onToggleMark,
  onToggleBookmark,
  onSubmit,
}: ExamRunnerProps) {
  const [gridOpen, setGridOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const question = questions[index];

  // Keep the active chip of the horizontal strip in view.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const chip = strip.querySelector<HTMLElement>(`[data-chip="${index}"]`);
    chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const markedCount = questions.filter((q) => marked[q.id]).length;
  const notAnswered = questions.length - answeredCount;
  const correctCount = questions.filter((q) => answers[q.id] === q.answer).length;
  const incorrectCount = answeredCount - correctCount;

  const statusOf = (q: Question) => {
    const chosen = answers[q.id];
    if (showCorrectness) {
      if (chosen === undefined) return "skipped" as const;
      return chosen === q.answer ? ("correct" as const) : ("incorrect" as const);
    }
    if (marked[q.id]) return "marked" as const;
    return chosen === undefined ? ("skipped" as const) : ("answered" as const);
  };

  const chipTone: Record<string, string> = {
    correct: "border-success/40 bg-success-soft text-success",
    incorrect: "border-destructive/40 bg-destructive-soft text-destructive",
    answered: "border-primary/40 bg-primary-soft text-primary",
    marked: "border-achievement/50 bg-achievement-soft text-achievement",
    skipped: "border-border bg-muted text-muted-foreground",
  };

  const subjectLabel = (() => {
    const subject = getSubject(question?.subjectId ?? "");
    const chapter = subject?.chapters.find((c) => c.id === question?.chapterId);
    return [subject?.name, chapter?.name].filter(Boolean).join(" · ") || title;
  })();

  const isLast = index === questions.length - 1;

  if (!question) return null;

  return (
    <div className="exam-secure">
      {/* ── Top bar: subject · marking · progress · strip ─────────── */}
      <div className="surface sticky top-2 z-20 mb-3 px-3 pb-2.5 pt-3">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate rounded-lg border border-primary/25 bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary">
            {subjectLabel}
          </span>
          <span className="shrink-0 rounded-lg border border-success/30 bg-success-soft px-2 py-1 text-[11.5px] font-bold text-success">
            1 mark · No negative
          </span>

          <span
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold tabular-nums",
              timeLow ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
            )}
          >
            <Timer className="h-3.5 w-3.5" /> {timerLabel}
          </span>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label={submitLabel}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-1.5 flex items-center gap-3">
          <span className="truncate text-[12.5px] font-semibold text-muted-foreground">{title}</span>
          <span className="shrink-0 text-[12.5px] font-semibold text-muted-foreground">
            Q {index + 1} / {questions.length}
          </span>
        </div>

        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${questions.length ? ((index + 1) / questions.length) * 100 : 0}%` }}
          />
        </div>

        {/* Horizontal question strip */}
        <div className="mt-2.5 flex items-center gap-2">
          <div
            ref={stripRef}
            className="no-scrollbar flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-0.5"
          >
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                data-chip={i}
                onClick={() => onIndexChange(i)}
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[12.5px] font-bold transition-transform active:scale-95",
                  chipTone[statusOf(q)],
                  i === index && "ring-2 ring-primary/70 ring-offset-2 ring-offset-card",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setGridOpen(true)}
            aria-label="Open grid view"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-input text-muted-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {warning && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft p-3 text-xs font-semibold text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      <ExamQuestionCard
        question={question}
        index={index}
        total={questions.length}
        chosen={answers[question.id]}
        revealed={showCorrectness}
        marked={!!marked[question.id]}
        bookmarked={bookmarks.includes(question.id)}
        {...(onToggleBookmark ? { onToggleBookmark } : {})}
        {...(onSelect ? { onSelect } : {})}
        {...(onToggleMark ? { onToggleMark } : {})}
        {...(onClear ? { onClear } : {})}
        onReport={() => setReportOpen(true)}
      />

      {/* ── Bookmark · Previous · Next footer ──────────────────────── */}
      <div className="sticky bottom-2 z-20 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-2 backdrop-blur">
        {onToggleBookmark && (
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label="Bookmark question"
            className={cn(
              "grid h-11 w-12 shrink-0 place-items-center rounded-xl border",
              bookmarks.includes(question.id)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground",
            )}
          >
            <Bookmark className="h-4.5 w-4.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onIndexChange(Math.max(0, index - 1))}
          disabled={index === 0}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-input text-[13px] font-bold disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="brand-gradient inline-flex h-11 flex-1 items-center justify-center rounded-xl text-[13px] font-extrabold text-primary-foreground"
          >
            {submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onIndexChange(Math.min(questions.length - 1, index + 1))}
            className="brand-gradient inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl text-[13px] font-extrabold text-primary-foreground"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Grid view sheet ────────────────────────────────────────── */}
      <Sheet open={gridOpen} onOpenChange={setGridOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="px-0">
            <SheetTitle>Grid view</SheetTitle>
          </SheetHeader>

          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            {showCorrectness ? (
              <>
                <Stat tone="success" label="Correct" value={correctCount} />
                <Stat tone="destructive" label="Incorrect" value={incorrectCount} />
                <Stat tone="muted" label="Not Answered" value={notAnswered} />
              </>
            ) : (
              <>
                <Stat tone="success" label="Answered" value={answeredCount} />
                <Stat tone="achievement" label="Marked" value={markedCount} />
                <Stat tone="muted" label="Not Answered" value={notAnswered} />
              </>
            )}
          </div>

          <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-8">
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  onIndexChange(i);
                  setGridOpen(false);
                }}
                className={cn(
                  "grid h-11 place-items-center rounded-xl text-sm font-extrabold",
                  chipTone[statusOf(q)],
                  i === index && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setGridOpen(false);
              setConfirmOpen(true);
            }}
            className="mt-5 h-12 w-full rounded-xl border-2 border-destructive text-sm font-extrabold text-destructive"
          >
            {submitLabel}
          </button>
        </SheetContent>
      </Sheet>

      {/* ── Report bottom sheet ────────────────────────────────────── */}
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="px-0">
            <SheetTitle>Report question {index + 1}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  setReportOpen(false);
                  toast.success("Report sent", {
                    description: `Thanks! Our team will review Q${index + 1}.`,
                  });
                }}
                className="flex w-full items-center justify-between rounded-xl border-2 border-input px-3.5 py-3 text-left text-sm font-semibold hover:bg-muted"
              >
                {reason}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Submit confirmation sheet ──────────────────────────────── */}
      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="px-0">
            <SheetTitle>{submitLabel}?</SheetTitle>
          </SheetHeader>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Stat tone="success" label="Answered" value={answeredCount} />
            <Stat tone="achievement" label="Marked" value={markedCount} />
            <Stat tone="muted" label="Not Answered" value={notAnswered} />
          </div>
          <p className="mb-4 text-xs font-semibold text-muted-foreground">
            Once submitted, this attempt can&apos;t be reopened. You&apos;ll get instant solutions
            and analysis.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-input text-sm font-bold"
            >
              <XCircle className="h-4 w-4" /> Keep solving
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                onSubmit();
              }}
              className="brand-gradient inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-extrabold text-primary-foreground"
            >
              <CheckCircle2 className="h-4 w-4" /> Submit
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({
  tone,
  label,
  value,
}: {
  tone: "success" | "destructive" | "muted" | "achievement";
  label: string;
  value: number;
}) {
  const cls = {
    success: "bg-success-soft text-success",
    destructive: "bg-destructive-soft text-destructive",
    muted: "bg-muted text-muted-foreground",
    achievement: "bg-achievement-soft text-achievement",
  }[tone];
  return (
    <div className={cn("rounded-xl px-2 py-2", cls)}>
      <p className="text-lg font-extrabold tabular-nums">{value}</p>
      <p className="text-[11px] font-semibold">{label}</p>
    </div>
  );
}
