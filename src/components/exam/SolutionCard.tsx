import { AlertTriangle, CheckCircle2, Timer, XCircle } from "lucide-react";
import type { Question } from "@/lib/curriculum";
import { QuestionExplanation } from "@/components/exam/QuestionExplanation";
import { cn } from "@/lib/utils";

/** Review card — same question format as the exam, with the answer revealed. */
export function SolutionCard({
  question,
  index,
  chosen,
  seconds,
}: {
  question: Question;
  index: number;
  chosen?: number | undefined;
  seconds?: number | undefined;
}) {
  const ok = chosen === question.answer;
  const skipped = chosen === undefined;

  return (
    <article className="surface overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-foreground text-xs font-extrabold text-background">
          {index + 1}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold",
            skipped
              ? "bg-warning-soft text-warning"
              : ok
                ? "bg-success-soft text-success"
                : "bg-destructive-soft text-destructive",
          )}
        >
          {skipped ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : ok ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {skipped ? "Skipped" : ok ? "Correct" : "Incorrect"}
        </span>
        {seconds !== undefined && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums text-muted-foreground">
            <Timer className="h-3.5 w-3.5" /> {seconds}s
          </span>
        )}
      </div>

      <div className="px-4 pb-4 pt-3">
        <h2 className="text-[15.5px] font-medium leading-relaxed">{question.question}</h2>

        <ul className="mt-4 space-y-3">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.answer;
            const isChosen = chosen === i;
            return (
              <li
                key={opt}
                className={cn(
                  "flex min-h-[52px] items-stretch overflow-hidden rounded-xl border border-border bg-card",
                  isCorrect && "border-success bg-success-soft",
                  isChosen && !isCorrect && "border-destructive bg-destructive-soft",
                )}
              >
                <span className="flex items-center pl-3 pr-3">
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full bg-muted text-[12px] font-bold text-muted-foreground",
                      isCorrect && "bg-success/15 text-success",
                      isChosen && !isCorrect && "bg-destructive/15 text-destructive",
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
                      isCorrect && "border-success bg-success",
                      isChosen && !isCorrect && "border-destructive bg-destructive",
                    )}
                  >
                    {(isCorrect || isChosen) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-background" />
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <QuestionExplanation question={question} chosen={chosen} />
    </article>
  );
}
