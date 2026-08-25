import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  Boxes,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Headset,
  LineChart,
  Medal,
  NotebookText,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More | BoardBuddy" },
      {
        name: "description",
        content:
          "All BoardBuddy tools in one place — 3D models, AI tutor, NCERT solutions, planner, analysis, leaderboard, achievements and priority support.",
      },
      { property: "og:title", content: "More tools | BoardBuddy" },
      {
        property: "og:description",
        content: "3D models, AI tutor, NCERT solutions, planner, analysis and support for Class 10.",
      },
    ],
  }),
  component: More,
});

const GROUPS: {
  heading: string;
  items: { to: string; label: string; hint: string; icon: typeof Boxes; tint: string; badge?: string }[];
}[] = [
  {
    heading: "Learn",
    items: [
      {
        to: "/models",
        label: "3D models & videos",
        hint: "Rotate organs, molecules and machines",
        icon: Boxes,
        tint: "bg-primary-soft text-primary",
        badge: "Pro",
      },
      {
        to: "/tutor",
        label: "AI doubt tutor",
        hint: "Ask any question, get a step-by-step answer",
        icon: GraduationCap,
        tint: "bg-hero-amber/20 text-hero-amber",
        badge: "Max Pro",
      },
      {
        to: "/ncert",
        label: "NCERT solutions",
        hint: "Chapter-wise textbook answers",
        icon: NotebookText,
        tint: "bg-success-soft text-success",
      },
      {
        to: "/bookmarks",
        label: "Bookmarks",
        hint: "Questions you saved for revision",
        icon: Bookmark,
        tint: "bg-reward-soft text-reward",
      },
    ],
  },
  {
    heading: "Progress",
    items: [
      {
        to: "/analysis",
        label: "Analysis",
        hint: "Strong and weak chapters",
        icon: LineChart,
        tint: "bg-primary-soft text-primary",
      },
      {
        to: "/calendar",
        label: "Study planner",
        hint: "Plan your week and track streaks",
        icon: CalendarDays,
        tint: "bg-success-soft text-success",
      },
      {
        to: "/leaderboard",
        label: "Leaderboard",
        hint: "See where you stand",
        icon: Trophy,
        tint: "bg-reward-soft text-reward",
      },
      {
        to: "/achievements",
        label: "Achievements",
        hint: "Badges you have unlocked",
        icon: Medal,
        tint: "bg-hero-amber/20 text-hero-amber",
      },
    ],
  },
  {
    heading: "Account",
    items: [
      {
        to: "/profile",
        label: "Profile & settings",
        hint: "Name, avatar, daily goal",
        icon: User,
        tint: "bg-primary-soft text-primary",
      },
      {
        to: "/notifications",
        label: "Notifications",
        hint: "Reminders and new content alerts",
        icon: Bell,
        tint: "bg-success-soft text-success",
      },
      {
        to: "/support",
        label: "Priority support",
        hint: "Call, WhatsApp or email our team",
        icon: Headset,
        tint: "bg-reward-soft text-reward",
        badge: "Max Pro",
      },
    ],
  },
];

function More() {
  return (
    <AppShell title="More">
      <div className="space-y-5">
        <Link
          to="/subscribe"
          className="brand-gradient flex items-center gap-3 rounded-2xl p-4 text-primary-foreground"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold">Unlock everything</span>
            <span className="block text-xs opacity-90">
              3D models, AI tutor, ad-free study and priority support
            </span>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Link>

        {GROUPS.map((group) => (
          <section key={group.heading} className="space-y-2">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {group.heading}
            </h2>
            <div className="surface divide-y divide-border/70 overflow-hidden p-0">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.tint}`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {item.label}
                      {item.badge ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
