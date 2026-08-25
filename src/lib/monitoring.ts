import { supabase } from "@/lib/supabase";

type ReportKind = "client" | "promise" | "boundary" | "manual";

const MAX_PER_SESSION = 20;
const DEDUPE_WINDOW_MS = 30_000;

let sent = 0;
const recent = new Map<string, number>();
let installed = false;

function shouldSend(signature: string) {
  if (sent >= MAX_PER_SESSION) return false;
  const now = Date.now();
  const last = recent.get(signature);
  if (last && now - last < DEDUPE_WINDOW_MS) return false;
  recent.set(signature, now);
  if (recent.size > 100) recent.clear();
  return true;
}

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message || error.name, ...(error.stack ? { stack: error.stack } : {}) };
  }
  if (error instanceof Response) return { message: `Response ${error.status} ${error.url}` };
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) ?? "Unknown error" };
  } catch {
    return { message: String(error) };
  }
}

/** Fire-and-forget error report. Never throws, never blocks the UI. */
export function captureError(error: unknown, kind: ReportKind = "manual") {
  if (typeof window === "undefined") return;
  const { message, stack } = describe(error);
  if (!message) return;
  if (!shouldSend(`${kind}:${message}`.slice(0, 200))) return;

  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      sent += 1;
      await supabase.from("error_logs").insert({
        user_id: data.session?.user.id ?? null,
        message: message.slice(0, 2000),
        stack: stack ? stack.slice(0, 6000) : null,
        route: window.location.pathname,
        kind,
        user_agent: navigator.userAgent.slice(0, 300),
      });
    } catch {
      /* monitoring must never break the app */
    }
  })();
}

/** Installs global browser error listeners once. Safe to call on every mount. */
export function installErrorMonitoring() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    captureError((event as ErrorEvent).error ?? (event as ErrorEvent).message, "client");
  });
  window.addEventListener("unhandledrejection", (event) => {
    captureError((event as PromiseRejectionEvent).reason, "promise");
  });
}
