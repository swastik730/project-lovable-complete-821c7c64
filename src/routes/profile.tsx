import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, BellRing, Bookmark, Check, Globe, Volume2, ChevronRight, Cloud, Crown, LogIn, LogOut, Moon, RotateCcw, ShieldCheck, Trophy, User, UserX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useTheme } from "@/components/theme";
import { resetProgress, update, useAppState, useStats, useSyncStatus } from "@/lib/store";
import { useRoles } from "@/lib/roles";
import { signOut, useSession } from "@/lib/auth";
import { AVATARS } from "@/lib/avatars";
import { PageHero } from "@/components/PageHero";
import heroProfile from "@/assets/hero-profile.webp";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { usePremium } from "@/lib/subscription";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings | BoardBuddy" },
      {
        name: "description",
        content: "Manage your BoardBuddy profile: display name, daily goal, dark mode, notifications and saved questions.",
      },
      { property: "og:title", content: "Profile & Settings | BoardBuddy" },
      { property: "og:description", content: "Your Class 10 study profile, daily goal and app settings." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const state = useAppState();
  const stats = useStats();
  const { theme, toggle } = useTheme();
  const { user } = useSession();
  const sync = useSyncStatus();
  const [name, setName] = useState("");
  const [reminder, setReminder] = useState(true);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    setReminder(window.localStorage.getItem("bb.pref.reminder") !== "off");
    setSound(window.localStorage.getItem("bb.pref.sound") !== "off");
  }, []);

  const { isOwner } = useRoles();
  const { subscriptionsEnabled, entitlement, isMax } = usePremium();

  return (
    <AppShell title="Profile">
      <PageHero
        eyebrow="Your profile"
        eyebrowIcon={<User className="h-3.5 w-3.5" />}
        title="Make it yours"
        titleAccent="and keep the streak alive"
        description="Pick an avatar, set your daily goal and manage how BoardBuddy works for you."
        image={heroProfile}
        imageAlt="Student profile illustration with badges"
        tint="purple"
      />
      <div className="goal-hero relative mb-4 flex items-center gap-4 overflow-hidden rounded-3xl p-5">
        {state.avatarUrl ? (
          <img
            src={state.avatarUrl}
            alt={`${state.name} profile picture`}
            width={512}
            height={512}
            loading="lazy"
            decoding="async"
            className="h-16 w-16 shrink-0 rounded-2xl bg-white/15 object-cover ring-2 ring-white/25"
          />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 ring-2 ring-white/25">
            <User className="h-7 w-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-lg font-extrabold">
            <span className="truncate">{state.name}</span>
            {isMax && <VerifiedBadge className="h-5 w-5 text-white" />}
          </p>
          <p className="text-xs opacity-85">Class 10 · 2027 Batch</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold">
              {stats.questions} Questions
            </span>
            <span className="gold-gradient rounded-full px-2.5 py-0.5 text-[11px] font-extrabold">
              {state.xp} XP
            </span>
          </div>
          <a
            href="#name"
            className="mt-3 inline-flex rounded-lg bg-white/15 px-3 py-1 text-[11px] font-bold"
          >
            Edit Profile
          </a>
        </div>
      </div>

      <div className="purple-panel mb-4 p-5">
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className="h-4 w-1 rounded-full bg-hero-purple" />
          Profile picture
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick an avatar — it shows on the leaderboard and your profile.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {AVATARS.map((src, i) => {
            const active = state.avatarUrl === src;
            return (
              <button
                key={src}
                type="button"
                aria-label={`Choose avatar ${i + 1}`}
                aria-pressed={active}
                onClick={() => update({ avatarUrl: src })}
                className={`relative h-14 w-14 overflow-hidden rounded-2xl border-2 transition-colors ${
                  active ? "border-primary" : "border-transparent"
                }`}
              >
                <img
                  src={src}
                  alt={`Avatar option ${i + 1}`}
                  width={512}
                  height={512}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full bg-primary-soft object-cover"
                />
                {active ? (
                  <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-tl-lg bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            aria-label="No avatar"
            aria-pressed={!state.avatarUrl}
            onClick={() => update({ avatarUrl: null })}
            className={`grid h-14 w-14 place-items-center rounded-2xl border-2 bg-muted text-muted-foreground transition-colors ${
              !state.avatarUrl ? "border-primary" : "border-transparent"
            }`}
          >
            <UserX className="h-5 w-5" />
          </button>
        </div>
      </div>

      {user ? (
        <div className="surface mb-4 p-5">
          <div className="flex items-center gap-3">
            <Cloud className="h-4 w-4 text-success" />
            <div className="flex-1">
              <p className="text-sm font-bold">Cloud sync on</p>
              <p className="text-xs text-muted-foreground">
                @{(user.email ?? "").split("@")[0]} ·{" "}
                {sync === "syncing" ? "Syncing…" : sync === "error" ? "Sync failed — retrying" : "All progress saved"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-input text-sm font-bold"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : (
        <Link to="/auth" className="surface mb-4 flex items-center gap-3 p-5">
          <LogIn className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-bold">Sign in to sync progress</p>
            <p className="text-xs text-muted-foreground">
              XP, streak, quiz history aur bookmarks har device par safe.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="surface mb-4 p-5">
        <label htmlFor="name" className="text-sm font-bold">
          Display name
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">Only your name is shown — never your phone or email.</p>
        <div className="mt-3 flex gap-2">
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={state.name}
            className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => {
              update({ name: name.trim() || state.name, onboarded: true });
              setName("");
            }}
            className="brand-gradient rounded-xl px-4 text-sm font-bold text-primary-foreground"
          >
            Save
          </button>
        </div>
      </div>

      <div className="surface mb-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">Daily goal</p>
            <p className="text-xs text-muted-foreground">Questions to attempt every day</p>
          </div>
          <span className="text-lg font-extrabold text-primary">{state.dailyGoal}</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={state.dailyGoal}
          onChange={(e) => update({ dailyGoal: Number(e.target.value) })}
          className="mt-4 w-full accent-[var(--color-primary)]"
        />
      </div>

      <div className="surface mb-4 p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold">
          <span className="h-4 w-1 rounded-full bg-hero-purple" />
          Preferences
        </p>
        <div className="divide-y divide-border">
          <ToggleRow
            icon={
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-hero-amber/20 text-hero-amber">
                <BellRing className="h-4 w-4" />
              </span>
            }
            label="Study Reminder"
            hint="Daily at 6:00 PM"
            on={reminder}
            onChange={() => setPref("reminder", !reminder, setReminder)}
          />
          <ToggleRow
            icon={
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-hero-purple/18 text-hero-purple">
                <Moon className="h-4 w-4" />
              </span>
            }
            label="Dark Mode"
            on={theme === "dark"}
            onChange={toggle}
          />
          <ToggleRow
            icon={
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-hero-green/18 text-hero-green">
                <Volume2 className="h-4 w-4" />
              </span>
            }
            label="Sound Effects"
            on={sound}
            onChange={() => setPref("sound", !sound, setSound)}
          />
          <div className="flex items-center gap-3 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Globe className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-semibold">Language</span>
            <span className="text-xs font-bold text-muted-foreground">English</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>


      <div className="surface mb-4 divide-y divide-border">
        <Link to="/bookmarks" className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-achievement-soft text-achievement">
            <Bookmark className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">Bookmarked questions</span>
          <span className="text-xs font-bold text-muted-foreground">{state.bookmarks.length}</span>
        </Link>
        <Link to="/notifications" className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">Notifications</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/leaderboard" className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-hero-purple/18 text-hero-purple">
            <Trophy className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">Leaderboard</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/subscribe" className="flex items-center gap-3 px-5 py-4">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              isMax ? "bg-primary/15 text-primary" : "bg-success-soft text-success"
            }`}
          >
            <Crown className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">Subscription</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              !subscriptionsEnabled
                ? "bg-success-soft text-success"
                : entitlement
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {!subscriptionsEnabled ? "All unlocked" : isMax ? "Max Pro" : entitlement ? "Premium" : "Not active"}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>


        {isOwner && (
          <Link to="/owner" className="flex items-center gap-3 px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-semibold">Owner panel</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-hero-green/18 text-hero-green">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">Privacy</span>
          <span className="text-right text-xs text-muted-foreground">
            {user ? "Synced to your account" : "Data stays on device"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset all progress? This cannot be undone.")) resetProgress();
          }}
          className="flex w-full items-center gap-3 px-5 py-4 text-left text-destructive"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive-soft text-destructive">
            <RotateCcw className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">Reset progress</span>
        </button>
      </div>


      {user && (
        <button
          type="button"
          onClick={() => void signOut()}
          className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-destructive text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      )}

      <p className="pb-2 text-center text-xs text-muted-foreground">BoardBuddy · Your Smart Board Exam Partner</p>
    </AppShell>
  );
}

function setPref(key: string, value: boolean, apply: (v: boolean) => void) {
  window.localStorage.setItem(`bb.pref.${key}`, value ? "on" : "off");
  apply(value);
}

function ToggleRow({
  icon,
  label,
  hint,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onChange}
        className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-card shadow transition-transform ${on ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
