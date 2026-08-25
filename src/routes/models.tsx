import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Box, Lock, PlayCircle, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import heroMore from "@/assets/hero-more.webp";
import { supabase } from "@/lib/supabase";
import { usePremium } from "@/lib/subscription";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "3D Models & Concept Videos — Class 10 Science | BoardBuddy" },
      {
        name: "description",
        content:
          "Explore interactive 3D models and concept videos for Class 10 Science — heart, DNA, molecules, motion and more.",
      },
      { property: "og:title", content: "3D Models & Concept Videos | BoardBuddy" },
      { property: "og:description", content: "Interactive 3D science models and concept videos for Class 10." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ModelsPage,
});

type StudyModel = {
  id: string;
  title: string;
  subject: string;
  chapter: string | null;
  description: string | null;
  kind: string;
  src_url: string;
  poster_url: string | null;
  is_premium: boolean;
  published: boolean;
};

function ModelsPage() {
  const { isPremium, subscriptionsEnabled } = usePremium();
  const [items, setItems] = useState<StudyModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<StudyModel | null>(null);

  useEffect(() => {
    let active = true;
    void supabase
      .from("study_models")
      .select("*")
      .eq("published", true)
      .order("sort", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setItems((data ?? []) as StudyModel[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) =>
      [m.title, m.subject, m.chapter ?? "", m.description ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [items, query]);

  const locked = (m: StudyModel) => subscriptionsEnabled && m.is_premium && !isPremium;

  return (
    <AppShell title="3D & Videos">
      <PageHero
        eyebrow="Visual learning"
        eyebrowIcon={<Box className="h-3.5 w-3.5" />}
        title="See science in"
        titleAccent="3D and motion"
        description="Rotate organs and molecules, and watch concept videos that make tough chapters click."
        image={heroMore}
        imageAlt="3D science library"
        tint="green"
      />

      <label className="surface mt-4 flex items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models and videos"
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      {loading && <p className="mt-4 text-xs text-muted-foreground">Loading library…</p>}
      {!loading && filtered.length === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">Nothing matched your search.</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {filtered.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpen(m)}
            className="surface overflow-hidden p-3 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {m.kind === "video" ? "Video" : "3D"}
              </span>
              {locked(m) ? (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              ) : m.kind === "video" ? (
                <PlayCircle className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Box className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <h2 className="mt-2 text-sm font-bold leading-tight">{m.title}</h2>
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{m.description}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{m.subject}</p>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-foreground/60 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-card p-4 sm:mx-auto sm:max-w-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-extrabold">{open.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{open.description}</p>

            {locked(open) ? (
              <div className="mt-4 rounded-xl border border-border p-5 text-center">
                <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-bold">This is a premium item</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Subscribe to open the full 3D and video library.
                </p>
                <Link
                  to="/subscribe"
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                >
                  <Sparkles className="h-4 w-4" /> See plans
                </Link>
              </div>
            ) : open.kind === "glb" ? (
              <div className="mt-4 rounded-xl border border-border p-4 text-center text-xs text-muted-foreground">
                <a href={open.src_url} target="_blank" rel="noreferrer" className="font-bold text-primary underline">
                  Open 3D file
                </a>
              </div>
            ) : (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border">
                <iframe
                  src={open.src_url}
                  title={open.title}
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-4 h-10 w-full rounded-xl bg-muted text-sm font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
