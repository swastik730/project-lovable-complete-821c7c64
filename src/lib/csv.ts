/** Minimal RFC4180-ish CSV parser (handles quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export const CSV_HEADERS = [
  "subject_id",
  "chapter_id",
  "difficulty",
  "question",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct",
  "explanation",
  "source",
];

export const CSV_TEMPLATE = `${CSV_HEADERS.join(",")}
science,electricity,easy,"Ohm's law relates which quantities?","V and I","P and T","M and A","F and D",A,"V = IR — voltage is proportional to current.",NCERT
maths,polynomials,medium,"Number of zeroes of a quadratic polynomial is at most?",1,2,3,4,B,"A degree-2 polynomial has at most 2 zeroes.",NCERT`;

export type ParsedQuestion = {
  subject_id: string;
  chapter_id: string;
  difficulty: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source: string;
  content_hash: string;
};

export type RowIssue = { line: number; reason: string };

export type ValidationResult = {
  valid: ParsedQuestion[];
  invalid: RowIssue[];
  duplicateInFile: RowIssue[];
};

function normalise(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Stable, dependency-free hash used to detect duplicate questions. */
export function hashQuestion(subjectId: string, question: string): string {
  const base = `${normalise(subjectId)}|${normalise(question)}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < base.length; i++) {
    const c = base.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + i, 2246822519) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

const LETTERS = ["a", "b", "c", "d"];

export function validateRows(rows: string[][], knownSubjects: string[]): ValidationResult {
  const valid: ParsedQuestion[] = [];
  const invalid: RowIssue[] = [];
  const duplicateInFile: RowIssue[] = [];
  const seen = new Set<string>();

  const header = (rows[0] ?? []).map((h) => normalise(h).replace(/\s/g, "_"));
  const idx = (name: string) => header.indexOf(name);
  const missing = CSV_HEADERS.filter((h) => idx(h) === -1 && h !== "explanation" && h !== "source");
  if (missing.length > 0) {
    invalid.push({ line: 1, reason: `Missing columns in header: ${missing.join(", ")}` });
    return { valid, invalid, duplicateInFile };
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const get = (name: string) => (idx(name) === -1 ? "" : (row[idx(name)] ?? "").trim());
    const line = r + 1;

    const subject_id = get("subject_id").toLowerCase();
    const chapter_id = get("chapter_id").toLowerCase();
    const question = get("question");
    const options = [get("option_a"), get("option_b"), get("option_c"), get("option_d")];
    const correctRaw = get("correct").toLowerCase();
    const difficulty = (get("difficulty") || "medium").toLowerCase();

    if (!subject_id || !chapter_id || !question) {
      invalid.push({ line, reason: "subject_id / chapter_id / question is empty" });
      continue;
    }
    if (knownSubjects.length > 0 && !knownSubjects.includes(subject_id)) {
      invalid.push({ line, reason: `Unknown subject_id "${subject_id}"` });
      continue;
    }
    if (options.some((o) => !o)) {
      invalid.push({ line, reason: "All four options are required" });
      continue;
    }
    let correct_index = LETTERS.indexOf(correctRaw);
    if (correct_index === -1 && /^[1-4]$/.test(correctRaw)) correct_index = Number(correctRaw) - 1;
    if (correct_index === -1) {
      invalid.push({ line, reason: `correct "${correctRaw}" is invalid (use A-D or 1-4)` });
      continue;
    }
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      invalid.push({ line, reason: `difficulty "${difficulty}" is invalid (use easy/medium/hard)` });
      continue;
    }

    const content_hash = hashQuestion(subject_id, question);
    if (seen.has(content_hash)) {
      duplicateInFile.push({ line, reason: "Duplicate question within this file" });
      continue;
    }
    seen.add(content_hash);

    valid.push({
      subject_id,
      chapter_id,
      difficulty,
      question,
      options,
      correct_index,
      explanation: get("explanation"),
      source: get("source"),
      content_hash,
    });
  }

  return { valid, invalid, duplicateInFile };
}
