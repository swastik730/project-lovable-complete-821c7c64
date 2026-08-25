import { useSyncExternalStore } from "react";

export type ScheduleItem = {
  id: string;
  date: string; // yyyy-mm-dd
  subjectId: string;
  title: string;
  from: string;
  to: string;
};

const KEY = "tenbuddy.schedule.v1";

let items: ScheduleItem[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const EMPTY: ScheduleItem[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) items = JSON.parse(raw) as ScheduleItem[];
      } catch {
        items = [];
      }
    }
    queueMicrotask(emit);
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSchedule() {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  );
}

export function addScheduleItem(item: Omit<ScheduleItem, "id">) {
  items = [...items, { ...item, id: crypto.randomUUID() }].sort((a, b) =>
    a.date === b.date ? a.from.localeCompare(b.from) : a.date.localeCompare(b.date),
  );
  persist();
  emit();
}

export function removeScheduleItem(id: string) {
  items = items.filter((i) => i.id !== id);
  persist();
  emit();
}