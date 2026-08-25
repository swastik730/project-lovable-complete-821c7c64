import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, Upload, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { CSV_TEMPLATE, parseCsv, validateRows, type ParsedQuestion, type RowIssue } from "@/lib/csv";
import { SUBJECTS } from "@/lib/curriculum";

export const Route = createFileRoute("/owner/content")({
  component: OwnerContent,
});

type BankRow = {
  id: string;
  subject_id: string;
  chapter_id: string;
  difficulty: string;
  question: string;
  status: string;
  created_at: string;
};

type Summary = {
  fileName: string;
  inserted: number;
  duplicates: number;
  invalid: RowIssue[];
  fileDuplicates: RowIssue[];
};

function OwnerContent() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [pasteText, setPasteText] = useState("");
  const [publishingAll, setPublishingAll] = useState(false);

  const load = async () => {
    const q = supabase
      .from("questions")
      .select("id,subject_id,chapter_id,difficulty,question,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data } = filter === "all" ? await q : await q.eq("status", filter);
    setRows((data ?? []) as BankRow[]);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "boardbuddy-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsvText = async (text: string, sourceName: string) => {
    setImporting(true);
    setError(null);
    setSummary(null);
    try {
      const parsed = parseCsv(text);
      const result = validateRows(parsed, SUBJECTS.map((s) => s.id));

      let inserted = 0;
      let duplicates = 0;

      if (result.valid.length > 0) {
        const hashes = result.valid.map((v) => v.content_hash);
        const { data: existing } = await supabase.from("questions").select("content_hash").in("content_hash", hashes);
        const existingSet = new Set(((existing ?? []) as { content_hash: string }[]).map((e) => e.content_hash));
        const fresh = result.valid.filter((v: ParsedQuestion) => !existingSet.has(v.content_hash));
        duplicates = result.valid.length - fresh.length;

        await supabase.from("import_batches").insert({
          filename: sourceName,
          total_rows: parsed.length - 1,
          imported: fresh.length,
          duplicates,
          invalid: result.invalid.length + result.duplicateInFile.length,
        });

        for (let i = 0; i < fresh.length; i += 100) {
          const chunk = fresh.slice(i, i + 100).map((v) => ({
            subject_id: v.subject_id,
            chapter_id: v.chapter_id,
            difficulty: v.difficulty,
            question: v.question,
            options: v.options,
            correct_index: v.correct_index,
            explanation: v.explanation || null,
            source: v.source || null,
            content_hash: v.content_hash,
            status: "review",
          }));
          const { error: insertError } = await supabase.from("questions").insert(chunk);
          if (insertError) throw new Error(insertError.message);
          inserted += chunk.length;
        }

        await logAudit("content.import", { file: sourceName, inserted, duplicates });
      }

      setSummary({
        fileName: sourceName,
        inserted,
        duplicates,
        invalid: result.invalid,
        fileDuplicates: result.duplicateInFile,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onFile = async (file: File) => {
    await importCsvText(await file.text(), file.name);
  };

  const publishAllReview = async () => {
    setPublishingAll(true);
    const { error: err } = await supabase.from("questions").update({ status: "published" }).eq("status", "review");
    setPublishingAll(false);
    if (err) setError(err.message);
    else {
      await logAudit("content.publish_all", {});
      await load();
    }
  };

  const setStatus = async (id: string, status: "published" | "draft") => {
    const { error: err } = await supabase.from("questions").update({ status }).eq("id", id);
    if (err) setError(err.message);
    else {
      await logAudit(`content.${status}`, { question_id: id });
      await load();
    }
  };

  const removeQuestion = async (id: string) => {
    const { error: err } = await supabase.from("questions").delete().eq("id", id);
    if (err) setError(err.message);
    else {
      await logAudit("content.delete", { question_id: id });
      await load();
    }
  };

  return (
    <>
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <Upload className="h-4 w-4 text-primary" /> CSV / Excel import
      </h2>

      <div className="surface mb-4 space-y-3 p-5">
        <p className="text-xs text-muted-foreground">
          Build a sheet in Excel and save it as <b>CSV</b>. Columns: subject_id, chapter_id, difficulty, question,
          option_a-d, correct (A-D), explanation, source. Duplicate questions are skipped automatically and new
          questions arrive with <b>review</b> status.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-input text-xs font-bold"
          >
            <Download className="h-4 w-4" /> Template
          </button>
          <button
            type="button"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
            className="brand-gradient inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload CSV
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-bold">Or paste directly (CSV text)</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            placeholder={"subject_id,chapter_id,difficulty,question,option_a,option_b,option_c,option_d,correct,explanation,source"}
            className="w-full rounded-xl border border-input bg-background p-3 text-[11px] font-mono"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={importing || pasteText.trim().length === 0}
              onClick={() => {
                const text = pasteText;
                setPasteText("");
                void importCsvText(text, "pasted-rows.csv");
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-input text-xs font-bold disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import pasted rows
            </button>
            <button
              type="button"
              disabled={publishingAll}
              onClick={() => void publishAllReview()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-success text-xs font-bold text-success disabled:opacity-50"
            >
              {publishingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Sab review publish
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mb-3 rounded-xl bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive">{error}</p>}

      {summary && (
        <div className="surface mb-4 p-5 text-xs">
          <p className="text-sm font-bold">{summary.fileName}</p>
          <p className="mt-1 text-success">{summary.inserted} questions add hue (review me)</p>
          <p className="text-muted-foreground">{summary.duplicates} duplicate skip hue</p>
          {[...summary.invalid, ...summary.fileDuplicates].slice(0, 12).map((i) => (
            <p key={`${i.line}-${i.reason}`} className="mt-1 text-destructive">
              Line {i.line}: {i.reason}
            </p>
          ))}
        </div>
      )}

      <div className="mb-3 grid grid-cols-4 gap-2">
        {["all", "review", "published", "draft"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={
              "h-9 rounded-xl border text-xs font-bold capitalize " +
              (filter === s ? "border-primary bg-primary-soft text-primary" : "border-input text-muted-foreground")
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="surface divide-y divide-border">
        {loading ? (
          <p className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading question bank…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-center text-xs text-muted-foreground">No questions in this filter.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="px-4 py-3">
              <p className="text-sm font-semibold">{r.question}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {r.subject_id} · {r.chapter_id} · {r.difficulty} · {r.status}
              </p>
              <div className="mt-2 flex gap-2">
                {r.status !== "published" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(r.id, "published")}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl border border-success text-xs font-bold text-success"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus(r.id, "draft")}
                    className="h-9 flex-1 rounded-xl border border-input text-xs font-bold text-muted-foreground"
                  >
                    Unpublish
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void removeQuestion(r.id)}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-destructive px-3 text-xs font-bold text-destructive"
                >
                  <XCircle className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
