import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_PROVIDER_IDS, readAiSettings, testAiKey, testRazorpayKeys } from "./ai.server";

const providerSchema = z.enum(["lovable", "openai", "gemini", "openrouter"]);

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (staff !== true) throw new Error("Owner access required.");
    return { ...(await readAiSettings()), providers: AI_PROVIDER_IDS };
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        provider: providerSchema,
        model: z.string().max(120).optional(),
        apiKey: z.string().max(400).optional(),
        clearKey: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (staff !== true) throw new Error("Owner access required.");

    await context.supabase.rpc("set_secure_setting", { _key: "ai_provider", _value: data.provider });
    await context.supabase.rpc("set_secure_setting", { _key: "ai_model", _value: (data.model ?? "").trim() });

    const key = (data.apiKey ?? "").trim();
    if (data.clearKey) {
      await context.supabase.rpc("set_secure_setting", { _key: "ai_api_key", _value: "" });
    } else if (key) {
      await context.supabase.rpc("set_secure_setting", { _key: "ai_api_key", _value: key });
    }

    return readAiSettings();
  });

export const verifyAiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        provider: providerSchema,
        apiKey: z.string().max(400).optional(),
        model: z.string().max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (staff !== true) throw new Error("Owner access required.");
    return testAiKey({ provider: data.provider, apiKey: data.apiKey ?? "", model: data.model ?? "" });
  });

export const verifyRazorpayKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        keyId: z.string().max(200).optional(),
        keySecret: z.string().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (staff !== true) throw new Error("Owner access required.");
    return testRazorpayKeys({ keyId: data.keyId ?? "", keySecret: data.keySecret ?? "" });
  });
