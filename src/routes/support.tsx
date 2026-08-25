import { createFileRoute } from "@tanstack/react-router";
import { Headset, Mail, MessageCircle, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumLockCard } from "@/components/PremiumLock";
import { useFeatureAccess } from "@/lib/entitlements";
import { useSupportSettings } from "@/lib/support";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Priority Support — Max Pro | BoardBuddy" },
      {
        name: "description",
        content: "Max Pro students get direct phone and email support from the BoardBuddy team for any study or account issue.",
      },
      { property: "og:title", content: "Priority Support — Max Pro | BoardBuddy" },
      { property: "og:description", content: "Direct help for BoardBuddy Max Pro students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { ready, allowed } = useFeatureAccess("support");
  const { settings, ready: settingsReady } = useSupportSettings();

  return (
    <AppShell title="Support">
      <div className="surface mt-1 flex items-center gap-3 p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Headset className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold">Priority support</p>
          <p className="text-xs text-muted-foreground">Included with the Max Pro plan.</p>
        </div>
      </div>

      {!ready || !settingsReady ? (
        <div className="surface mt-3 h-32 animate-pulse" aria-hidden />
      ) : !allowed ? (
        <PremiumLockCard featureKey="support" className="mt-3" />
      ) : (
        <div className="mt-3 space-y-3">
          {settings.phone ? (
            <a href={`tel:${settings.phone}`} className="surface flex items-center gap-3 p-4">
              <Phone className="h-5 w-5 shrink-0 text-success" />
              <span className="min-w-0">
                <span className="block text-sm font-bold">Customer care</span>
                <span className="block truncate text-xs text-muted-foreground">{settings.phone}</span>
              </span>
            </a>
          ) : null}

          {settings.whatsapp ? (
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="surface flex items-center gap-3 p-4"
            >
              <MessageCircle className="h-5 w-5 shrink-0 text-success" />
              <span className="min-w-0">
                <span className="block text-sm font-bold">WhatsApp</span>
                <span className="block truncate text-xs text-muted-foreground">{settings.whatsapp}</span>
              </span>
            </a>
          ) : null}

          {settings.email ? (
            <a href={`mailto:${settings.email}`} className="surface flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-bold">Email</span>
                <span className="block truncate text-xs text-muted-foreground">{settings.email}</span>
              </span>
            </a>
          ) : null}

          {!settings.phone && !settings.email && !settings.whatsapp ? (
            <div className="surface p-4 text-xs font-semibold text-muted-foreground">
              Support contact details are being updated. Please check again shortly.
            </div>
          ) : null}

          <div className="surface p-4 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">Support hours</p>
            <p className="mt-1">{settings.hours}</p>
            {settings.note ? <p className="mt-2">{settings.note}</p> : null}
          </div>
        </div>
      )}
    </AppShell>
  );
}
