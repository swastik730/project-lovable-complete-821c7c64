import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { askTutorAI } from "./tutor.server";

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
          .min(1)
          .max(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: settings } = await context.supabase
      .from("app_settings")
      .select("value")
      .eq("key", "subscriptions_enabled")
      .maybeSingle();
    const gated = (settings?.value as string | undefined) === "on";

    const { data: ent } = await context.supabase.rpc("my_entitlement");
    const entitlement = (ent as { tier: string; plan_id: string }[] | null)?.[0];

    if (gated && entitlement?.tier !== "max") {
      throw new Error("The AI tutor is part of the Max Pro plan.");
    }

    const [{ data: profile }, { data: attempts }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("name,xp,streak,daily_goal,today_count")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("attempts")
        .select("correct,total,chapter_id,subject_id")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const rows = attempts ?? [];
    const totals = rows.reduce(
      (acc, r) => ({ correct: acc.correct + (r.correct ?? 0), total: acc.total + (r.total ?? 0) }),
      { correct: 0, total: 0 },
    );

    const byChapter = new Map<string, { correct: number; total: number }>();
    rows.forEach((r) => {
      const id = r.chapter_id ?? r.subject_id;
      if (!id) return;
      const cur = byChapter.get(id) ?? { correct: 0, total: 0 };
      byChapter.set(id, { correct: cur.correct + (r.correct ?? 0), total: cur.total + (r.total ?? 0) });
    });

    const weakChapters = [...byChapter.entries()]
      .filter(([, v]) => v.total >= 3 && v.correct / v.total < 0.6)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 3)
      .map(([id]) => id.replace(/-/g, " "));

    const reply = await askTutorAI(data.messages, {
      name: profile?.name ?? "",
      xp: profile?.xp ?? 0,
      streak: profile?.streak ?? 0,
      dailyGoal: profile?.daily_goal ?? 0,
      todayCount: profile?.today_count ?? 0,
      tests: rows.length,
      accuracy: totals.total ? Math.round((100 * totals.correct) / totals.total) : 0,
      weakChapters,
      plan: entitlement?.plan_id ?? "free",
    });

    return { reply };
  });
