/**
 * Ad runtime for students.
 *
 * Rule (owner configurable): after the app is opened, wait N seconds (default
 * 60) and then show exactly ONE interstitial for that session. Close the app
 * and open it again → the countdown starts over. Ads are never shown while a
 * test/quiz is being attempted.
 */
import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { hasNativeAds, nativeAdmob, unitIdFor, useAdSettings } from "@/lib/ads";
import { usePremium } from "@/lib/subscription";
import { cn } from "@/lib/utils";

/** Set once per browser session — a fresh app open gets a fresh countdown. */
const OPENED_AT = typeof performance !== "undefined" ? performance.now() : 0;
const SHOWN_FLAG = "bb_interstitial_shown";

function alreadyShown() {
  try {
    return sessionStorage.getItem(SHOWN_FLAG) === "1";
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SHOWN_FLAG, "1");
  } catch {
    /* storage blocked */
  }
}

function isExamRoute(pathname: string) {
  return pathname.startsWith("/tests/run") || pathname.startsWith("/quiz");
}

export function AdInterstitial() {
  const { settings, ready } = useAdSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [overlay, setOverlay] = useState(false);
  const [skipIn, setSkipIn] = useState(5);
  const firedRef = useRef(false);

  const { isPremium, ready: premiumReady } = usePremium();

  // Paid students never see ads.
  const active = ready && premiumReady && !isPremium && settings.enabled && settings.interstitialEnabled;

  useEffect(() => {
    if (!active) return;
    if (firedRef.current) return;
    if (settings.oncePerSession && alreadyShown()) return;

    const delayMs = Math.max(5, settings.interstitialDelaySeconds) * 1000;

    const tick = window.setInterval(() => {
      if (firedRef.current) return;
      const elapsed = (typeof performance !== "undefined" ? performance.now() : 0) - OPENED_AT;
      if (elapsed < delayMs) return;
      // Never interrupt an ongoing attempt — wait until the student leaves it.
      if (isExamRoute(window.location.pathname)) return;

      firedRef.current = true;
      markShown();
      window.clearInterval(tick);

      const bridge = nativeAdmob();
      if (hasNativeAds() && bridge?.showInterstitial) {
        try {
          bridge.showInterstitial(unitIdFor(settings, "interstitial"));
          return;
        } catch {
          /* fall through to the in-app placeholder */
        }
      }
      if (settings.previewPlaceholder) setOverlay(true);
    }, 1000);

    return () => window.clearInterval(tick);
  }, [active, settings, pathname]);

  useEffect(() => {
    if (!overlay) return;
    setSkipIn(5);
    const t = window.setInterval(() => setSkipIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [overlay]);

  if (!overlay) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-foreground/95 p-4 text-background">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-background/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
          Ad preview
        </span>
        <button
          type="button"
          disabled={skipIn > 0}
          onClick={() => setOverlay(false)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-background/15 px-3 text-xs font-bold disabled:opacity-60"
        >
          {skipIn > 0 ? `${skipIn}s` : <X className="h-4 w-4" />}
          {skipIn > 0 ? null : "Close"}
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-lg font-extrabold">This is where the AdMob interstitial appears</p>
        <p className="mt-2 max-w-xs text-xs opacity-80">
          On the Play Store build this slot is filled by AdMob. Owner panel controls the delay, frequency and ad unit
          IDs.
        </p>
      </div>
    </div>
  );
}

/** Anchored banner slot shown above the bottom navigation. */
export function AdBanner({ className }: { className?: string }) {
  const { settings, ready } = useAdSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { isPremium, ready: premiumReady } = usePremium();
  const show =
    ready && premiumReady && !isPremium && settings.enabled && settings.bannerEnabled && !isExamRoute(pathname);

  useEffect(() => {
    const bridge = nativeAdmob();
    if (!bridge) return;
    if (show && bridge.showBanner) {
      try {
        bridge.showBanner(unitIdFor(settings, "banner"));
      } catch {
        /* ignore */
      }
    } else if (!show && bridge.hideBanner) {
      try {
        bridge.hideBanner();
      } catch {
        /* ignore */
      }
    }
  }, [show, settings]);

  if (!show) return null;
  if (hasNativeAds()) {
    // The native SDK draws its own banner outside the webview — just reserve space.
    return <div className={cn("h-[50px] w-full", className)} aria-hidden />;
  }
  if (!settings.previewPlaceholder) return null;

  return (
    <div
      className={cn(
        "flex h-[50px] w-full items-center justify-center border-t border-border bg-muted text-[11px] font-bold text-muted-foreground",
        className,
      )}
    >
      Banner ad slot (50px)
    </div>
  );
}
