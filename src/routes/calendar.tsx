import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SUBJECTS } from "@/lib/curriculum";
import { useAppState } from "@/lib/store";
import { addScheduleItem, removeScheduleItem, useSchedule } from "@/lib/schedule";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Study Calendar | BoardBuddy" },
      {
        name: "description",
        content:
          "Plan your Class 10 board preparation day by day: schedule chapters, mock tests and revision, and see the days you studied.",
      },
      { property: "og:title", content: "Study Calendar | BoardBuddy" },
      { property: "og:description", content: "Plan chapters, tests and revision for every day of your board prep." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(key(today));
  const [open, setOpen] = useState(false);
  const state = useAppState();
  const schedule = useSchedule();

  const studiedDays = useMemo(
    () => new Set(state.attempts.map((a) => a.date.slice(0, 10))),
    [state.attempts],
  );
  const plannedDays = useMemo(() => new Set(schedule.map((s) => s.date)), [schedule]);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];

  const dayItems = schedule.filter((s) => s.date === selected);

  return (
    <AppShell title="Study Calendar">
      <section className="surface mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-bold">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground">
          {DAYS.map((d) => (
            <span key={d} className="py-1">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const k = key(d);
            const isToday = k === key(today);
            const isSelected = k === selected;
            const studied = studiedDays.has(k);
            const planned = plannedDays.has(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                className="flex flex-col items-center py-1"
              >
                <span
                  className={
                    "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors " +
                    (isSelected
                      ? "brand-gradient text-primary-foreground"
                      : studied
                        ? "bg-success-soft text-success"
                        : isToday
                          ? "bg-primary-soft text-primary"
                          : "text-foreground hover:bg-muted")
                  }
                >
                  {d.getDate()}
                </span>
                <span className={"mt-0.5 h-1 w-1 rounded-full " + (planned ? "bg-primary" : "bg-transparent")} />
              </button>
            );
          })}
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">
          {selected === key(today) ? "Today" : "Plan"} · {selected.split("-").reverse().join("/")}
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Add Schedule
        </button>
      </div>

      {open ? <ScheduleForm date={selected} onDone={() => setOpen(false)} /> : null}

      {dayItems.length === 0 ? (
        <div className="surface p-6 text-center text-xs text-muted-foreground">
          Nothing scheduled for this day. Use &quot;Add Schedule&quot; to plan it.
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {dayItems.map((s) => {
            const subject = SUBJECTS.find((x) => x.id === s.subjectId);
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary-soft text-[10px] font-extrabold text-primary">
                  {subject?.short ?? "GEN"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.from} – {s.to}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${s.title}`}
                  onClick={() => removeScheduleItem(s.id)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function ScheduleForm({ date, onDone }: { date: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(SUBJECTS[0]?.id ?? "science");
  const [from, setFrom] = useState("16:00");
  const [to, setTo] = useState("17:00");

  return (
    <form
      className="surface mb-4 space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        addScheduleItem({ date, subjectId, title: title.trim(), from, to });
        onDone();
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Chapter or task (e.g. Acids, Bases and Salts)"
        aria-label="Schedule title"
        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <Select value={subjectId} onValueChange={setSubjectId}>
        <SelectTrigger
          aria-label="Subject"
          className="h-auto w-full rounded-2xl border-border bg-background px-4 py-2.5 text-sm"
        >
          <SelectValue placeholder="Subject" />
        </SelectTrigger>
        <SelectContent className="z-[60] max-h-72">
          {SUBJECTS.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-3">
        <input
          type="time"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Start time"
          className="flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="time"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="End time"
          className="flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        className="brand-gradient w-full rounded-2xl py-2.5 text-sm font-bold text-primary-foreground"
      >
        Save schedule
      </button>
    </form>
  );
}