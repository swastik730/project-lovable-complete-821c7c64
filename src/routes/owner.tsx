import { useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Loader2, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth";
import { useRoles } from "@/lib/roles";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner Panel | BoardBuddy" },
      {
        name: "description",
        content: "Private BoardBuddy owner dashboard: students, roles, question bank imports and audit logs.",
      },
      { property: "og:title", content: "Owner Panel | BoardBuddy" },
      { property: "og:description", content: "Private admin dashboard for BoardBuddy owners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerLayout,
});

const TABS = [
  { to: "/owner", label: "Dashboard", exact: true },
  { to: "/owner/roles", label: "Roles", exact: false },
  { to: "/owner/content", label: "Content", exact: false },
  { to: "/owner/ads", label: "Ads", exact: false },
  { to: "/owner/audit", label: "Audit", exact: false },
  { to: "/owner/errors", label: "Errors", exact: false },
  { to: "/owner/ncert", label: "NCERT", exact: false },
  { to: "/owner/models", label: "Models", exact: false },
  { to: "/owner/plans", label: "Plans", exact: false },
  { to: "/owner/keys", label: "Keys", exact: false },
  { to: "/owner/ai", label: "AI", exact: false },
  { to: "/owner/support", label: "Support", exact: false },

] as const;

function OwnerLayout() {
  const { user, ready } = useSession();
  const { isOwner, loading, refresh } = useRoles();
  const [claiming, setClaiming] = useState(false);

  async function claimOwner() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_owner");
    setClaiming(false);
    if (error) {
      toast.error("Claim failed", { description: error.message });
      return;
    }
    if (data === true) {
      toast.success("Owner access granted");
      refresh();
    } else {
      toast.error("This account cannot become the owner");
    }
  }

  if (!ready || loading) {
    return (
      <AppShell title="Owner Panel">
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
        </p>
      </AppShell>
    );
  }

  if (!user || !isOwner) {
    return (
      <AppShell title="Owner Panel">
        <div className="surface p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold">This page is for the owner only</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user ? "Your account does not have the owner role." : "Sign in with your owner account first."}
          </p>
          <Link
            to={user ? "/" : "/auth"}
            className="brand-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            {user ? "Back to home" : "Sign in"}
          </Link>
          {user ? (
            <button
              type="button"
              onClick={() => void claimOwner()}
              disabled={claiming}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-bold disabled:opacity-60"
            >
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Claim owner access
            </button>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Owner Panel">
      <div className="surface mb-4 flex items-center gap-3 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-success-soft text-success">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">Owner access verified</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <nav className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact }}
            activeProps={{ className: "border-primary bg-primary-soft text-primary" }}
            inactiveProps={{ className: "border-input text-muted-foreground" }}
            className="grid h-10 place-items-center rounded-xl border text-xs font-bold"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </AppShell>
  );
}
