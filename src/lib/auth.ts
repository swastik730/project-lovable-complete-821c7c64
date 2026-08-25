import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearLocalState } from "./store";
import { stopSync, syncUser } from "./cloud";

let started = false;
let session: Session | null = null;
let ready = false;
const listeners = new Set<() => void>();
let syncedUserId: string | null = null;

function emit() {
  listeners.forEach((l) => l());
}

/**
 * Makes sure the signed-in user has a profile row and the student role.
 * Username accounts carry their details in auth metadata, so this runs on
 * every fresh session instead of relying on email confirmation.
 */
async function ensureProfile(next: Session) {
  const meta = (next.user.user_metadata ?? {}) as Record<string, unknown>;
  const str = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string) : null);
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: unknown }>;
  await rpc("bootstrap_profile", {
    _name: str("name"),
    _username: str("username") ?? next.user.email?.split("@")[0] ?? null,
    _recovery_question: str("recovery_question"),
    _recovery_answer_hash: str("recovery_answer_hash"),
  });
}

function handle(next: Session | null) {
  session = next;
  ready = true;
  emit();
  const userId = next?.user.id ?? null;
  if (userId && next && userId !== syncedUserId) {
    syncedUserId = userId;
    void ensureProfile(next).then(() => syncUser(userId));
  } else if (!userId && syncedUserId) {
    syncedUserId = null;
    stopSync();
    clearLocalState();
  }
}


function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.onAuthStateChange((_event, next) => handle(next));
  void supabase.auth.getSession().then(({ data }) => handle(data.session));
}

export function useSession() {
  const [, force] = useState(0);
  useEffect(() => {
    start();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { session, user: session?.user ?? null, ready };
}

export async function signOut() {
  await supabase.auth.signOut();
  handle(null);
}
