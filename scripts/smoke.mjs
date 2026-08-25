/**
 * BoardBuddy smoke suite.
 *
 * Walks every route, then drives the two critical flows end to end:
 *   1. Quiz  : answer -> submit -> result screen
 *   2. Test  : start -> answer -> submit from the question palette
 *   3. Back-button regression: back mid-test -> confirm dialog -> "Keep writing"
 *      keeps the user on the test.
 *
 * Usage: bun run test:smoke   (or: node scripts/smoke.mjs)
 * Env:   BASE_URL (default http://localhost:8080)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";

const ROUTES = [
  "/",
  "/practice",
  "/learn",
  "/learn/science",
  "/tests",
  "/analysis",
  "/progress",
  "/bookmarks",
  "/achievements",
  "/leaderboard",
  "/calendar",
  "/notifications",
  "/profile",
  "/ncert",
  "/more",
  "/auth",
  "/owner",
  "/owner/content",
  "/owner/roles",
  "/owner/audit",
  "/owner/errors",
  "/owner/ads",
  "/quiz/science",
];

const results = [];
let failures = 0;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  const mark = ok ? "\u001b[32mPASS\u001b[0m" : "\u001b[31mFAIL\u001b[0m";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function check(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (err) {
    record(name, false, err instanceof Error ? err.message : String(err));
  }
}

function attachConsole(page, bucket) {
  page.on("console", (msg) => {
    if (msg.type() === "error") bucket.push(msg.text());
  });
  page.on("pageerror", (err) => bucket.push(String(err)));
}

const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the React DevTools/i,
  /supabase/i,
  /Failed to load resource/i,
];

function realErrors(list) {
  return list.filter((t) => !IGNORED_CONSOLE.some((re) => re.test(t)));
}

/** Answer every question by picking the first option, then move to the next. */
async function answerAll(page) {
  for (let i = 0; i < 40; i++) {
    const option = page.locator("ul li button").first();
    if (await option.isVisible().catch(() => false)) await option.click();
    const next = page.getByRole("button", { name: /^Next$/ }).first();
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
    await page.waitForTimeout(250);
  }
}

/** Press the sticky submit button, then confirm in the bottom sheet. */
async function submitAttempt(page, label) {
  await page.getByRole("button", { name: label }).first().click();
  const confirm = page.getByRole("button", { name: /^Submit$/ }).last();
  await confirm.waitFor({ state: "visible", timeout: 10000 });
  await confirm.click();
  await page.waitForTimeout(1800);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });

  // ---------- 1. Route walk ----------
  for (const route of ROUTES) {
    const errors = [];
    const page = await context.newPage();
    attachConsole(page, errors);
    await check(`route ${route}`, async () => {
      const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (res && res.status() >= 500) throw new Error(`HTTP ${res.status()}`);
      await page.waitForTimeout(700);
      const body = await page.textContent("body");
      if (!body || body.trim().length < 20) throw new Error("empty page");
      if (/This page didn't load|Page not found/.test(body)) throw new Error("error boundary rendered");
      const bad = realErrors(errors);
      if (bad.length) throw new Error(`console error: ${bad[0].slice(0, 160)}`);
    });
    await page.close();
  }

  // ---------- 2. Quiz flow ----------
  {
    const page = await context.newPage();
    await check("quiz flow: answer -> submit -> result", async () => {
      await page.goto(`${BASE}/quiz/science`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("ul li button", { timeout: 20000 });
      await page.waitForTimeout(2500);
      await answerAll(page);
      await submitAttempt(page, /Submit quiz/i);
      const body = (await page.textContent("body")) ?? "";
      if (!/Result|Accuracy|Score/i.test(body)) throw new Error("result screen not shown");
    });
    await page.close();
  }

  // ---------- 3. Test flow + back-button regression ----------
  {
    const page = await context.newPage();
    await check("test flow: start -> answer -> grid submit", async () => {
      await page.goto(`${BASE}/tests`, { waitUntil: "domcontentloaded" });
      const start = page.getByRole("button", { name: /Start test/i }).first();
      await start.waitFor({ state: "visible", timeout: 20000 });
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll("button")).some(
            (b) => /start test/i.test(b.textContent ?? "") && !b.disabled,
          ),
        undefined,
        { timeout: 30000 },
      );
      await page.waitForTimeout(2500);
      await start.click();
      await page.waitForFunction(() => location.pathname.startsWith("/tests/run"), undefined, {
        timeout: 20000,
      });
      await page.waitForSelector("ul li button", { timeout: 20000 });

      // answer the first question
      await page.locator("ul li button").first().click();

      // back-button regression: confirm dialog -> Keep writing -> still on test
      await page.goBack();
      const keep = page.getByRole("button", { name: /Keep writing/i }).first();
      await keep.waitFor({ state: "visible", timeout: 10000 });
      await keep.click();
      await page.waitForTimeout(800);
      if (!/\/tests\/run/.test(page.url())) throw new Error(`left the test after Keep writing: ${page.url()}`);

      // submit from the grid view sheet
      await page.getByRole("button", { name: /Open grid view/i }).first().click();
      await page.getByRole("button", { name: /Submit test/i }).last().click();
      const confirm = page.getByRole("button", { name: /^Submit$/ }).last();
      await confirm.waitFor({ state: "visible", timeout: 10000 });
      await confirm.click();
      await page.waitForTimeout(1800);
      const body = (await page.textContent("body")) ?? "";
      if (!/Accuracy|Solutions|Score|Test Result/i.test(body)) throw new Error("test result screen not shown");
    });
    await page.close();
  }

  // ---------- 4. Owner panel (only when owner credentials are provided) ----------
  if ((process.env.OWNER_USERNAME || process.env.OWNER_EMAIL) && process.env.OWNER_PASSWORD) {
    const page = await context.newPage();
    await check("owner panel: login -> every tab renders", async () => {
      await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      // Username + password auth: the sign-in form has no email field.
      await page.locator('input[name="username"], input#username').first().fill(process.env.OWNER_USERNAME ?? process.env.OWNER_EMAIL);
      await page.locator('input[type="password"]').first().fill(process.env.OWNER_PASSWORD);
      await page.getByRole("button", { name: /^Sign in$/ }).click();
      await page.waitForFunction(() => location.pathname === "/", undefined, { timeout: 20000 });

      for (const tab of ["/owner", "/owner/roles", "/owner/content", "/owner/ads", "/owner/audit", "/owner/errors"]) {
        await page.goto(BASE + tab, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2500);
        const body = (await page.textContent("body")) ?? "";
        if (/This page is for the owner only/.test(body)) throw new Error(`${tab}: owner role not detected`);
        if (/Checking access/.test(body)) throw new Error(`${tab}: stuck on access check`);
      }
    });
    await page.close();
  } else {
    console.log("SKIP  owner panel checks (set OWNER_USERNAME + OWNER_PASSWORD to run)");
  }

  await context.close();
  await browser.close();

  console.log("\n———");
  console.log(`${results.length - failures}/${results.length} checks passed`);
  if (failures) {
    console.log("Failed:");
    for (const r of results.filter((r) => !r.ok)) console.log(`  - ${r.name}: ${r.detail}`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
