import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tint = "blue" | "purple" | "green" | "amber";

const TINT_CLASS: Record<Tint, string> = {
  blue: "hero-panel-blue",
  purple: "hero-panel-purple",
  green: "hero-panel-green",
  amber: "hero-panel-amber",
};

const BADGE_CLASS: Record<Tint, string> = {
  blue: "text-primary border-primary/30 bg-background/70",
  purple: "text-hero-purple border-hero-purple/30 bg-background/70",
  green: "text-hero-green border-hero-green/30 bg-background/70",
  amber: "text-hero-amber border-hero-amber/40 bg-background/70",
};

const ACCENT_CLASS: Record<Tint, string> = {
  blue: "text-primary",
  purple: "text-hero-purple",
  green: "text-hero-green",
  amber: "text-hero-amber",
};

/**
 * Illustrated section hero used at the top of the main tabs.
 * Text column + 3D illustration, stacked-safe on the narrowest phones.
 */
export function PageHero({
  eyebrow,
  eyebrowIcon,
  title,
  titleAccent,
  description,
  image,
  imageAlt,
  tint = "blue",
  compact = false,
  priority = false,
  children,
  className,
}: {
  eyebrow: string;
  eyebrowIcon?: ReactNode;
  title: string;
  titleAccent?: string;
  description: string;
  image: string;
  imageAlt: string;
  tint?: Tint;
  /** Slimmer banner: smaller illustration, tighter padding, smaller title. */
  compact?: boolean;
  priority?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        TINT_CLASS[tint],
        "hero-dots relative mb-5 overflow-hidden",
        compact ? "rounded-2xl p-4 sm:p-5" : "rounded-3xl p-5 sm:p-7",
        className,
      )}
    >
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-6">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
              BADGE_CLASS[tint],
            )}
          >
            {eyebrowIcon}
            {eyebrow}
          </span>
          <h1
            className={cn(
              "mt-2 font-extrabold leading-tight tracking-tight",
              compact ? "text-lg sm:text-xl" : "mt-3 text-2xl sm:text-3xl",
            )}
          >
            {title}
            {titleAccent ? (
              <>
                <br />
                <span className={ACCENT_CLASS[tint]}>{titleAccent}</span>
              </>
            ) : null}
          </h1>
          <span
            className={cn(
              "block h-1 w-10 rounded-full",
              compact ? "mt-2" : "mt-3",
              tint === "blue"
                ? "bg-primary"
                : tint === "purple"
                  ? "bg-hero-purple"
                  : tint === "green"
                    ? "bg-hero-green"
                    : "bg-hero-amber",
            )}
          />
          <p
            className={cn(
              "max-w-sm leading-relaxed text-muted-foreground",
              compact ? "mt-2 text-xs" : "mt-3 text-sm",
            )}
          >
            {description}
          </p>
          {children ? <div className={compact ? "mt-3" : "mt-4"}>{children}</div> : null}
        </div>

        <img
          src={image}
          alt={imageAlt}
          width={1024}
          height={1024}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "pointer-events-none shrink-0 select-none object-contain drop-shadow-xl",
            compact ? "h-32 w-32 sm:h-40 sm:w-40" : "h-40 w-40 sm:h-52 sm:w-52 lg:h-60 lg:w-60",
          )}
        />
      </div>
    </section>
  );
}
