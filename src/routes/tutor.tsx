import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumLockCard } from "@/components/PremiumLock";
import { useSession } from "@/lib/auth";
import { usePremium } from "@/lib/subscription";
import { askTutor } from "@/lib/tutor.functions";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "AI Doubt Tutor — Max Pro | BoardBuddy" },
      {
        name: "description",
        content: "Ask your Class 10 doubts and get step-by-step NCERT-based explanations from the BoardBuddy AI tutor.",
      },
      { property: "og:title", content: "AI Doubt Tutor — Max Pro | BoardBuddy" },
      { property: "og:description", content: "Step-by-step doubt solving for CBSE Class 10 students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Explain electromagnetic induction simply",
  "How do I balance a chemical equation?",
  "Solve: find roots of x² − 5x + 6 = 0",
];

/** ChatGPT-style typing effect: reveals the reply word by word. */
function Typewriter({ text, onDone }: { text: string; onDone?: () => void }) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(false);

  useEffect(() => {
    const words = text.split(/(\s+)/);
    let i = 0;
    setShown("");
    const id = window.setInterval(() => {
      i += 2;
      if (i >= words.length) {
        window.clearInterval(id);
        setShown(text);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
        return;
      }
      setShown(words.slice(0, i).join(""));
    }, 24);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span>
      {shown}
      {shown.length < text.length && <span className="animate-pulse text-primary">▍</span>}
    </span>
  );
}

function TutorPage() {
  const { user } = useSession();
  const { subscriptionsEnabled, isMax, ready } = usePremium();
  const send = useServerFn(askTutor);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const allowed = !subscriptionsEnabled || isMax;
  const meta = (user?.user_metadata ?? {}) as { name?: string };
  const firstName = (meta.name ?? user?.email?.split("@")[0] ?? "").trim().split(/\s+/)[0] || "dost";

  async function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setBusy(true);
    try {
      const { reply } = await send({ data: { messages: next } });
      const withReply: Msg[] = [...next, { role: "assistant", content: reply }];
      setMessages(withReply);
      setTypingIndex(withReply.length - 1);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The tutor could not answer right now.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <AppShell title="AI Tutor">
        <div className="surface mt-6 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2 text-sm font-bold">Sign in to use the AI tutor</p>
          <Link
            to="/auth"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  if (ready && !allowed) {
    return (
      <AppShell title="AI Tutor">
        <div className="mt-6 space-y-3">
          <PremiumLockCard featureKey="tutor" />
          <div className="pointer-events-none select-none opacity-60 blur-[2px]" aria-hidden>
            <div className="surface p-4">
              <p className="text-sm font-bold">Ask me any Class 10 doubt</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Maths, Science, SST or English — I explain step by step, with the blue tick and ad-free study included.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell title="AI Tutor">
      <div className="space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="surface p-4">
            <p className="text-sm font-bold">Namaste {firstName}! 👋 Kya doubt hai aaj?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Maths, Science, SST or English — main step by step samjhata hoon, jaise ek dost.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void ask(s)}
                  className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  : "max-w-[92%] whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              }
            >
              {m.role === "assistant" && i === typingIndex ? (
                <Typewriter
                  text={m.content}
                  onDone={() => {
                    setTypingIndex(null);
                    endRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {busy && (
          <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </p>
        )}
        {error && <p className="text-xs font-bold text-destructive">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="surface sticky bottom-24 flex items-end gap-2 p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="Type your doubt…"
          className="max-h-32 w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </AppShell>
  );
}
