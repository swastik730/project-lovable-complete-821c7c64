/** AI tutor helper — server only. Uses the owner's AI key when set, else the built-in AI. */
import { resolveAiConfig } from "./ai.server";

export type TutorMessage = { role: "user" | "assistant"; content: string };

export type StudentContext = {
  name?: string;
  xp?: number;
  streak?: number;
  dailyGoal?: number;
  todayCount?: number;
  tests?: number;
  accuracy?: number;
  weakChapters?: string[];
  plan?: string;
};

const SYSTEM_PROMPT =
  "You are Buddy, BoardBuddy's warm and friendly AI study partner for CBSE Class 10 students in India. " +
  "Talk like a caring elder friend (bhaiya/didi), not a textbook. Address the student by their first name naturally " +
  "in conversation — especially when encouraging them — but not in every single message. " +
  "Explain concepts step by step in simple language, mix English with easy Hindi words (Hinglish) when it helps, " +
  "and use small relatable examples from daily Indian life. Be encouraging: celebrate their streak and progress, " +
  "and motivate them kindly when a topic is tough. Keep answers focused (under 250 words), use short paragraphs " +
  "or bullet points for steps, and end with one quick tip or a small practice question. " +
  "Use the NCERT syllabus as your reference.";

export function buildStudentBrief(ctx: StudentContext) {
  const lines: string[] = [];
  if (ctx.name) lines.push(`Student name: ${ctx.name}`);
  if (typeof ctx.xp === "number") lines.push(`XP: ${ctx.xp}`);
  if (typeof ctx.streak === "number") lines.push(`Daily streak: ${ctx.streak} days`);
  if (typeof ctx.dailyGoal === "number")
    lines.push(`Today's goal: ${ctx.todayCount ?? 0}/${ctx.dailyGoal} questions`);
  if (typeof ctx.tests === "number") lines.push(`Tests attempted: ${ctx.tests}`);
  if (typeof ctx.accuracy === "number") lines.push(`Overall accuracy: ${ctx.accuracy}%`);
  if (ctx.weakChapters?.length) lines.push(`Weak chapters: ${ctx.weakChapters.join(", ")}`);
  if (ctx.plan) lines.push(`Plan: ${ctx.plan}`);
  if (!lines.length) return "";
  return (
    "Here is the student's live progress. Use it to personalise your answer, greet them by first name once, " +
    "and gently point at their weak chapters when relevant:\n" +
    lines.join("\n")
  );
}

export async function askTutorAI(messages: TutorMessage[], student?: StudentContext) {
  const cfg = await resolveAiConfig();

  const system: { role: "system"; content: string }[] = [{ role: "system", content: SYSTEM_PROMPT }];
  const brief = student ? buildStudentBrief(student) : "";
  if (brief) system.push({ role: "system", content: brief });

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      messages: [...system, ...messages.slice(-12)],
    }),
  });

  if (res.status === 429) throw new Error("Too many questions right now. Please try again in a minute.");
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      cfg.ownerKey
        ? "The AI key saved in the owner panel was rejected. Update it in Owner → AI."
        : "The tutor is unavailable right now. Please try again.",
    );
  }
  if (!res.ok) throw new Error("The tutor is unavailable right now. Please try again.");

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "Sorry, I could not answer that. Try rephrasing your doubt.";
}
