import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, CheckCircle2, Loader2, Save, ShieldAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { getAiSettings, saveAiSettings, verifyAiKey } from "@/lib/ai.functions";

export const Route = createFileRoute("/owner/ai")({
  component: OwnerAiPage,
});

type Provider = "lovable" | "openai" | "gemini" | "openrouter";

const PROVIDERS: { id: Provider; label: string; hint: string; model: string }[] = [
  {
    id: "lovable",
    label: "Built-in AI",
    hint: "No key needed — included with the app. Best for getting started.",
    model: "google/gemini-3.5-flash",
  },
  { id: "openai", label: "OpenAI", hint: "Paste a key that starts with sk-…", model: "gpt-4o-mini" },
  { id: "gemini", label: "Google Gemini", hint: "Google AI Studio key (AIza…)", model: "gemini-2.5-flash" },
  {
    id: "openrouter",
    label: "OpenRouter",
    hint: "Key starts with sk-or-… Use any model slug.",
    model: "google/gemini-2.5-flash",
  },
];

function OwnerAiPage() {
  const load = useServerFn(getAiSettings);
  const save = useServerFn(saveAiSettings);
  const verify = useServerFn(verifyAiKey);

  const [provider, setProvider] = useState<Provider>("lovable");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState("");
  const [usingOwnerKey, setUsingOwnerKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | "clear" | null>(null);

  async function refresh() {
    try {
      const s = await load({});
      setProvider(s.provider as Provider);
      setModel(s.model);
      setHasKey(s.hasKey);
      setKeyPreview(s.keyPreview);
      setUsingOwnerKey(s.usingOwnerKey);
    } catch (e) {
      toast.error("Could not load AI settings", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const active = PROVIDERS.find((p) => p.id === provider)!;

  async function onSave() {
    setBusy("save");
    try {
      await save({ data: { provider, model: model.trim(), apiKey: apiKey.trim() } });
      setApiKey("");
      toast.success("AI settings saved");
      await refresh();
    } catch (e) {
      toast.error("Could not save", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  }

  async function onTest() {
    setBusy("test");
    try {
      const r = await verify({ data: { provider, apiKey: apiKey.trim(), model: model.trim() } });
      if (r.ok) toast.success("Key works", { description: r.message });
      else toast.error("Key check failed", { description: r.message });
    } catch (e) {
      toast.error("Key check failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  }

  async function onClear() {
    setBusy("clear");
    try {
      await save({ data: { provider, model: model.trim(), clearKey: true } });
      toast.success("Saved key removed");
      await refresh();
    } catch (e) {
      toast.error("Could not remove key", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading AI settings…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <section className="surface flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">AI tutor engine</p>
          <p className="text-xs text-muted-foreground">
            {usingOwnerKey ? `Using your own ${active.label} key.` : "Using the built-in AI included with the app."}
          </p>
        </div>
      </section>

      <section className="surface space-y-3 p-4">
        <p className="text-sm font-bold">Provider</p>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                provider === p.id ? "border-primary bg-primary-soft text-primary" : "border-input text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">{active.hint}</p>
      </section>

      <section className="surface space-y-2 p-4">
        <p className="text-sm font-bold">Model</p>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={active.model}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">Leave empty to use the default ({active.model}).</p>
      </section>

      {provider !== "lovable" && (
        <section className="surface space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">API key</p>
            {hasKey && <CheckCircle2 className="h-4 w-4 text-success" />}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {hasKey ? `Saved key: ${keyPreview}` : "No key saved yet — the app will fall back to the built-in AI."}
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "Enter a new key to replace" : "Paste your API key"}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          />
          {hasKey && (
            <button
              type="button"
              onClick={() => void onClear()}
              disabled={busy !== null}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-input px-3 text-[11px] font-bold text-muted-foreground disabled:opacity-60"
            >
              {busy === "clear" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
              Remove saved key
            </button>
          )}
        </section>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={busy !== null}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
        <button
          type="button"
          onClick={() => void onTest()}
          disabled={busy !== null}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-input text-sm font-bold disabled:opacity-60"
        >
          {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Test key
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Keys are stored privately in the backend and are never sent to students' devices. If your key stops working, the
        tutor automatically falls back to the built-in AI.
      </p>
    </div>
  );
}
