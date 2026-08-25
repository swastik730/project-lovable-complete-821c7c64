import { normalizeAvatarUrl } from "./avatars";
import { supabase } from "@/lib/supabase";
import type { Attempt, AppState } from "./store";
import { applyCloudSnapshot, getState, registerSink, setSyncStatus } from "./store";

let currentUserId: string | null = null;
let profileTimer: ReturnType<typeof setTimeout> | null = null;

function profilePayload(s: AppState) {
  return {
    name: s.name,
    avatar_url: s.avatarUrl,
    xp: s.xp,
    streak: s.streak,
    last_study_date: s.lastStudyDate,
    daily_goal: s.dailyGoal,
    today_count: s.todayCount,
    today_date: s.todayDate,
  };
}

async function pushProfile() {
  if (!currentUserId) return;
  const userId = currentUserId;
  setSyncStatus("syncing");
  const { error } = await supabase
    .from("profiles")
    .update(profilePayload(getState()))
    .eq("id", userId);
  setSyncStatus(error ? "error" : "synced");
}

function schedulePushProfile() {
  if (!currentUserId) return;
  if (profileTimer) clearTimeout(profileTimer);
  profileTimer = setTimeout(() => void pushProfile(), 600);
}

registerSink({
  onProfileChange: schedulePushProfile,
  onAttempt: async (attempt: Attempt) => {
    if (!currentUserId) return;
    setSyncStatus("syncing");
    const { error } = await supabase.from("attempts").insert({
      id: attempt.id,
      user_id: currentUserId,
      mode: attempt.mode,
      label: attempt.label,
      subject_id: attempt.subjectId,
      chapter_id: attempt.chapterId ?? null,
      test_id: attempt.testId ?? null,
      total: attempt.total,
      correct: attempt.correct,
      unanswered: attempt.unanswered,
      seconds: attempt.seconds,
      per_question: attempt.perQuestion,
      created_at: attempt.date,
    });
    setSyncStatus(error ? "error" : "synced");
    schedulePushProfile();
  },
  onBookmark: async (questionId: string, added: boolean) => {
    if (!currentUserId) return;
    if (added) {
      await supabase.from("bookmarks").insert({ user_id: currentUserId, question_id: questionId });
    } else {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", currentUserId)
        .eq("question_id", questionId);
    }
  },
  onReset: async () => {
    if (!currentUserId) return;
    const userId = currentUserId;
    setSyncStatus("syncing");
    await Promise.all([
      supabase.from("attempts").delete().eq("user_id", userId),
      supabase.from("bookmarks").delete().eq("user_id", userId),
      supabase.from("chapter_progress").delete().eq("user_id", userId),
    ]);
    await pushProfile();
  },
  onChapter: async (chapterId: string, done: boolean) => {
    if (!currentUserId) return;
    if (done) {
      await supabase
        .from("chapter_progress")
        .insert({ user_id: currentUserId, chapter_id: chapterId });
    } else {
      await supabase
        .from("chapter_progress")
        .delete()
        .eq("user_id", currentUserId)
        .eq("chapter_id", chapterId);
    }
  },
});

/** Pull everything from the cloud, merged with whatever is on this device. */
export async function syncUser(userId: string) {
  currentUserId = userId;
  setSyncStatus("syncing");
  const local = getState();

  const [profileRes, attemptsRes, bookmarksRes, chaptersRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("bookmarks").select("question_id").eq("user_id", userId),
    supabase.from("chapter_progress").select("chapter_id").eq("user_id", userId),
  ]);

  if (profileRes.error) {
    setSyncStatus("error");
    return;
  }

  const p = profileRes.data;
  const cloudAttempts: Attempt[] = (attemptsRes.data ?? []).map((row) => ({
    id: row.id,
    mode: (row.mode as Attempt["mode"]) ?? "quiz",
    label: row.label,
    subjectId: row.subject_id,
    chapterId: row.chapter_id ?? undefined,
    testId: row.test_id ?? undefined,
    total: row.total,
    correct: row.correct,
    unanswered: row.unanswered,
    seconds: row.seconds,
    date: row.created_at,
    perQuestion: (row.per_question as Attempt["perQuestion"]) ?? [],
  }));

  const mergedAttempts = [...cloudAttempts];
  const cloudIds = new Set(cloudAttempts.map((a) => a.id));
  const localOnly = local.attempts.filter((a) => !cloudIds.has(a.id));
  mergedAttempts.push(...localOnly);
  mergedAttempts.sort((a, b) => (a.date < b.date ? 1 : -1));

  const bookmarks = Array.from(
    new Set([...(bookmarksRes.data ?? []).map((b) => b.question_id), ...local.bookmarks]),
  );
  const chapters = Array.from(
    new Set([
      ...(chaptersRes.data ?? []).map((c) => c.chapter_id),
      ...local.completedChapters,
    ]),
  );

  applyCloudSnapshot({
    name: p?.name || local.name,
    avatarUrl: normalizeAvatarUrl(p?.avatar_url ?? local.avatarUrl ?? null),
    onboarded: true,
    xp: Math.max(p?.xp ?? 0, local.xp),
    streak: Math.max(p?.streak ?? 0, local.streak),
    lastStudyDate: p?.last_study_date ?? local.lastStudyDate,
    dailyGoal: p?.daily_goal ?? local.dailyGoal,
    todayCount: Math.max(p?.today_count ?? 0, local.todayCount),
    todayDate: p?.today_date ?? local.todayDate,
    attempts: mergedAttempts.slice(0, 200),
    bookmarks,
    completedChapters: chapters,
  });

  // Push anything that only existed on this device.
  const pushes: PromiseLike<unknown>[] = [];
  if (localOnly.length) {
    pushes.push(
      supabase.from("attempts").upsert(
        localOnly.map((a) => ({
          id: a.id,
          user_id: userId,
          mode: a.mode,
          label: a.label,
          subject_id: a.subjectId,
          chapter_id: a.chapterId ?? null,
          test_id: a.testId ?? null,
          total: a.total,
          correct: a.correct,
          unanswered: a.unanswered,
          seconds: a.seconds,
          per_question: a.perQuestion,
          created_at: a.date,
        })),
      ),
    );
  }
  if (bookmarks.length) {
    pushes.push(
      supabase
        .from("bookmarks")
        .upsert(bookmarks.map((question_id) => ({ user_id: userId, question_id }))),
    );
  }
  if (chapters.length) {
    pushes.push(
      supabase
        .from("chapter_progress")
        .upsert(chapters.map((chapter_id) => ({ user_id: userId, chapter_id }))),
    );
  }
  pushes.push(supabase.from("profiles").update(profilePayload(getState())).eq("id", userId));
  await Promise.all(pushes);
  setSyncStatus("synced");
}

export function stopSync() {
  currentUserId = null;
  if (profileTimer) clearTimeout(profileTimer);
  setSyncStatus("offline");
}
