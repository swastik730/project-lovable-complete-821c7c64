import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ShieldCheck, UserCog } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/owner/roles")({
  component: OwnerRoles,
});

type Role = "owner" | "admin" | "student";
type Profile = { id: string; name: string; xp: number; created_at: string };
type RoleRow = { id: string; user_id: string; role: Role };

const ROLES: Role[] = ["owner", "admin", "student"];

function OwnerRoles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id,name,xp,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("id,user_id,role").limit(500),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setRoles((r.data ?? []) as RoleRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const rolesByUser = useMemo(() => {
    const map: Record<string, Role[]> = {};
    for (const r of roles) (map[r.user_id] ??= []).push(r.role);
    return map;
  }, [roles]);

  const filtered = profiles.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.includes(query));

  const toggle = async (userId: string, name: string, role: Role) => {
    setBusy(`${userId}:${role}`);
    setMessage(null);
    const has = (rolesByUser[userId] ?? []).includes(role);
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) setMessage(error.message);
    else {
      await logAudit(has ? "role.revoke" : "role.grant", { user_id: userId, name, role });
      setMessage(`${name}: ${role} ${has ? "removed" : "granted"}.`);
      await load();
    }
    setBusy(null);
  };

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading roles…
      </p>
    );
  }

  return (
    <>
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <UserCog className="h-4 w-4 text-primary" /> Role management
      </h2>

      <div className="surface mb-3 flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or user id"
          className="h-9 w-full bg-transparent text-sm outline-none"
        />
      </div>

      {message && <p className="mb-3 rounded-xl bg-primary-soft px-4 py-2 text-xs font-semibold text-primary">{message}</p>}

      <div className="surface divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="p-5 text-center text-xs text-muted-foreground">No users found.</p>
        ) : (
          filtered.map((p) => {
            const mine = rolesByUser[p.id] ?? [];
            return (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-bold">{p.name}</p>
                  {mine.includes("owner") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">
                      <ShieldCheck className="h-3 w-3" /> owner
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{p.id}</p>
                <div className="mt-2 flex gap-2">
                  {ROLES.map((role) => {
                    const active = mine.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={busy === `${p.id}:${role}`}
                        onClick={() => void toggle(p.id, p.name, role)}
                        className={
                          "h-9 flex-1 rounded-xl border text-xs font-bold capitalize disabled:opacity-50 " +
                          (active ? "border-primary bg-primary-soft text-primary" : "border-input text-muted-foreground")
                        }
                      >
                        {active ? `− ${role}` : `+ ${role}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
