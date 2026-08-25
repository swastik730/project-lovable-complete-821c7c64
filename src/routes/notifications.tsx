import { createFileRoute } from "@tanstack/react-router";
import { BellRing, CalendarCheck, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | BoardBuddy" },
      {
        name: "description",
        content: "Study reminders, new chapter alerts, daily challenge updates and result notifications for Class 10 students.",
      },
      { property: "og:title", content: "Notifications | BoardBuddy" },
      { property: "og:description", content: "Stay on track with study reminders and new content alerts." },
    ],
  }),
  component: Notifications,
});

const ITEMS = [
  {
    icon: Sparkles,
    tint: "bg-primary-soft text-primary",
    title: "Daily Challenge is live",
    body: "10 mixed questions from all subjects. Finish it to keep your streak alive.",
    time: "Today",
  },
  {
    icon: CalendarCheck,
    tint: "bg-success-soft text-success",
    title: "Study reminder",
    body: "Your best study slot is in the evening. Complete today's goal before bed.",
    time: "Today",
  },
  {
    icon: Trophy,
    tint: "bg-reward-soft text-reward",
    title: "New chapters added",
    body: "Science — Electricity and Maths — Trigonometry question banks were updated.",
    time: "This week",
  },
];

function Notifications() {
  return (
    <AppShell title="Notifications">
      <div className="space-y-3">
        {ITEMS.map((n) => (
          <article key={n.title} className="surface flex gap-3 p-4">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.tint}`}>
              <n.icon className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold">{n.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
              <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{n.time}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <BellRing className="h-3.5 w-3.5" /> Personalised reminders arrive as you study
      </p>
    </AppShell>
  );
}
