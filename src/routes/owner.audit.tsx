import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { History, Loader2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/owner/audit")({
  component: OwnerAudit,
});

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  details: unknown;
  created_at: string;
};

function OwnerAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error: err } = await supabase
        .from("audit_log")
        .select("id,actor_id,actor_name,action,details,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (err) setError(err.message);
      setRows((data ?? []) as AuditRow[]);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.action.toLowerCase().includes(q) ||
        (r.actor_name ?? "").toLowerCase().includes(q) ||
        JSON.stringify(r.details ?? {}).toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log…
      </p>
    );
  }

  return (
    <>
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <History className="h-4 w-4 text-primary" /> Audit log
      </h2>

      <div className="surface mb-3 flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by action or user"
          className="h-9 w-full bg-transparent text-sm outline-none"
        />
      </div>

      {error && <p className="mb-3 rounded-xl bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive">{error}</p>}

      <div className="surface divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="p-5 text-center text-xs text-muted-foreground">No activity recorded yet.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">{r.action}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-semibold">{r.actor_name ?? r.actor_id ?? "System"}</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                {JSON.stringify(r.details ?? {}, null, 0)}
              </pre>
            </div>
          ))
        )}
      </div>
    </>
  );
}
