import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info, Loader2, Save, Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_AD_SETTINGS,
  TEST_UNITS,
  saveAdSettings,
  useAdSettings,
  type AdSettings,
} from "@/lib/ads";
import { logAudit } from "@/lib/audit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/owner/ads")({
  component: OwnerAds,
});

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        {hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Field({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block px-4 py-3">
      <span className="block text-xs font-bold text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
      />
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function OwnerAds() {
  const { settings, ready } = useAdSettings();
  const [draft, setDraft] = useState<AdSettings>(DEFAULT_AD_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready || hydrated) return;
    setDraft(settings);
    setHydrated(true);
  }, [ready, hydrated, settings]);

  const set = <K extends keyof AdSettings>(key: K, value: AdSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await saveAdSettings(draft);
      await logAudit("ads.update", {
        enabled: draft.enabled,
        banner: draft.bannerEnabled,
        interstitial: draft.interstitialEnabled,
        delay: draft.interstitialDelaySeconds,
        testMode: draft.testMode,
      });
      toast.success("Ad settings saved");
    } catch (e) {
      toast.error("Could not save", { description: (e as Error).message });
    }
    setSaving(false);
  };

  if (!ready || !hydrated) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading ad settings…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface flex items-start gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">AdMob control</p>
          <p className="text-[11px] text-muted-foreground">
            One interstitial per app open after the delay below. Ads never appear during a test or quiz attempt.
          </p>
        </div>
      </div>

      <div className="surface divide-y divide-border">
        <Toggle
          label="Ads enabled"
          hint="Master switch for every placement"
          checked={draft.enabled}
          onChange={(v) => set("enabled", v)}
        />
        <Toggle
          label="Interstitial ad"
          hint="Full screen ad after the app opens"
          checked={draft.interstitialEnabled}
          onChange={(v) => set("interstitialEnabled", v)}
        />
        <Toggle
          label="Only once per session"
          hint="Reset when the app is closed and opened again"
          checked={draft.oncePerSession}
          onChange={(v) => set("oncePerSession", v)}
        />
        <Toggle
          label="Bottom banner"
          hint="50px anchored banner above the navigation"
          checked={draft.bannerEnabled}
          onChange={(v) => set("bannerEnabled", v)}
        />
        <Toggle
          label="Rewarded ads"
          hint="Reserved for future reward placements"
          checked={draft.rewardedEnabled}
          onChange={(v) => set("rewardedEnabled", v)}
        />
        <Toggle
          label="Google test ads"
          hint="Use Google's test ad units instead of your real ones"
          checked={draft.testMode}
          onChange={(v) => set("testMode", v)}
        />
        <Toggle
          label="Preview placeholder in browser"
          hint="Draw a fake ad in the web build to check timing/placement"
          checked={draft.previewPlaceholder}
          onChange={(v) => set("previewPlaceholder", v)}
        />
      </div>

      <div className="surface p-4">
        <p className="text-xs font-bold text-muted-foreground">Interstitial delay</p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={draft.interstitialDelaySeconds}
            onChange={(e) => set("interstitialDelaySeconds", Number(e.target.value))}
            className="h-2 flex-1 accent-[var(--color-primary)]"
          />
          <span className="w-16 rounded-lg bg-muted px-2 py-1 text-center text-xs font-extrabold tabular-nums">
            {draft.interstitialDelaySeconds}s
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Seconds after the app opens before the interstitial is requested.
        </p>
      </div>

      <div className="surface divide-y divide-border">
        <p className="px-4 pt-3 text-xs font-bold text-muted-foreground">Ad unit IDs (AdMob console)</p>
        <Field
          label="Android App ID"
          value={draft.appIdAndroid}
          placeholder="ca-app-pub-xxxxxxxx~xxxxxxxx"
          onChange={(v) => set("appIdAndroid", v)}
        />
        <Field
          label="Banner unit ID"
          value={draft.bannerUnitId}
          placeholder={TEST_UNITS.banner}
          onChange={(v) => set("bannerUnitId", v)}
        />
        <Field
          label="Interstitial unit ID"
          value={draft.interstitialUnitId}
          placeholder={TEST_UNITS.interstitial}
          onChange={(v) => set("interstitialUnitId", v)}
        />
        <Field
          label="App open unit ID"
          value={draft.appOpenUnitId}
          placeholder={TEST_UNITS.appOpen}
          onChange={(v) => set("appOpenUnitId", v)}
        />
        <Field
          label="Rewarded unit ID"
          value={draft.rewardedUnitId}
          placeholder={TEST_UNITS.rewarded}
          onChange={(v) => set("rewardedUnitId", v)}
        />
        <Field
          label="Privacy policy URL"
          hint="Required by the Play Store when ads are on."
          value={draft.privacyPolicyUrl}
          placeholder="https://…"
          onChange={(v) => set("privacyPolicyUrl", v)}
        />
      </div>

      {draft.testMode ? (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft p-3 text-[11px] font-semibold text-warning">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Test mode is on — Google test ads are served, so your AdMob account stays safe. Turn it off before release.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="brand-gradient inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-extrabold text-primary-foreground disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save ad settings
      </button>
    </div>
  );
}
