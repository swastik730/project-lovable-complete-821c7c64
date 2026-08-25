/**
 * Short ad gate for free students.
 *
 * A few free features (mock tests, practice, bookmarks) are shown after a
 * short ad. Paid students never see it, and it is shown only once per feature
 * per app session so studying never feels blocked.
 */
import { useEffect, useState, type ReactNode } from "react";
import { PlayCircle } from "lucide-react";
import { hasNativeAds, nativeAdmob, unitIdFor, useAdSettings } from "@/lib/ads";
import { usePremium } from "@/lib/subscription";

function seenKey(key: string) {
  return `bb_adgate_${key}`;
}

function alreadySeen(key: string) {
  try {
    return sessionStorage.getItem(seenKey(key)) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    sessionStorage.setItem(seenKey(key), "1");
  } catch {
    /* storage blocked */
  }
}

export function AdGate({
  featureKey,
  seconds = 5,
  title,
  children,
}: {
  featureKey: string;
  seconds?: number;
  title: string;
  children: ReactNode;
}) {
  const { isPremium, ready: premiumReady } = usePremium();
  const { settings, ready: adsReady } = useAdSettings();
  const [passed, setPassed] = useState(false);
  const [left, setLeft] = useState(seconds);

  const ready = premiumReady && adsReady;

  useEffect(() => {
    if (!ready || passed) return;
    if (isPremium || alreadySeen(featureKey)) {
      setPassed(true);
      return;
    }
    const bridge = nativeAdmob();
    if (hasNativeAds() && bridge?.showInterstitial) {
      try {
        bridge.showInterstitial(unitIdFor(settings, "interstitial"));
        markSeen(featureKey);
        setPassed(true);
        return;
      } catch {
        /* fall back to the in-app countdown */
      }
    }
    setLeft(seconds);
  }, [ready, isPremium, featureKey, passed, seconds, settings]);

  useEffect(() => {
    if (!ready || passed || isPremium) return;
    const t = window.setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [ready, passed, isPremium]);

  if (!ready) {
    return <div className="surface h-40 animate-pulse" aria-hidden />;
  }
  if (passed) return <>{children}</>;

  return (
    <div className="surface flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <PlayCircle className="h-6 w-6" />
      </span>
      <p className="text-sm font-extrabold">Short ad before {title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Ads keep this part of BoardBuddy free. Premium plans remove them completely.
      </p>
      <button
        type="button"
        disabled={left > 0}
        onClick={() => {
          markSeen(featureKey);
          setPassed(true);
        }}
        className="mt-1 inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {left > 0 ? `Continue in ${left}s` : "Continue"}
      </button>
    </div>
  );
}
