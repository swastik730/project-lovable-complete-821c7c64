import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BarChart3, ImagePlus, Loader2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import logoUrl from "@/assets/logo.webp";
import { fileToLogoDataUrl, saveAppLogo, useAppLogo } from "@/lib/branding";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/owner/")({
  component: OwnerDashboard,
});

function BrandingCard() {
  const logo = useAppLogo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToLogoDataUrl(file);
      await saveAppLogo(dataUrl);
      await logAudit("branding.logo_update", {});
      toast.success("Logo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the logo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onReset = async () => {
    setBusy(true);
    try {
      await saveAppLogo(null);
      await logAudit("branding.logo_reset", {});
      toast.success("Default logo restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface mb-4 flex items-center gap-4 p-4">
      <img
        src={logo ?? logoUrl}
        alt="App logo preview"
        width={56}
        height={56}
        className="h-14 w-14 rounded-2xl object-cover shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">App logo</p>
        <p className="text-xs text-muted-foreground">Square PNG/JPG. Visible to every student.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Upload
        </button>
        {logo ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onReset()}
            aria-label="Reset logo"
            className="inline-flex items-center rounded-xl border border-border px-3 py-2 text-xs font-bold disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}


type Student = {
  id: string;
  name: string;
  xp: number;
  streak: number;
  last_study_date: string | null;
  created_at: string;
};

type Attempt = { id: string; label: string; correct: number; total: number; created_at: string };

function OwnerDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase
        .from("profiles")
        .select("id,name,xp,streak,last_study_date,created_at")
        .order("xp", { ascending: false })
        .limit(200),
      supabase.from("attempts").select("id,label,correct,total,created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "published"),
    ]).then(([p, a, q]) => {
      if (!active) return;
      setStudents((p.data ?? []) as Student[]);
      setAttempts((a.data ?? []) as Attempt[]);
      setQuestionCount(q.count ?? 0);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading data…
      </p>
    );
  }

  const totalXp = students.reduce((n, s) => n + (s.xp || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = students.filter((s) => s.last_study_date === today).length;

  return (
    <>
      <BrandingCard />
      <div className="mb-4 grid grid-cols-4 gap-2">

        <Stat label="Students" value={`${students.length}`} />
        <Stat label="Active" value={`${activeToday}`} />
        <Stat label="Total XP" value={`${totalXp}`} />
        <Stat label="Questions" value={`${questionCount}`} />
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <Users className="h-4 w-4 text-primary" /> Students
      </h2>
      <div className="surface mb-4 divide-y divide-border">
        {students.length === 0 ? (
          <p className="p-5 text-center text-xs text-muted-foreground">No students yet.</p>
        ) : (
          students.slice(0, 50).map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.streak} day streak · joined{" "}
                  {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-accent-foreground">
                {s.xp} XP
              </span>
            </div>
          ))
        )}
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <BarChart3 className="h-4 w-4 text-primary" /> Latest attempts
      </h2>
      <div className="surface divide-y divide-border">
        {attempts.length === 0 ? (
          <p className="p-5 text-center text-xs text-muted-foreground">No attempts yet.</p>
        ) : (
          attempts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-xs font-bold">
                {a.correct}/{a.total}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface px-2 py-4 text-center">
      <p className="text-base font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
