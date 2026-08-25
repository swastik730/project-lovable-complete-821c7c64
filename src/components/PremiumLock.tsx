import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useFeatureAccess } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

/**
 * Locked premium features stay VISIBLE — the student can see exactly what is
 * inside — but the moment they try to use it they get a plain English message
 * asking them to subscribe.
 */
export function PremiumLockCard({
  featureKey,
  className,
  compact,
}: {
  featureKey: string;
  className?: string;
  compact?: boolean;
}) {
  const { feature, requiredPlan } = useFeatureAccess(featureKey);
  const name = feature?.label ?? "This feature";

  return (
    <div className={cn("surface p-5 text-center", compact && "p-4", className)}>
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-hero-amber/20 text-hero-amber">
        <Lock className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-extrabold">{name} is locked</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {feature?.description} Please subscribe to the {requiredPlan} plan to use it.
      </p>
      <Link
        to="/subscribe"
        className="brand-gradient mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-primary-foreground"
      >
        <Sparkles className="h-4 w-4" />
        View plans
      </Link>
    </div>
  );
}

/**
 * Shows a preview of the feature (blurred, non-interactive) with the subscribe
 * message on top when the student's plan does not include it.
 */
export function PremiumGate({
  featureKey,
  children,
  preview,
}: {
  featureKey: string;
  children: ReactNode;
  preview?: ReactNode;
}) {
  const { ready, allowed } = useFeatureAccess(featureKey);

  if (!ready) {
    return <div className="surface h-32 animate-pulse" aria-hidden />;
  }
  if (allowed) return <>{children}</>;

  return (
    <div className="space-y-3">
      <PremiumLockCard featureKey={featureKey} />
      {preview ? (
        <div className="pointer-events-none select-none opacity-60 blur-[2px]" aria-hidden>
          {preview}
        </div>
      ) : null}
    </div>
  );
}
