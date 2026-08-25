/**
 * Priority support contact details.
 *
 * Owner edits them in /owner/support; they are stored as one JSON row in
 * `app_settings` (key = `support_config`) and are only shown to Max Pro
 * students.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const SUPPORT_SETTINGS_KEY = "support_config";

export type SupportSettings = {
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  note: string;
};

export const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  phone: "",
  whatsapp: "",
  email: "",
  hours: "Mon–Sat, 10:00 AM – 7:00 PM IST",
  note: "",
};

function parse(value: string | null | undefined): SupportSettings {
  if (!value) return DEFAULT_SUPPORT_SETTINGS;
  try {
    const raw = JSON.parse(value) as Partial<SupportSettings>;
    return { ...DEFAULT_SUPPORT_SETTINGS, ...raw };
  } catch {
    return DEFAULT_SUPPORT_SETTINGS;
  }
}

let cached: SupportSettings | undefined;
const listeners = new Set<(s: SupportSettings) => void>();

async function fetchSettings() {
  const { data } = await supabase.from("app_settings").select("value").eq("key", SUPPORT_SETTINGS_KEY).maybeSingle();
  cached = parse((data?.value as string | undefined) ?? null);
  listeners.forEach((l) => l(cached as SupportSettings));
}

export function useSupportSettings() {
  const [settings, setSettings] = useState<SupportSettings>(cached ?? DEFAULT_SUPPORT_SETTINGS);
  const [ready, setReady] = useState(cached !== undefined);

  useEffect(() => {
    const listener = (s: SupportSettings) => {
      setSettings(s);
      setReady(true);
    };
    listeners.add(listener);
    if (cached === undefined) void fetchSettings();
    else listener(cached);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { settings, ready };
}

export async function saveSupportSettings(next: SupportSettings) {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from("app_settings").upsert({
    key: SUPPORT_SETTINGS_KEY,
    value: JSON.stringify(next),
    updated_by: sessionData.session?.user.id ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  cached = next;
  listeners.forEach((l) => l(next));
}
