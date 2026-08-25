import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "./auth";

export type AppRole = "owner" | "admin" | "student";

/** Server-verified roles for the signed-in user (RLS: users only see their own). */
export function useRoles() {
  const { user, ready } = useSession();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    if (!ready) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        setRoles((data ?? []).map((r) => r.role as AppRole));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, ready, nonce]);

  return {
    roles,
    loading: loading || !ready,
    isOwner: roles.includes("owner"),
    isAdmin: roles.includes("owner") || roles.includes("admin"),
    refresh,
  };
}
