import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Check, Crown, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import heroMore from "@/assets/hero-more.webp";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { formatPrice, usePlans, usePremium } from "@/lib/subscription";
import { confirmCheckout, startCheckout } from "@/lib/payments.functions";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Plans & Pricing — BoardBuddy Premium" },
      {
        name: "description",
        content:
          "Unlock BoardBuddy premium: 3D science models, concept videos, ad-free study, all mock tests and the Max Pro AI tutor.",
      },
      { property: "og:title", content: "Plans & Pricing — BoardBuddy Premium" },
      { property: "og:description", content: "Choose a BoardBuddy plan and unlock premium Class 10 study tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscribePage,
});

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type HistoryRow = {
  id: string;
  plan_id: string;
  status: string;
  amount_paise: number;
  created_at: string;
  expires_at: string | null;
};

function SubscribePage() {
  const { user } = useSession();
  const { plans, loading } = usePlans();
  const { entitlement, subscriptionsEnabled, refresh } = usePremium();
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    let active = true;
    void supabase
      .from("subscriptions")
      .select("id,plan_id,status,amount_paise,created_at,expires_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (active) setHistory((data ?? []) as HistoryRow[]);
      });
    return () => {
      active = false;
    };
  }, [user, entitlement]);
  const start = useServerFn(startCheckout);
  const confirm = useServerFn(confirmCheckout);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadRazorpay();
  }, []);

  async function buy(planId: string, planName: string) {
    setError(null);
    setMessage(null);
    if (!user) {
      setError("Please sign in first to subscribe.");
      return;
    }
    setBusy(planId);
    try {
      const ready = await loadRazorpay();
      if (!ready) throw new Error("Checkout could not load. Check your internet connection.");
      const order = await start({ data: { planId } });

      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "BoardBuddy",
        description: `${planName} plan`,
        order_id: order.orderId,
        prefill: { email: user.email ?? "" },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => {
            setBusy(null);
            setError("Payment cancelled.");
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await confirm({
              data: {
                planId,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            setMessage("Payment successful — your plan is active!");
            refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Payment verification failed.");
          } finally {
            setBusy(null);
          }
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <AppShell title="Plans">
      <PageHero
        eyebrow="Premium"
        eyebrowIcon={<Crown className="h-3.5 w-3.5" />}
        title="Study with"
        titleAccent="everything unlocked"
        description="3D science models, concept videos, ad-free practice and the Max Pro AI tutor."
        image={heroMore}
        imageAlt="BoardBuddy premium plans"
        tint="purple"
      />

      {!subscriptionsEnabled && (
        <div className="surface mt-4 p-4 text-xs font-semibold text-muted-foreground">
          Subscriptions are currently switched off, so every feature is open for all students right now.
        </div>
      )}

      {entitlement && (
        <div className="surface mt-4 flex items-center gap-2 p-4 text-xs font-bold text-success">
          <ShieldCheck className="h-4 w-4" />
          Active plan until {new Date(entitlement.expires_at).toLocaleDateString("en-IN")}
        </div>
      )}

      {message && <p className="mt-4 rounded-xl bg-success/12 p-3 text-xs font-bold text-success">{message}</p>}
      {error && <p className="mt-4 rounded-xl bg-destructive/12 p-3 text-xs font-bold text-destructive">{error}</p>}

      <div className="mt-5 space-y-3">
        {loading && <p className="text-xs text-muted-foreground">Loading plans…</p>}
        {plans.map((plan) => {
          const isMax = plan.tier === "max";
          return (
            <article key={plan.id} className={isMax ? "surface p-4 ring-2 ring-primary/40" : "surface p-4"}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-extrabold">{plan.name}</h2>
                    {isMax && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-[11px] font-semibold text-muted-foreground">{plan.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold leading-none">{formatPrice(plan.price_paise)}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {plan.duration_days >= 365
                      ? "per year"
                      : plan.duration_days >= 30
                        ? "per month"
                        : `${plan.duration_days} days`}
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs font-medium text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={busy === plan.id}
                onClick={() => void buy(plan.id, plan.name)}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {busy === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {entitlement ? "Extend with this plan" : `Get ${plan.name}`}
              </button>
            </article>
          );
        })}
      </div>

      {!user && (
        <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">
          <Link to="/auth" className="text-primary underline">
            Sign in
          </Link>{" "}
          to buy a plan and sync it across devices.
        </p>
      )}

      {history.length > 0 && (
        <section className="surface mt-5 p-4">
          <h2 className="text-sm font-extrabold">Payment history</h2>
          <ul className="mt-2 divide-y divide-border">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold capitalize">{h.plan_id.replace(/[-_]/g, " ")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(h.created_at).toLocaleDateString("en-IN")}
                    {h.expires_at ? ` · valid till ${new Date(h.expires_at).toLocaleDateString("en-IN")}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{formatPrice(h.amount_paise)}</p>
                  <p
                    className={
                      h.status === "active"
                        ? "text-[11px] font-bold text-success"
                        : "text-[11px] font-semibold text-muted-foreground"
                    }
                  >
                    {h.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Payments are processed securely by Razorpay. Plans do not auto-renew.
      </p>
    </AppShell>
  );
}
