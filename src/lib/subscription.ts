/**
 * Subscription state for the app.
 *
 * A master switch lives in `app_settings` under `subscriptions_enabled`.
 * When it is OFF the whole app behaves as before (everything unlocked and no
 * pricing wording anywhere). When it is ON, premium content is gated behind an
 * active subscription and the Subscribe CTAs appear.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";

export const SUBSCRIPTIONS_ENABLED_KEY = "subscriptions_enabled";

export type Plan = {
  id: string;
  name: string;
  tagline: string | null;
  price_paise: number;
  duration_days: number;
  tier: string;
  features: string[];
  active: boolean;
  sort: number;
};

export type Entitlement = {
  plan_id: string;
  tier: string;
  expires_at: string;
};

export function formatPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ *
 * Master switch (shared cache so every screen agrees)
 * ------------------------------------------------------------------ */

let cachedEnabled: boolean | undefined;
const listeners = new Set<(v: boolean) => void>();

async function fetchEnabled() {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SUBSCRIPTIONS_ENABLED_KEY)
    .maybeSingle();
  cachedEnabled = (data?.value as string | undefined) === "on";
  listeners.forEach((l) => l(cachedEnabled as boolean));
}

export function useSubscriptionsEnabled() {
  const [enabled, setEnabled] = useState<boolean>(cachedEnabled ?? false);
  const [ready, setReady] = useState(cachedEnabled !== undefined);

  useEffect(() => {
    const listener = (v: boolean) => {
      setEnabled(v);
      setReady(true);
    };
    listeners.add(listener);
    if (cachedEnabled === undefined) void fetchEnabled();
    else listener(cachedEnabled);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { enabled, ready };
}

export async function saveSubscriptionsEnabled(next: boolean) {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from("app_settings").upsert({
    key: SUBSCRIPTIONS_ENABLED_KEY,
    value: next ? "on" : "off",
    updated_by: sessionData.session?.user.id ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  cachedEnabled = next;
  listeners.forEach((l) => l(next));
}

/* ------------------------------------------------------------------ *
 * Plans + entitlement
 * ------------------------------------------------------------------ */

export function usePlans(includeInactive = false) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void supabase
      .from("plans")
      .select("*")
      .order("sort", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        const rows = (data ?? []).map((p) => ({
          ...p,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
        })) as Plan[];
        setPlans(includeInactive ? rows : rows.filter((p) => p.active));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [includeInactive, nonce]);

  return { plans, loading, refresh };
}

export function useEntitlement() {
  const { user, ready } = useSession();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    if (!ready) return;
    if (!user) {
      setEntitlement(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void supabase.rpc("my_entitlement").then(({ data }) => {
      if (!active) return;
      const row = (data as Entitlement[] | null)?.[0] ?? null;
      setEntitlement(row);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, ready, nonce]);

  return { entitlement, loading: loading || !ready, refresh };
}

/**
 * The single question every screen asks: may this person use premium content?
 * Subscriptions OFF → everyone is premium.
 */
export function usePremium() {
  const { enabled, ready: switchReady } = useSubscriptionsEnabled();
  const { entitlement, loading, refresh } = useEntitlement();

  const active = !!entitlement;
  return {
    subscriptionsEnabled: enabled,
    entitlement,
    isPremium: !enabled || active,
    isMax: !!entitlement && entitlement.tier === "max",
    ready: switchReady && !loading,
    refresh,
  };
}

/** Blue-tick user ids (Max Pro subscribers) for public lists. */
export function useVerifiedUsers() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    void supabase.rpc("verified_users").then(({ data }) => {
      if (!active) return;
      const rows = (data as { user_id: string }[] | null) ?? [];
      setIds(new Set(rows.map((r) => r.user_id)));
    });
    return () => {
      active = false;
    };
  }, []);

  return ids;
}
