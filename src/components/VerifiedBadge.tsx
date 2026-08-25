import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Blue tick shown next to Max Pro subscribers' names. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      aria-label="Max Pro verified"
      className={cn("inline-block h-4 w-4 shrink-0 text-primary", className)}
    />
  );
}
