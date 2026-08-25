/** Razorpay helpers — server only. Keys live in the private `secure_settings` table. */
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RazorpayKeys = { keyId: string; keySecret: string };

export async function getRazorpayKeys(): Promise<RazorpayKeys | null> {
  const { data } = await supabaseAdmin
    .from("secure_settings")
    .select("key,value")
    .in("key", ["razorpay_key_id", "razorpay_key_secret"]);
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  const keyId = map.get("razorpay_key_id");
  const keySecret = map.get("razorpay_key_secret");
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export async function getSecureSetting(key: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("secure_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function getPlan(planId: string) {
  const { data } = await supabaseAdmin.from("plans").select("*").eq("id", planId).maybeSingle();
  return data;
}

export async function createRazorpayOrder(keys: RazorpayKeys, amountPaise: number, receipt: string) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${btoa(`${keys.keyId}:${keys.keySecret}`)}`,
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, payment_capture: 1 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string; amount: number; currency: string };
}

export function verifyRazorpaySignature(keys: RazorpayKeys, orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", keys.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function recordPendingSubscription(input: {
  userId: string;
  planId: string;
  amountPaise: number;
  orderId: string;
}) {
  const { error } = await supabaseAdmin.from("subscriptions").insert({
    user_id: input.userId,
    plan_id: input.planId,
    amount_paise: input.amountPaise,
    razorpay_order_id: input.orderId,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

export async function activateSubscription(input: {
  userId: string;
  orderId: string;
  paymentId: string;
  durationDays: number;
}) {
  const now = new Date();
  const expires = new Date(now.getTime() + input.durationDays * 24 * 60 * 60 * 1000);
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      razorpay_payment_id: input.paymentId,
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    .eq("razorpay_order_id", input.orderId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Order not found for this account");
  return { expiresAt: expires.toISOString() };
}
