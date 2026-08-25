import science from "@/assets/subjects/science.webp";
import maths from "@/assets/subjects/maths.webp";
import sst from "@/assets/subjects/sst.webp";
import english from "@/assets/subjects/english.webp";
import hindi from "@/assets/subjects/hindi.webp";

/** subject id -> 3D icon image used across Home, Practice and Learn. */
export const SUBJECT_ICONS: Record<string, string> = {
  science,
  maths,
  sst,
  english,
  hindi,
};

/** Soft tinted background utility class per subject, for colorful icon tiles. */
export const SUBJECT_TINTS: Record<string, string> = {
  science: "bg-primary-soft",
  maths: "bg-achievement-soft",
  sst: "bg-warning-soft",
  english: "bg-success-soft",
  hindi: "bg-reward-soft",
};

export function subjectIcon(subjectId: string): string | undefined {
  return SUBJECT_ICONS[subjectId];
}
