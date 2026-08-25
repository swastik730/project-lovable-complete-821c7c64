/**
 * Razorpay webhook — the authoritative source of truth for subscription status.
 *
 * Configure in the Razorpay dashboard:
 *   URL:    https://<your-app>/api/public/razorpay-webhook
 *   Events: payment.captured, order.paid, payment.failed, refund.processed
 *   Secret: same value saved in the owner panel as `razorpay_webhook_secret`
 *
 * Every request is HMAC-SHA256 verified before anything is written.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

type RazorpayEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string } };
    order?: { entity?: { id?: string } };
    refund?: { entity?: { payment_id?: string } };
    subscription?: { entity?: { id?: string } };
  };
};

function safeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: secretRow } = await supabaseAdmin
          .from("secure_settings")
          .select("value")
          .eq("key", "razorpay_webhook_secret")
          .maybeSingle();
        const secret = secretRow?.value;
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        if (!signature || !safeEqualHex(signature, expected)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: RazorpayEvent;
        try {
          event = JSON.parse(body) as RazorpayEvent;
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const name = event.event ?? "";
        const payment = event.payload?.payment?.entity;
        const orderId = payment?.order_id ?? event.payload?.order?.entity?.id ?? null;

        if (name === "payment.captured" || name === "order.paid") {
          if (!orderId) return new Response("ok");

          const { data: sub } = await supabaseAdmin
            .from("subscriptions")
            .select("id,plan_id,status")
            .eq("razorpay_order_id", orderId)
            .maybeSingle();
          if (!sub) return new Response("ok");
          if (sub.status === "active") return new Response("ok"); // idempotent replay

          const { data: plan } = await supabaseAdmin
            .from("plans")
            .select("duration_days")
            .eq("id", sub.plan_id)
            .maybeSingle();

          const now = new Date();
          const expires = new Date(now.getTime() + (plan?.duration_days ?? 30) * 24 * 60 * 60 * 1000);
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              razorpay_payment_id: payment?.id ?? null,
              starts_at: now.toISOString(),
              expires_at: expires.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", sub.id);
          return new Response("ok");
        }

        if (name === "payment.failed" && orderId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("razorpay_order_id", orderId)
            .eq("status", "pending");
          return new Response("ok");
        }

        if (name === "subscription.cancelled" || name === "subscription.halted") {
          // This app charges one-time orders per plan, so a cancellation is matched
          // through the order that created the subscription row.
          const now = new Date().toISOString();
          if (orderId) {
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "cancelled", expires_at: now, updated_at: now })
              .eq("razorpay_order_id", orderId);
          }
          return new Response("ok");
        }


        // payment.refunded, refund.created, refund.processed — revoke access immediately.
        const refundedPaymentId =
          event.payload?.refund?.entity?.payment_id ?? (name === "payment.refunded" ? (payment?.id ?? null) : null);
        if ((name === "payment.refunded" || name.startsWith("refund.")) && (refundedPaymentId || orderId)) {
          const now = new Date().toISOString();
          const query = supabaseAdmin
            .from("subscriptions")
            .update({ status: "refunded", expires_at: now, updated_at: now });
          await (refundedPaymentId
            ? query.eq("razorpay_payment_id", refundedPaymentId)
            : query.eq("razorpay_order_id", orderId as string));
          return new Response("ok");
        }


        return new Response("ok");
      },
    },
  },
});
