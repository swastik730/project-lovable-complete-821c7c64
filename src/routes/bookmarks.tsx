import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { QUESTIONS } from "@/lib/curriculum";
import { useAppState } from "@/lib/store";
import { SolutionCard } from "@/components/exam/SolutionCard";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarked Questions | BoardBuddy" },
      {
        name: "description",
        content: "All the Class 10 questions you saved, with correct answers, explanations and key concepts in one place.",
      },
      { property: "og:title", content: "Bookmarked Questions | BoardBuddy" },
      { property: "og:description", content: "Revise your saved Class 10 board questions anytime." },
    ],
  }),
  component: Bookmarks,
});

function Bookmarks() {
  const state = useAppState();
  const saved = QUESTIONS.filter((q) => state.bookmarks.includes(q.id));

  return (
    <AppShell title="Bookmarks">
      {saved.length === 0 ? (
        <div className="surface p-6 text-center">
          <p className="text-sm font-semibold">No bookmarks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap the bookmark icon on any question to revise it later.
          </p>
          <Link
            to="/practice"
            className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Go to Practice
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((q, i) => (
            <SolutionCard key={q.id} question={q} index={i} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
