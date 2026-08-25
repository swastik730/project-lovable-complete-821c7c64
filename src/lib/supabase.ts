/**
 * Safe access to the cloud backend.
 *
 * The generated client throws at first use when the backend environment
 * variables are missing (i.e. Cloud has not been connected yet). Importing
 * `supabase` from here keeps every screen usable in device-only mode:
 * reads resolve empty and writes resolve with a friendly error instead of
 * crashing the React tree.
 */
import { supabase as generated } from "@/integrations/supabase/client";

export const CLOUD_UNAVAILABLE_MESSAGE =
  "Cloud is not connected, so this feature is unavailable. Your progress is saved on this device.";

type Client = typeof generated;

let resolved: Client | null | undefined;

function resolveClient(): Client | null {
  if (resolved !== undefined) return resolved;
  try {
    // Touching a property forces the generated proxy to build the client.
    void generated.auth;
    resolved = generated;
  } catch {
    resolved = null;
  }
  return resolved;
}

/** True when the cloud backend is configured and usable. */
export function isCloudConnected(): boolean {
  return resolveClient() !== null;
}

function cloudError() {
  return { message: CLOUD_UNAVAILABLE_MESSAGE, name: "CloudUnavailable", code: "cloud_unavailable" };
}

const WRITE_METHODS = new Set(["insert", "update", "upsert", "delete"]);
const SINGLE_METHODS = new Set(["single", "maybeSingle"]);

/** A chainable no-op query builder that resolves to an empty result. */
function queryStub(): any {
  const state = { write: false, single: false };

  const settle = () =>
    state.write
      ? { data: null, error: cloudError(), count: null, status: 503, statusText: "offline" }
      : {
          data: state.single ? null : [],
          error: null,
          count: 0,
          status: 200,
          statusText: "OK",
        };

  const chain: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return (...args: any[]) => Promise.resolve(settle()).then(...args);
        if (prop === "catch") return (...args: any[]) => Promise.resolve(settle()).catch(...args);
        if (prop === "finally") return (...args: any[]) => Promise.resolve(settle()).finally(...args);
        if (typeof prop === "string") {
          if (WRITE_METHODS.has(prop)) state.write = true;
          if (SINGLE_METHODS.has(prop)) state.single = true;
        }
        return () => chain;
      },
    },
  );

  return chain;
}

const authStub = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { id: "offline", callback: () => {}, unsubscribe: () => {} } },
  }),
  signOut: async () => ({ error: null }),
  signInWithPassword: async () => ({ data: { user: null, session: null }, error: cloudError() }),
  signInWithOAuth: async () => ({ data: { provider: "google", url: null }, error: cloudError() }),
  signUp: async () => ({ data: { user: null, session: null }, error: cloudError() }),
  resetPasswordForEmail: async () => ({ data: null, error: cloudError() }),
  resend: async () => ({ data: { user: null, session: null }, error: cloudError() }),

  updateUser: async () => ({ data: { user: null }, error: cloudError() }),
};

const offlineClient = {
  auth: authStub,
  from: () => queryStub(),
  rpc: () => queryStub(),
} as unknown as Client;

/**
 * The cloud client when available, otherwise a soft-failing stand-in.
 * Import this instead of the generated client in app code.
 */
export const supabase: Client = new Proxy({} as Client, {
  get(_target, prop) {
    const target = resolveClient() ?? offlineClient;
    const value = Reflect.get(target as object, prop);
    // Bind methods to the real client so destructured calls like
    // `const rpc = supabase.rpc; rpc(...)` keep their `this` context.
    return typeof value === "function" ? value.bind(target) : value;
  },
});

