/**
 * Single source of truth for "who can use what".
 *
 * Rules (fixed, owner cannot break them by editing plan text):
 *  - Subscriptions OFF (master switch) → everything is open, no ads.
 *  - Subscriptions ON:
 *      • Free students get the study basics. Some of them are shown after a
 *        short ad (see FREE_AD_SECONDS).
 *      • `pro` features need any active paid plan.
 *      • `max` features (AI tutor, priority support) need the Max Pro plan.
 *  - Access always ends exactly when the plan expires — `my_entitlement`
 *    returns nothing once `expires_at` has passed or the payment was
 *    refunded/cancelled, so the app falls back to the free rules instantly.
 */
import { usePremium } from "@/lib/subscription";

export type FeatureTier = "pro" | "max";

export type PremiumFeature = {
  key: string;
  label: string;
  tier: FeatureTier;
  /** Shown inside the lock card so the student knows what they are missing. */
  description: string;
};

export const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  models: {
    key: "models",
    label: "3D science models",
    tier: "pro",
    description: "Interactive 3D models and concept visuals for Science chapters.",
  },
  tutor: {
    key: "tutor",
    label: "AI doubt tutor",
    tier: "max",
    description: "Step-by-step NCERT-based answers to any doubt, any time.",
  },
  support: {
    key: "support",
    label: "Priority support",
    tier: "max",
    description: "Direct phone and email help from the BoardBuddy team.",
  },
  adfree: {
    key: "adfree",
    label: "Ad-free study",
    tier: "pro",
    description: "No banner or interstitial ads anywhere in the app.",
  },
};

/**
 * Free features that are shown after a short ad.
 * Value = seconds the student has to wait before continuing.
 */
export const FREE_AD_SECONDS: Record<string, number> = {
  tests: 5,
  practice: 3,
  bookmarks: 5,
};

/**
 * Free forever, never behind an ad:
 * NCERT solutions, chapter quiz, daily mixed challenge, my analysis,
 * progress, leaderboard, study calendar, achievements and notifications.
 */
export const FREE_NO_AD = [
  "ncert",
  "quiz",
  "challenge",
  "analysis",
  "progress",
  "leaderboard",
  "calendar",
  "achievements",
] as const;

export type FeatureAccess = {
  ready: boolean;
  allowed: boolean;
  subscriptionsEnabled: boolean;
  feature: PremiumFeature | undefined;
  /** Plan name to show in the English "please subscribe" message. */
  requiredPlan: string;
};

/** Can the signed-in student actually USE this premium feature right now? */
export function useFeatureAccess(key: keyof typeof PREMIUM_FEATURES | string): FeatureAccess {
  const { subscriptionsEnabled, isPremium, isMax, ready } = usePremium();
  const feature = PREMIUM_FEATURES[key];
  const tier = feature?.tier ?? "pro";
  const allowed = !subscriptionsEnabled || (tier === "max" ? isMax : isPremium);

  return {
    ready,
    allowed,
    subscriptionsEnabled,
    feature,
    requiredPlan: tier === "max" ? "Max Pro" : "any premium",
  };
}
