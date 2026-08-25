# Cloudflare deploy checklist (BoardBuddy)

Auth is **username + password only** — no email links, no OAuth, no callback route.
That keeps the production checklist short.

## 1. Build-time environment variables

These are inlined into the bundle at build time, so they must be present in the
Cloudflare build environment (Workers/Pages → Settings → Variables):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | from the project's `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | from the project's `.env` (publishable, safe in the client) |
| `VITE_SUPABASE_PROJECT_ID` | from the project's `.env` |

Optional server-side mirrors (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) are only
needed if server-side reads are added later. No service-role key is used by the app,
so none needs to be uploaded.

If the variables are missing, the app still renders in device-only mode
(progress saved locally) instead of crashing — but sign in/up will fail.

## 2. Auth callbacks / cookies

- No OAuth or magic-link callbacks exist, so no redirect URL allow-list entries
  are required.
- The session lives in `localStorage` (not cookies), so no cookie/domain config
  and no SSR session handling is needed. Verified: after sign-in a hard reload
  keeps the user signed in.
- `/reset-password` (old email-link URL) simply redirects to `/auth`, where
  recovery works with username + secret answer.
- Email confirmation is off (auto-confirm), so no "email not verified" state
  can appear in production.

## 3. Owner account

Permanent owner: username `swastikbaniya`. It holds the `owner` + `admin` roles in
the database, so `/owner` works immediately after deploy — nothing to re-run.

## 4. Build command

```
bun install
bun run build      # emits dist/ + dist/server/wrangler.json
npx nitro deploy --prebuilt   # or connect the repo to Cloudflare Workers
```

Verified locally: production build succeeds and generates the Cloudflare worker config.
