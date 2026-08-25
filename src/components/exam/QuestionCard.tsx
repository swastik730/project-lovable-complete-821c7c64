import { Bookmark, BookmarkCheck, Flag } from "lucide-react";
import type { Question } from "@/lib/curriculum";
import { QuestionExplanation } from "@/components/exam/QuestionExplanation";
import { cn } from "@/lib/utils";

/**
 * Standard question format used everywhere (mock tests, quizzes, practice,
 * review). Numbered options with a radio marker on the right, a compact meta
 * row, and the shared explanation block once the answer is revealed.
 */
export function ExamQuestionCard({
  question,
  index,
  total,
  timerLabel,
  chosen,
  revealed = false,
  marked = false,
  bookmarked = false,
  onSelect,
  onToggleMark,
  onClear,
  onToggleBookmark,
  onReport,
  isLast = false,
  onNext,
  onPrev,
  nextLabel,
}: {
  question: Question;
  index: number;
  total: number;
  timerLabel?: string | undefined;
  chosen?: number | undefined;
  revealed?: boolean;
  marked?: boolean;
  bookmarked?: boolean;
  onSelect?: ((i: number) => void) | undefined;
  onToggleMark?: (() => void) | undefined;
  onClear?: (() => void) | undefined;
  onToggleBookmark?: (() => void) | undefined;
  onReport?: (() => void) | undefined;
  isLast?: boolean;
  onNext?: (() => void) | undefined;
  onPrev?: (() => void) | undefined;
  nextLabel?: string | undefined;
}) {
  return (
    <article className="surface overflow-hidden">
      {/* Meta row: index · type · report */}
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-foreground text-xs font-extrabold text-background">
          {index + 1}
        </span>
        <span className="rounded-full bg-muted px-3 py-1.5 text-[12px] font-semibold text-muted-foreground">
          Type: single
        </span>
        {timerLabel && (
          <span className="rounded-full bg-muted px-2.5 py-1.5 text-[11px] font-extrabold tabular-nums text-muted-foreground">
            {timerLabel}
          </span>
        )}
        <span className="ml-auto flex items-center gap-3">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={onToggleBookmark}
              aria-label="Bookmark question"
              className="text-muted-foreground"
            >
              {bookmarked ? (
                <BookmarkCheck className="h-[18px] w-[18px] text-achievement" />
              ) : (
                <Bookmark className="h-[18px] w-[18px]" />
              )}
            </button>
          )}
          {onReport && (
            <button
              type="button"
              onClick={onReport}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground"
            >
              <Flag className="h-4 w-4" /> Report
            </button>
          )}
        </span>
      </div>

      <div key={question.id} className="animate-in fade-in slide-in-from-right-2 select-none px-4 pb-4 pt-3 duration-200">
        <p className="sr-only">
          Question {index + 1} of {total}
        </p>
        <h2 className="text-[15.5px] font-medium leading-relaxed text-foreground">
          {question.question}
        </h2>

        <ul className="mt-4 space-y-3">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.answer;
            const isChosen = chosen === i;
            const showCorrect = revealed && isCorrect;
            const showWrong = revealed && isChosen && !isCorrect;
            return (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => onSelect?.(i)}
                  disabled={!onSelect || revealed}
                  className={cn(
                    "flex min-h-[56px] w-full items-stretch gap-0 overflow-hidden rounded-xl border bg-card text-left transition-colors duration-150",
                    "border-border",
                    !revealed &&
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.995]",
                    !revealed && isChosen && "border-primary bg-primary-soft",
                    showCorrect && "border-success bg-success-soft",
                    showWrong && "border-destructive bg-destructive-soft",
                  )}
                >
                  <span className="flex items-center pl-3 pr-3">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-full bg-muted text-[12px] font-bold text-muted-foreground",
                        !revealed && isChosen && "bg-primary text-primary-foreground",
                        showCorrect && "bg-success/15 text-success",
                        showWrong && "bg-destructive/15 text-destructive",
                      )}
                    >
                      {i + 1}
                    </span>
                  </span>
                  <span className="my-3 w-px shrink-0 bg-border" />
                  <span className="flex flex-1 items-center px-3 py-3 text-[14.5px] leading-snug">
                    {opt}
                  </span>
                  <span className="flex items-center pr-3">
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full border-2 border-border",
                        !revealed && isChosen && "border-primary bg-primary",
                        showCorrect && "border-success bg-success",
                        showWrong && "border-destructive bg-destructive",
                      )}
                    >
                      {(isChosen || showCorrect) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-background" />
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {revealed && <QuestionExplanation question={question} chosen={chosen} />}

      {(onToggleMark || onClear || onNext) && (
        <footer className="border-t border-border bg-muted/40 px-3 py-3">
          <div className="flex items-center gap-2">
            {onToggleMark && (
              <button
                type="button"
                onClick={onToggleMark}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors",
                  marked
                    ? "border-warning bg-warning-soft text-warning"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                <Flag className="h-3.5 w-3.5" /> {marked ? "Marked" : "Review"}
              </button>
            )}
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                disabled={chosen === undefined}
                className="h-10 rounded-xl border border-input px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                Clear
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="brand-gradient ml-auto h-10 rounded-xl px-5 text-xs font-extrabold text-primary-foreground"
              >
                {nextLabel ?? (isLast ? "Submit" : "Save & Next")}
              </button>
            )}
          </div>
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              disabled={index === 0}
              className="mt-2 h-10 w-full rounded-xl border border-input text-xs font-bold transition-colors hover:bg-muted disabled:opacity-40"
            >
              Previous question
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
