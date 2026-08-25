import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_SUPPORT_SETTINGS, saveSupportSettings, useSupportSettings, type SupportSettings } from "@/lib/support";

export const Route = createFileRoute("/owner/support")({
  component: OwnerSupportPage,
});

const FIELDS: { key: keyof SupportSettings; label: string; placeholder: string; hint?: string }[] = [
  { key: "phone", label: "Customer care number", placeholder: "+91 90000 00000" },
  { key: "whatsapp", label: "WhatsApp number", placeholder: "+91 90000 00000", hint: "Optional" },
  { key: "email", label: "Support email (Gmail)", placeholder: "support@gmail.com" },
  { key: "hours", label: "Support hours", placeholder: "Mon–Sat, 10:00 AM – 7:00 PM IST" },
  { key: "note", label: "Extra note", placeholder: "We reply within 12 hours.", hint: "Optional" },
];

function OwnerSupportPage() {
  const { settings, ready } = useSupportSettings();
  const [draft, setDraft] = useState<SupportSettings>(DEFAULT_SUPPORT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready) setDraft(settings);
  }, [ready, settings]);

  async function save() {
    setSaving(true);
    try {
      await saveSupportSettings(draft);
      toast.success("Support details saved");
    } catch (e) {
      toast.error("Could not save", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="surface p-4">
        <p className="text-sm font-bold">Max Pro support</p>
        <p className="mt-1 text-xs text-muted-foreground">
          These contact details are shown only to students with an active Max Pro plan, on the Support page.
        </p>
      </section>

      <section className="surface space-y-3 p-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs font-bold">
              {f.label}
              {f.hint ? <span className="ml-1 font-semibold text-muted-foreground">({f.hint})</span> : null}
            </span>
            <input
              value={draft[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
        ))}

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !ready}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </section>
    </div>
  );
}
