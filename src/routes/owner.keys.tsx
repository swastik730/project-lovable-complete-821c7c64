import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";
import { verifyRazorpayKeys } from "@/lib/ai.functions";

export const Route = createFileRoute("/owner/keys")({
  component: OwnerKeysPage,
});

const KEYS = [
  { key: "razorpay_key_id", label: "Razorpay Key ID", hint: "Starts with rzp_live_ or rzp_test_" },
  { key: "razorpay_key_secret", label: "Razorpay Key Secret", hint: "Never shown again after saving" },
  {
    key: "razorpay_webhook_secret",
    label: "Razorpay Webhook Secret",
    hint: "Set the same secret in Razorpay → Webhooks so plans activate automatically",
  },
] as const;

function OwnerKeysPage() {
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [testing, setTesting] = useState(false);
  const verifyKeys = useServerFn(verifyRazorpayKeys);
  const [origin, setOrigin] = useState("");
  const webhookUrl = `${origin || "https://your-app.lovable.app"}/api/public/razorpay-webhook`;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function load() {
    const [{ data: keys }, { data: paymentsReady }] = await Promise.all([
      supabase.rpc("secure_setting_keys"),
      supabase.rpc("payments_ready"),
    ]);
    const map: Record<string, string> = {};
    ((keys as { key: string; updated_at: string }[] | null) ?? []).forEach((r) => {
      map[r.key] = r.updated_at;
    });
    setSaved(map);
    setReady(paymentsReady === true);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(key: string) {
    const value = (values[key] ?? "").trim();
    setBusy(key);
    const { data, error } = await supabase.rpc("set_secure_setting", { _key: key, _value: value });
    setBusy(null);
    if (error || data !== true) {
      toast.error("Could not save key", { description: error?.message });
      return;
    }
    toast.success(value ? "Key saved" : "Key removed");
    setValues({ ...values, [key]: "" });
    void load();
  }

  async function testKeys() {
    setTesting(true);
    try {
      const r = await verifyKeys({
        data: {
          keyId: (values["razorpay_key_id"] ?? "").trim(),
          keySecret: (values["razorpay_key_secret"] ?? "").trim(),
        },
      });
      if (r.ok) toast.success("Razorpay keys work", { description: r.message });
      else toast.error("Key check failed", { description: r.message });
    } catch (e) {
      toast.error("Key check failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="surface flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold">Payment keys</p>
          <p className="text-xs text-muted-foreground">
            {ready ? "Razorpay is configured — checkout is live." : "Add both Razorpay keys to enable checkout."}
          </p>
        </div>
      </section>

      <button
        type="button"
        onClick={() => void testKeys()}
        disabled={testing}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-input text-sm font-bold disabled:opacity-60"
      >
        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        Test Razorpay keys
      </button>

      {KEYS.map((k) => (
        <section key={k.key} className="surface space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{k.label}</p>
            {saved[k.key] && <CheckCircle2 className="h-4 w-4 text-success" />}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {saved[k.key] ? `Saved on ${new Date(saved[k.key]!).toLocaleDateString("en-IN")}` : k.hint}
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={values[k.key] ?? ""}
              onChange={(e) => setValues({ ...values, [k.key]: e.target.value })}
              placeholder={saved[k.key] ? "Enter new value to replace" : "Paste value"}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
            <button
              type="button"
              onClick={() => void save(k.key)}
              disabled={busy === k.key}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy === k.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        </section>
      ))}

      <section className="surface space-y-2 p-4">
        <p className="text-sm font-bold">Webhook URL</p>
        <p className="text-[11px] text-muted-foreground">
          Paste this in Razorpay → Settings → Webhooks and subscribe to <b>payment.captured</b>, <b>order.paid</b>,{" "}
          <b>payment.failed</b> and <b>refund.processed</b>.
        </p>
        <code className="block break-all rounded-lg bg-muted p-2 text-[11px] font-semibold">{webhookUrl}</code>
      </section>

      <p className="text-[11px] text-muted-foreground">
        Keys are stored privately in the backend and are never sent to the app. Leave a field empty and press Save to
        delete a key.
      </p>
    </div>
  );
}
