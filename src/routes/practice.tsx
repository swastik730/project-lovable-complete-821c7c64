import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, ChevronRight, Layers } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SUBJECTS, questionsFor } from "@/lib/curriculum";
import { useAppState } from "@/lib/store";
import { PageHero } from "@/components/PageHero";
import heroPractice from "@/assets/hero-practice.webp";
import tileChallenge from "@/assets/tiles/challenge.webp";
import tileBookmarks from "@/assets/tiles/bookmarks.webp";
import tileTests from "@/assets/tiles/tests.webp";
import { SubjectIcon } from "@/components/SubjectIcon";


export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice — Quizzes & Mock Tests | BoardBuddy" },
      {
        name: "description",
        content:
          "Practice Class 10 board questions: subject quizzes, chapter quizzes, mixed daily challenge and bookmarked questions with detailed solutions.",
      },
      { property: "og:title", content: "Practice — Class 10 Quizzes | BoardBuddy" },
      { property: "og:description", content: "Subject-wise and chapter-wise Class 10 MCQ practice with explanations." },
    ],
  }),
  component: Practice,
});

function Practice() {
  const state = useAppState();

  return (
    <AppShell title="Practice">
      <PageHero
        eyebrow="Practice"
        eyebrowIcon={<Brain className="h-3.5 w-3.5" />}
        title="Quiz your way"
        titleAccent="to full marks"
        description="Pick how you want to practise today — chapter-wise quizzes or a mixed daily challenge."
        image={heroPractice}
        imageAlt="Stack of school books with science icons"
        tint="purple"
      />
      <Link
        to="/quiz/$subjectId"
        params={{ subjectId: "mixed" }}
        className="challenge-panel mb-4 flex items-center gap-4 overflow-hidden rounded-2xl p-4"
      >
        <img
          src={tileChallenge}
          alt="Rocket launching towards a daily challenge"
          width={640}
          height={640}
          loading="lazy"
          decoding="async"
          className="h-14 w-14 shrink-0 select-none object-contain drop-shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">Daily Mixed Challenge</p>
          <p className="text-xs opacity-90">10 questions from all subjects · +20 XP</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-90" />
      </Link>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link to="/bookmarks" className="bookmark-panel p-4">
          <img
            src={tileBookmarks}
            alt="Books with a golden bookmark"
            width={640}
            height={640}
            loading="lazy"
            decoding="async"
            className="h-12 w-12 select-none object-contain drop-shadow"
          />
          <p className="mt-2 text-sm font-bold">Bookmarks</p>
          <p className="text-xs text-muted-foreground">{state.bookmarks.length} saved questions</p>
        </Link>
        <Link to="/tests" className="test-panel p-4">
          <img
            src={tileTests}
            alt="Clipboard with a stopwatch"
            width={640}
            height={640}
            loading="lazy"
            decoding="async"
            className="h-12 w-12 select-none object-contain drop-shadow"
          />
          <p className="mt-2 text-sm font-bold">Mock Tests</p>
          <p className="text-xs text-muted-foreground">Timed full-paper series</p>
        </Link>
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-hero-purple/15 text-hero-purple">
          <Layers className="h-4 w-4" />
        </span>
        Subject-wise Quiz
      </h2>

      <div className="space-y-3">
        {SUBJECTS.map((s) => {
          const count = questionsFor({ subjectId: s.id }).length;
          return (
            <Link
              key={s.id}
              to="/quiz/$subjectId"
              params={{ subjectId: s.id }}
              className="surface flex items-center gap-4 p-4 transition-transform active:scale-[0.99]"
            >
              <SubjectIcon subjectId={s.id} short={s.short} name={s.name} />
              <div className="flex-1">
                <p className="text-sm font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{count} questions ready</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
