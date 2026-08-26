/** AI provider config + key testing — server only. Keys live in the private `secure_settings` table. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AiProvider = "lovable" | "openai" | "gemini" | "openrouter";

export const AI_PROVIDERS: Record<
  AiProvider,
  { label: string; baseUrl: string; defaultModel: string; keyHint: string }
> = {
  lovable: {
    label: "Built-in AI (Lovable)",
    baseUrl: "https://ai.gateway.lovable.dev/v1",
    defaultModel: "openai/gpt-5.6-sol",
    keyHint: "No key needed — uses the built-in AI included with the app.",
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    keyHint: "Starts with sk-…",
  },
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    keyHint: "Google AI Studio API key (starts with AIza…)",
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-2.5-flash",
    keyHint: "Starts with sk-or-…",
  },
};

export const AI_PROVIDER_IDS = Object.keys(AI_PROVIDERS) as AiProvider[];

export function isAiProvider(value: string | null | undefined): value is AiProvider {
  return !!value && (AI_PROVIDER_IDS as string[]).includes(value);
}

async function readSecure(keys: string[]) {
  const { data } = await supabaseAdmin.from("secure_settings").select("key,value").in("key", keys);
  return new Map((data ?? []).map((r) => [r.key, r.value]));
}

export type ResolvedAi = {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  ownerKey: boolean;
};

/** Owner-key-first: use the provider + key saved in the owner panel, else the built-in AI. */
export async function resolveAiConfig(): Promise<ResolvedAi> {
  const map = await readSecure(["ai_provider", "ai_api_key", "ai_model"]);
  const provider = isAiProvider(map.get("ai_provider")) ? (map.get("ai_provider") as AiProvider) : "lovable";
  const ownerKey = (map.get("ai_api_key") ?? "").trim();
  const model = (map.get("ai_model") ?? "").trim();

  if (provider !== "lovable" && ownerKey) {
    const cfg = AI_PROVIDERS[provider];
    return { provider, baseUrl: cfg.baseUrl, model: model || cfg.defaultModel, apiKey: ownerKey, ownerKey: true };
  }

  const builtIn = process.env["LOVABLE_API_KEY"];
  if (!builtIn) throw new Error("AI is not configured yet. Add an AI key in the owner panel.");
  return {
    provider: "lovable",
    baseUrl: AI_PROVIDERS.lovable.baseUrl,
    model: provider === "lovable" && model ? model : AI_PROVIDERS.lovable.defaultModel,
    apiKey: builtIn,
    ownerKey: false,
  };
}

/** Public (non-secret) view of the AI settings for the owner panel. */
export async function readAiSettings() {
  const map = await readSecure(["ai_provider", "ai_api_key", "ai_model"]);
  const provider = isAiProvider(map.get("ai_provider")) ? (map.get("ai_provider") as AiProvider) : "lovable";
  const key = (map.get("ai_api_key") ?? "").trim();
  return {
    provider,
    model: (map.get("ai_model") ?? "").trim(),
    hasKey: key.length > 0,
    keyPreview: key ? `${key.slice(0, 4)}••••${key.slice(-4)}` : "",
    usingOwnerKey: provider !== "lovable" && key.length > 0,
  };
}

async function chatProbe(baseUrl: string, apiKey: string, model: string) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with the word: ok" }] }),
  });
  if (res.ok) return { ok: true as const, message: `Key works with ${model}.` };
  const text = (await res.text()).slice(0, 200);
  if (res.status === 401 || res.status === 403) return { ok: false as const, message: "Key rejected (unauthorised)." };
  if (res.status === 429) return { ok: false as const, message: "Key is valid but rate-limited right now." };
  return { ok: false as const, message: `Provider error ${res.status}: ${text}` };
}

/** Verify an AI key. Uses the saved key when `apiKey` is empty. */
export async function testAiKey(input: { provider: AiProvider; apiKey?: string; model?: string }) {
  const cfg = AI_PROVIDERS[input.provider];
  let apiKey = (input.apiKey ?? "").trim();

  if (input.provider === "lovable") {
    apiKey = process.env["LOVABLE_API_KEY"] ?? "";
    if (!apiKey) return { ok: false as const, message: "Built-in AI is not available." };
  } else if (!apiKey) {
    const map = await readSecure(["ai_api_key"]);
    apiKey = (map.get("ai_api_key") ?? "").trim();
    if (!apiKey) return { ok: false as const, message: "No key saved yet — paste a key first." };
  }

  const model = (input.model ?? "").trim() || cfg.defaultModel;
  try {
    return await chatProbe(cfg.baseUrl, apiKey, model);
  } catch {
    return { ok: false as const, message: "Could not reach the provider. Check your network and try again." };
  }
}

/** Verify Razorpay keys by calling a harmless authenticated endpoint. */
export async function testRazorpayKeys(input: { keyId?: string; keySecret?: string }) {
  let keyId = (input.keyId ?? "").trim();
  let keySecret = (input.keySecret ?? "").trim();

  if (!keyId || !keySecret) {
    const map = await readSecure(["razorpay_key_id", "razorpay_key_secret"]);
    keyId = keyId || (map.get("razorpay_key_id") ?? "").trim();
    keySecret = keySecret || (map.get("razorpay_key_secret") ?? "").trim();
  }
  if (!keyId || !keySecret) return { ok: false as const, message: "Save both the Key ID and Key Secret first." };

  try {
    const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      headers: { authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
    });
    if (res.ok) {
      return {
        ok: true as const,
        message: keyId.startsWith("rzp_live_") ? "Live keys verified." : "Test keys verified.",
      };
    }
    if (res.status === 401) return { ok: false as const, message: "Razorpay rejected these keys." };
    const text = (await res.text()).slice(0, 200);
    return { ok: false as const, message: `Razorpay error ${res.status}: ${text}` };
  } catch {
    return { ok: false as const, message: "Could not reach Razorpay. Try again." };
  }
}
