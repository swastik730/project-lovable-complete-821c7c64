import { Link } from "@tanstack/react-router";
import { BadgeCheck, ChevronRight, Crown, Sparkles } from "lucide-react";
import { usePremium } from "@/lib/subscription";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Shows the real subscription state of the signed-in student.
 *
 * - Subscriptions OFF (owner master switch): everything is unlocked, no pricing wording.
 * - Subscriptions ON + active plan: shows the plan and renewal date.
 * - Subscriptions ON + no plan: invites the student to see the plans.
 */
export function SubscriptionCard({ className }: { className?: string }) {
  const { subscriptionsEnabled, entitlement, isMax, ready } = usePremium();

  if (!ready) {
    return (
      <div className={cn("surface flex items-center gap-4 p-5", className)}>
        <span className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <span className="block h-3.5 w-32 animate-pulse rounded bg-muted" />
          <span className="block h-3 w-48 max-w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!subscriptionsEnabled) {
    return (
      <div className={cn("surface flex items-center gap-4 p-5", className)}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success-soft text-success">
          <Crown className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold">Everything unlocked</p>
          <p className="text-xs text-muted-foreground">
            All tests, analytics and solutions are open for you right now.
          </p>
        </div>
      </div>
    );
  }

  if (entitlement) {
    return (
      <Link
        to="/subscribe"
        className={cn(
          "surface flex items-center gap-4 p-5 transition-transform active:scale-[0.99]",
          className,
        )}
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
            isMax ? "bg-primary/15 text-primary" : "bg-success-soft text-success",
          )}
        >
          {isMax ? <BadgeCheck className="h-6 w-6" /> : <Crown className="h-6 w-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-base font-extrabold">
            {isMax ? "Max Pro active" : "Premium active"}
            {isMax && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
          </p>
          <p className="text-xs text-muted-foreground">
            Valid till {formatDate(entitlement.expires_at)} · tap to manage
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  return (
    <Link
      to="/subscribe"
      className={cn(
        "surface flex items-center gap-4 p-5 transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-hero-amber/20 text-hero-amber">
        <Sparkles className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-extrabold">Go Premium</p>
        <p className="text-xs text-muted-foreground">
          3D models, concept videos, ad-free study and the AI doubt tutor.
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
