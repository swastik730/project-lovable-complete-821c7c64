/**
 * AdMob configuration + runtime helpers.
 *
 * Everything is owner-controlled from /owner/ads and stored as a single JSON
 * row in `app_settings` (key = `ads_config`), so ads can be switched on/off or
 * re-targeted at new ad units without shipping a new app build.
 *
 * The web build has no AdMob SDK. When the app runs inside a native wrapper
 * (Play Store build) a bridge object is exposed on `window` and used instead —
 * see `nativeAdmob()`. Until then, nothing is requested from AdMob; the owner
 * can turn on "preview placeholder" to verify the timing/placement.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const ADS_SETTINGS_KEY = "ads_config";

export type AdSettings = {
  /** Master switch — off means no ads anywhere. */
  enabled: boolean;
  /** Show one interstitial per app open. */
  interstitialEnabled: boolean;
  /** Seconds after app open before that interstitial is requested. */
  interstitialDelaySeconds: number;
  /** Only one interstitial for the whole session (reset when the app is closed). */
  oncePerSession: boolean;
  /** Small anchored banner above the bottom navigation. */
  bannerEnabled: boolean;
  /** Extra optional placements the owner can turn on later. */
  rewardedEnabled: boolean;
  /** Google test ad units instead of the real ones. */
  testMode: boolean;
  /** Render a fake ad in the browser so placement/timing can be checked. */
  previewPlaceholder: boolean;
  /** Ad unit / app IDs from the AdMob console. */
  appIdAndroid: string;
  bannerUnitId: string;
  interstitialUnitId: string;
  appOpenUnitId: string;
  rewardedUnitId: string;
  /** Play Store / policy links used by the app. */
  privacyPolicyUrl: string;
};

export const DEFAULT_AD_SETTINGS: AdSettings = {
  enabled: false,
  interstitialEnabled: true,
  interstitialDelaySeconds: 60,
  oncePerSession: true,
  bannerEnabled: false,
  rewardedEnabled: false,
  testMode: true,
  previewPlaceholder: false,
  appIdAndroid: "",
  bannerUnitId: "",
  interstitialUnitId: "",
  appOpenUnitId: "",
  rewardedUnitId: "",
  privacyPolicyUrl: "",
};

/** Google's official test units — used whenever test mode is on. */
export const TEST_UNITS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  appOpen: "ca-app-pub-3940256099942544/3419835294",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
} as const;

function parse(value: string | null | undefined): AdSettings {
  if (!value) return DEFAULT_AD_SETTINGS;
  try {
    const raw = JSON.parse(value) as Partial<AdSettings>;
    return { ...DEFAULT_AD_SETTINGS, ...raw };
  } catch {
    return DEFAULT_AD_SETTINGS;
  }
}

let cached: AdSettings | undefined;
const listeners = new Set<(s: AdSettings) => void>();

async function fetchSettings() {
  const { data } = await supabase.from("app_settings").select("value").eq("key", ADS_SETTINGS_KEY).maybeSingle();
  cached = parse((data?.value as string | undefined) ?? null);
  listeners.forEach((l) => l(cached as AdSettings));
}

/** Live ad settings (shared cache, refreshes for every subscriber on save). */
export function useAdSettings() {
  const [settings, setSettings] = useState<AdSettings>(cached ?? DEFAULT_AD_SETTINGS);
  const [ready, setReady] = useState(cached !== undefined);

  useEffect(() => {
    const listener = (s: AdSettings) => {
      setSettings(s);
      setReady(true);
    };
    listeners.add(listener);
    if (cached === undefined) void fetchSettings();
    else listener(cached);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { settings, ready };
}

export async function saveAdSettings(next: AdSettings) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id ?? null;
  const { error } = await supabase.from("app_settings").upsert({
    key: ADS_SETTINGS_KEY,
    value: JSON.stringify(next),
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  cached = next;
  listeners.forEach((l) => l(next));
}

export function unitIdFor(settings: AdSettings, placement: keyof typeof TEST_UNITS) {
  if (settings.testMode) return TEST_UNITS[placement];
  if (placement === "banner") return settings.bannerUnitId;
  if (placement === "interstitial") return settings.interstitialUnitId;
  if (placement === "appOpen") return settings.appOpenUnitId;
  return settings.rewardedUnitId;
}

/* ------------------------------------------------------------------ *
 * Native bridge
 * ------------------------------------------------------------------ */

type NativeAdmob = {
  showInterstitial?: (unitId: string) => unknown;
  showBanner?: (unitId: string) => unknown;
  hideBanner?: () => unknown;
  showRewarded?: (unitId: string) => unknown;
};

/**
 * Returns the AdMob bridge injected by the native (Play Store) wrapper, or
 * null in a plain browser. Kept intentionally loose so any wrapper that
 * exposes `window.BoardBuddyAds` / `window.admob` works without a code change.
 */
export function nativeAdmob(): NativeAdmob | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, NativeAdmob | undefined>;
  return w["BoardBuddyAds"] ?? w["admob"] ?? null;
}

export function hasNativeAds() {
  const bridge = nativeAdmob();
  return !!bridge && typeof bridge.showInterstitial === "function";
}
