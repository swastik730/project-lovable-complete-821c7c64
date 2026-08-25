import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/owner/models")({
  component: OwnerModelsPage,
});

type Row = {
  id: string;
  title: string;
  subject: string;
  chapter: string | null;
  description: string | null;
  kind: string;
  src_url: string;
  is_premium: boolean;
  published: boolean;
  sort: number;
};

const EMPTY = {
  title: "",
  subject: "science",
  chapter: "",
  description: "",
  kind: "embed",
  src_url: "",
  is_premium: true,
  published: true,
  sort: 0,
};

function OwnerModelsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("study_models").select("*").order("sort", { ascending: true });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    if (!form.title.trim() || !form.src_url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("study_models").insert({
      title: form.title.trim(),
      subject: form.subject.trim() || "science",
      chapter: form.chapter.trim() || null,
      description: form.description.trim() || null,
      kind: form.kind,
      src_url: form.src_url.trim(),
      is_premium: form.is_premium,
      published: form.published,
      sort: Number(form.sort) || 0,
    });
    setSaving(false);
    if (error) toast.error("Could not add", { description: error.message });
    else {
      toast.success("Added to library");
      setForm({ ...EMPTY });
      void load();
    }
  }

  async function patch(id: string, next: { published?: boolean; is_premium?: boolean }) {
    const { error } = await supabase.from("study_models").update(next).eq("id", id);
    if (error) toast.error("Update failed", { description: error.message });
    else void load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("study_models").delete().eq("id", id);
    if (error) toast.error("Delete failed", { description: error.message });
    else void load();
  }

  return (
    <div className="space-y-4">
      <section className="surface space-y-2 p-4">
        <p className="text-sm font-bold">Add 3D model or video</p>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Subject"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          />
          <input
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            placeholder="Chapter"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <input
          value={form.src_url}
          onChange={(e) => setForm({ ...form, src_url: e.target.value })}
          placeholder="Embed / video / .glb URL"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Short description"
          className="w-full rounded-lg border border-input bg-background p-3 text-xs"
        />
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className="h-9 rounded-lg border border-input bg-background px-2"
          >
            <option value="embed">3D embed</option>
            <option value="glb">GLB file</option>
            <option value="video">Video</option>
          </select>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={form.is_premium}
              onChange={(e) => setForm({ ...form, is_premium: e.target.checked })}
            />
            Premium
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published
          </label>
          <button
            type="button"
            onClick={() => void add()}
            disabled={saving}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
          </button>
        </div>
      </section>

      {loading && <p className="text-xs text-muted-foreground">Loading library…</p>}

      {rows.map((r) => (
        <article key={r.id} className="surface flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{r.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {r.kind} · {r.subject}
              {r.chapter ? ` · ${r.chapter}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={r.published}
                  onChange={(e) => void patch(r.id, { published: e.target.checked })}
                />
                Published
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={r.is_premium}
                  onChange={(e) => void patch(r.id, { is_premium: e.target.checked })}
                />
                Premium
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void remove(r.id)}
            aria-label={`Delete ${r.title}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive-soft text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </article>
      ))}
    </div>
  );
}
