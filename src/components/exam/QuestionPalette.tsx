import { LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type PaletteItem = { id: string; answered: boolean; marked: boolean };

export function QuestionPalette({
  items,
  current,
  onJump,
  onSubmit,
  open,
  onOpenChange,
}: {
  items: PaletteItem[];
  current: number;
  onJump: (index: number) => void;
  onSubmit?: (() => void) | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((v: boolean) => void) | undefined;
}) {
  const answered = items.filter((i) => i.answered && !i.marked).length;
  const marked = items.filter((i) => i.marked).length;
  const notAnswered = items.length - answered - marked;

  return (
    <Sheet {...(open !== undefined ? { open } : {})} {...(onOpenChange ? { onOpenChange } : {})}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="surface flex w-full items-center justify-between px-4 py-3 text-sm font-bold"
        >
          <span className="inline-flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" /> Question palette
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {answered} answered · {marked} marked
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="px-0">
          <SheetTitle>Question palette</SheetTitle>
        </SheetHeader>

        <div className="mt-1 grid grid-cols-6 gap-2.5 sm:grid-cols-8">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onJump(i);
                onOpenChange?.(false);
              }}
              className={cn(
                "grid h-11 place-items-center rounded-xl text-sm font-extrabold",
                item.marked
                  ? "bg-achievement text-primary-foreground"
                  : item.answered
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground",
                i === current && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] font-semibold text-muted-foreground">
          <Legend className="bg-success" label={`Answered (${answered})`} />
          <Legend className="bg-muted" label={`Not answered (${notAnswered})`} />
          <Legend className="bg-achievement" label={`Marked for review (${marked})`} />
          <Legend className="bg-primary" label="Current question" />
        </div>

        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            className="mt-5 h-12 w-full rounded-xl border-2 border-destructive text-sm font-extrabold text-destructive"
          >
            Submit now
          </button>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-3.5 w-3.5 rounded", className)} /> {label}
    </span>
  );
}
