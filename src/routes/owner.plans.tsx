import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatPrice, saveSubscriptionsEnabled, usePlans, useSubscriptionsEnabled } from "@/lib/subscription";

type PlanPatch = {
  name: string;
  tagline: string | null;
  price_paise: number;
  duration_days: number;
  features: string[];
  active: boolean;
};

export const Route = createFileRoute("/owner/plans")({
  component: OwnerPlansPage,
});

function OwnerPlansPage() {
  const { enabled, ready } = useSubscriptionsEnabled();
  const { plans, loading, refresh } = usePlans(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  async function toggleMaster() {
    setToggling(true);
    try {
      await saveSubscriptionsEnabled(!enabled);
      toast.success(!enabled ? "Subscriptions are ON" : "Subscriptions are OFF — everything is open");
    } catch (e) {
      toast.error("Could not save", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setToggling(false);
    }
  }

  async function savePlan(id: string, patch: PlanPatch) {
    setSaving(id);
    const { error } = await supabase.from("plans").update(patch).eq("id", id);
    setSaving(null);
    if (error) toast.error("Save failed", { description: error.message });
    else {
      toast.success("Plan updated");
      refresh();
    }
  }

  return (
    <div className="space-y-4">
      <section className="surface flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold">Subscriptions</p>
          <p className="text-xs text-muted-foreground">
            {ready
              ? enabled
                ? "ON — premium features need a paid plan."
                : "OFF — every feature is open to all students."
              : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggleMaster()}
          disabled={toggling || !ready}
          aria-pressed={enabled}
          className="shrink-0 disabled:opacity-60"
        >
          {enabled ? (
            <ToggleRight className="h-8 w-8 text-success" />
          ) : (
            <ToggleLeft className="h-8 w-8 text-muted-foreground" />
          )}
        </button>
      </section>

      {loading && <p className="text-xs text-muted-foreground">Loading plans…</p>}

      {plans.map((plan) => (
        <PlanEditor key={plan.id} plan={plan} saving={saving === plan.id} onSave={savePlan} />
      ))}
    </div>
  );
}

function PlanEditor({
  plan,
  saving,
  onSave,
}: {
  plan: { id: string; name: string; tagline: string | null; price_paise: number; duration_days: number; active: boolean; features: string[] };
  saving: boolean;
  onSave: (id: string, patch: PlanPatch) => Promise<void>;
}) {
  const [name, setName] = useState(plan.name);
  const [tagline, setTagline] = useState(plan.tagline ?? "");
  const [rupees, setRupees] = useState(String(plan.price_paise / 100));
  const [days, setDays] = useState(String(plan.duration_days));
  const [features, setFeatures] = useState(plan.features.join("\n"));
  const [active, setActive] = useState(plan.active);

  return (
    <section className="surface space-y-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{plan.id}</p>
        <label className="flex items-center gap-1.5 text-xs font-bold">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        placeholder="Plan name"
      />
      <input
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        placeholder="Tagline"
      />
      <div className="flex gap-2">
        <input
          value={rupees}
          onChange={(e) => setRupees(e.target.value)}
          inputMode="numeric"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          placeholder="Price ₹"
        />
        <input
          value={days}
          onChange={(e) => setDays(e.target.value)}
          inputMode="numeric"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          placeholder="Days"
        />
      </div>
      <textarea
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-input bg-background p-3 text-xs"
        placeholder="One feature per line"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground">
          Now: {formatPrice(plan.price_paise)} · {plan.duration_days} days
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            void onSave(plan.id, {
              name: name.trim(),
              tagline: tagline.trim() || null,
              price_paise: Math.max(0, Math.round(Number(rupees) * 100)) || 0,
              duration_days: Math.max(1, Number(days) || 1),
              features: features
                .split("\n")
                .map((f) => f.trim())
                .filter(Boolean),
              active,
            })
          }
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
        </button>
      </div>
    </section>
  );
}
