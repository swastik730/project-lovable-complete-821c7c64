import { supabase } from "@/lib/supabase";

/** Owner-panel action log: who did what. Fails silently (never blocks UI). */
export async function logAudit(action: string, details: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  await supabase.from("audit_log").insert({
    actor_id: user.id,
    actor_name: (user.user_metadata?.["name"] as string | undefined) ?? user.email ?? "Unknown",
    action,
    details: details as never,
  });
}
