import type { Question } from "@/lib/curriculum";
import { getSubject } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

/** Renders a light markdown subset used in explanations: ### heading, **bold**. */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{1,}/).filter((b) => b.trim().length > 0);
  return (
    <div className="space-y-2">
      {blocks.map((raw, i) => {
        const line = raw.trim();
        const heading = /^#{2,4}\s*(.+)$/.exec(line);
        if (heading) {
          return (
            <p key={i} className="pt-1 text-[13px] font-extrabold text-foreground">
              {heading[1]}
            </p>
          );
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-[13.5px] leading-relaxed text-foreground/90">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-bold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Shared explanation block — identical layout for mock tests, quizzes,
 * bookmarks and review screens.
 */
export function QuestionExplanation({
  question,
  chosen,
  className,
}: {
  question: Question;
  chosen?: number | undefined;
  className?: string;
}) {
  const subject = getSubject(question.subjectId);
  const chapter = subject?.chapters.find((c) => c.id === question.chapterId);
  const skipped = chosen === undefined;
  const correct = chosen === question.answer;

  return (
    <section className={cn("border-t border-border px-4 py-4", className)}>
      <h3 className="text-base font-extrabold">Explanation</h3>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Chip
          tone={
            question.difficulty === "easy"
              ? "success"
              : question.difficulty === "medium"
                ? "warning"
                : "destructive"
          }
          label={question.difficulty[0]!.toUpperCase() + question.difficulty.slice(1)}
        />
        {subject && <Chip tone="primary" label={subject.name} />}
        {chapter && <Chip tone="primary" label={chapter.name} />}
        {question.concept && <Chip tone="muted" label={question.concept} />}
      </div>

      <p
        className={cn(
          "mt-2.5 text-[12.5px] font-bold",
          skipped ? "text-warning" : correct ? "text-success" : "text-destructive",
        )}
      >
        {skipped ? "Not attempted" : correct ? "Correct" : "Incorrect"} · Answer:{" "}
        {question.answer + 1}
      </p>

      {question.explanation && (
        <div className="mt-3">
          <RichText text={question.explanation} />
        </div>
      )}
    </section>
  );
}

function Chip({
  tone,
  label,
}: {
  tone: "success" | "warning" | "destructive" | "primary" | "muted";
  label: string;
}) {
  const cls = {
    success: "border-success/30 bg-success-soft text-success",
    warning: "border-warning/30 bg-warning-soft text-warning",
    destructive: "border-destructive/30 bg-destructive-soft text-destructive",
    primary: "border-primary/25 bg-primary-soft text-primary",
    muted: "border-border bg-muted text-muted-foreground",
  }[tone];
  return (
    <span className={cn("rounded-full border px-3 py-1 text-[11.5px] font-bold", cls)}>
      {label}
    </span>
  );
}
