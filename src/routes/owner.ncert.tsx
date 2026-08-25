import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { SUBJECTS } from "@/lib/curriculum";
import { fetchNcertRows, hashSolution, toAnswerLines, type NcertRow } from "@/lib/ncertRemote";

export const Route = createFileRoute("/owner/ncert")({
  component: OwnerNcert,
});

function OwnerNcert() {
  const [rows, setRows] = useState<NcertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjectId, setSubjectId] = useState(SUBJECTS[0]!.id);
  const [chapterId, setChapterId] = useState(SUBJECTS[0]!.chapters[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const chapters = useMemo(
    () => SUBJECTS.find((s) => s.id === subjectId)?.chapters ?? [],
    [subjectId],
  );

  const load = async () => {
    setRows(await fetchNcertRows(true));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setChapterId(chapters[0]?.id ?? "");
  }, [chapters]);

  const add = async () => {
    const lines = toAnswerLines(answer);
    if (!question.trim() || lines.length === 0 || !chapterId) {
      toast.error("Question aur answer dono bharein");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("ncert_solutions").insert({
      subject_id: subjectId,
      chapter_id: chapterId,
      question: question.trim(),
      answer: lines,
      status: "published",
      content_hash: hashSolution(subjectId, chapterId, question),
    });
    setSaving(false);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return;
    }
    await logAudit("ncert.create", { subject_id: subjectId, chapter_id: chapterId });
    toast.success("NCERT solution add ho gaya");
    setQuestion("");
    setAnswer("");
    await load();
  };

  const setStatus = async (id: string, status: "published" | "draft") => {
    const { error } = await supabase.from("ncert_solutions").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      await logAudit(`ncert.${status}`, { solution_id: id });
      await load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("ncert_solutions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      await logAudit("ncert.delete", { solution_id: id });
      await load();
    }
  };

  return (
    <>
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <BookOpenCheck className="h-4 w-4 text-primary" /> NCERT Solutions
      </h2>

      <div className="surface mb-4 space-y-3 p-5">
        <p className="text-xs text-muted-foreground">
          Add NCERT solutions yourself here. Each line of the answer becomes a bullet point.
          Published solutions turant students ke NCERT page par dikhenge.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold"
          >
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold"
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="NCERT question"
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          placeholder={"Answer ki ek line per point\nDusra point\nTeesra point"}
          className="w-full rounded-xl border border-input bg-background p-3 text-[12px]"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void add()}
          className="brand-gradient inline-flex h-11 w-full items-center justify-center gap-1 rounded-xl text-xs font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add solution
        </button>
      </div>

      {loading ? (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : rows.length === 0 ? (
        <div className="surface p-6 text-center text-sm text-muted-foreground">
          No cloud solutions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <article key={r.id} className="surface p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-primary">
                {SUBJECTS.find((s) => s.id === r.subject_id)?.name ?? r.subject_id} · {r.chapter_id} · {r.status}
              </p>
              <p className="mt-1 text-sm font-bold leading-snug">{r.question}</p>
              <ul className="mt-2 space-y-1">
                {toAnswerLines(r.answer).map((line, i) => (
                  <li key={i} className="text-[12px] text-muted-foreground">
                    • {line}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void setStatus(r.id, r.status === "published" ? "draft" : "published")}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl border border-input text-xs font-bold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {r.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(r.id)}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-destructive px-3 text-xs font-bold text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
