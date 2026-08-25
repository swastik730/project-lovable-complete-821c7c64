import { useBlocker } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Guards an in-progress quiz/test attempt against accidental exits.
 *
 * - Any in-app navigation (device back button, bottom-nav tap, link click) is
 *   intercepted and must be confirmed in this dialog first.
 * - Closing / reloading the tab triggers the browser's native leave warning.
 * - Once the attempt is submitted (`active` becomes false) the guard lifts.
 */
export function AttemptGuard({ active, kind }: { active: boolean; kind: "test" | "quiz" }) {
  const { status, proceed, reset } = useBlocker({
    shouldBlockFn: () => true,
    disabled: !active,
    enableBeforeUnload: active,
    withResolver: true,
  });

  return (
    <AlertDialog open={status === "blocked"}>
      <AlertDialogContent className="max-w-sm rounded-3xl">
        <AlertDialogHeader>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-warning-soft text-warning">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <AlertDialogTitle className="text-center">
            Leave this {kind}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {kind === "test"
              ? "Your answers are saved and you can resume this attempt later — but the timer keeps running."
              : "Your answers in this quiz attempt will be lost if you leave now."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          <AlertDialogCancel
            onClick={() => reset?.()}
            className="brand-gradient m-0 h-11 rounded-xl border-0 text-sm font-extrabold text-primary-foreground"
          >
            Keep writing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => proceed?.()}
            className="m-0 h-11 rounded-xl border-2 border-input bg-transparent text-sm font-bold text-foreground hover:bg-muted"
          >
            Leave {kind}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
