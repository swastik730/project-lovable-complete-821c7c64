import { cn } from "@/lib/utils";
import { SUBJECT_ICONS, SUBJECT_TINTS } from "@/lib/subjectIcons";

/**
 * Colorful 3D subject icon tile. Falls back to the short code (SCI/MAT/…)
 * when a subject has no illustration yet.
 */
export function SubjectIcon({
  subjectId,
  short,
  name,
  size = "md",
  className,
}: {
  subjectId: string;
  short: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = SUBJECT_ICONS[subjectId];
  const tint = SUBJECT_TINTS[subjectId] ?? "bg-primary-soft";
  const box =
    size === "sm" ? "h-9 w-9 rounded-lg" : size === "lg" ? "h-12 w-12 rounded-2xl" : "h-11 w-11 rounded-xl";
  const img = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-9 w-9";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden text-[11px] font-extrabold text-accent-foreground",
        box,
        tint,
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name ? `${name} icon` : `${short} icon`}
          width={512}
          height={512}
          loading="lazy"
          decoding="async"
          className={cn("select-none object-contain drop-shadow-sm", img)}
        />
      ) : (
        short
      )}
    </span>
  );
}
