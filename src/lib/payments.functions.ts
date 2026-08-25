import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  activateSubscription,
  createRazorpayOrder,
  getPlan,
  getRazorpayKeys,
  recordPendingSubscription,
  verifyRazorpaySignature,
} from "./payments.server";

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ planId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const keys = await getRazorpayKeys();
    if (!keys) throw new Error("Payments are not configured yet. The owner must add Razorpay keys.");

    const plan = await getPlan(data.planId);
    if (!plan || !plan.active) throw new Error("This plan is not available.");

    const order = await createRazorpayOrder(keys, plan.price_paise, `bb_${Date.now()}`);
    await recordPendingSubscription({
      userId: context.userId,
      planId: plan.id,
      amountPaise: plan.price_paise,
      orderId: order.id,
    });

    return {
      keyId: keys.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
    };
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        planId: z.string().min(1),
        orderId: z.string().min(1),
        paymentId: z.string().min(1),
        signature: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const keys = await getRazorpayKeys();
    if (!keys) throw new Error("Payments are not configured.");
    if (!verifyRazorpaySignature(keys, data.orderId, data.paymentId, data.signature)) {
      throw new Error("Payment could not be verified.");
    }
    const plan = await getPlan(data.planId);
    if (!plan) throw new Error("Plan not found.");

    return activateSubscription({
      userId: context.userId,
      orderId: data.orderId,
      paymentId: data.paymentId,
      durationDays: plan.duration_days,
    });
  });
