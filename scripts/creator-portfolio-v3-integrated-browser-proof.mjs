import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const frontend = "http://localhost:43492",
  backend = "http://localhost:33492",
  password = process.env.CREATOR_PORTFOLIO_FIXTURE_PASSWORD;
const evidence = resolve(process.env.PORTFOLIO_EVIDENCE_DIR ?? "");
assert.ok(
  password && process.env.P4_BROWSER_PATH && process.env.PORTFOLIO_EVIDENCE_DIR,
);
assert.equal(dirname(evidence), resolve(process.cwd(), "../runtime"));
assert.match(evidence.split(/[\\/]/u).at(-1), /^p4-[a-f0-9-]{36}$/u);
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.P4_BROWSER_PATH,
  headless: true,
  args: [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-first-run",
    "--no-proxy-server",
  ],
});
const output = {
  matrix: [],
  dialogs: [],
  actions: [],
  controlledFailures: [],
  externalTraffic: 0,
  anonymous: null,
  tenantIsolation: null,
  offlineFontFixture:
    "Exact inherited font CSS locally fulfilled; unchanged fallback declarations, zero outbound traffic",
};
let mainIDs = [];
let checkpoint = "STARTUP";
const apiMatch = (response) =>
  new URL(response.url()).pathname === "/api/v1/creator/portfolio" &&
  response.request().method() === "GET";
async function pageFor(state, role, width, height) {
  const context = await browser.newContext({ viewport: { width, height } }),
    page = await context.newPage();
  let authenticated = false;
  const counts = {
    consoleErrors: 0,
    pageErrors: 0,
    external: 0,
    offlineFonts: 0,
  };
  let authorization;
  page.on("console", (message) => {
    if (authenticated && message.type() === "error") counts.consoleErrors++;
  });
  page.on("pageerror", () => {
    if (authenticated) counts.pageErrors++;
  });
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/v1/creator/portfolio")
      authorization = request.headers().authorization;
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      ["localhost", "127.0.0.1"].includes(url.hostname) ||
      ["data:", "blob:"].includes(url.protocol)
    )
      return route.continue();
    if (
      (url.hostname === "api.fontshare.com" && url.pathname === "/v2/css") ||
      (url.hostname === "fonts.googleapis.com" && url.pathname === "/css2")
    ) {
      counts.offlineFonts++;
      return route.fulfill({
        status: 200,
        contentType: "text/css",
        body: "/* Offline fixture: unchanged declared fallback fonts. */",
      });
    }
    counts.external++;
    return route.abort("blockedbyclient");
  });
  await page.goto(frontend + "/login", { waitUntil: "domcontentloaded" });
  await page
    .getByLabel("Email", { exact: true })
    .fill(`portfolio-v3-p4-${state}-${role.toLowerCase()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const login = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/auth/login" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  assert.equal(
    (await login).status(),
    200,
    "Real password authentication must succeed",
  );
  authenticated = true;
  const api = page.waitForResponse(apiMatch);
  await page.goto(frontend + "/creator/portfolio", {
    waitUntil: "domcontentloaded",
  });
  const response = await api;
  assert.equal(response.status(), 200);
  const data = await response.json();
  await page
    .getByRole("heading", { name: "Portfolio", level: 1, exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "Your work", level: 2, exact: true })
    .waitFor();
  assert.equal(data.context.role, role);
  return { context, page, data, counts, authorization: () => authorization };
}
async function inspect(page, counts, state, role, width, name = "workspace") {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth > innerWidth,
    body: document.body.scrollWidth > innerWidth,
  }));
  assert.deepEqual(
    overflow,
    { document: false, body: false },
    `Overflow ${state}/${role}/${width}/${name}`,
  );
  const axe = await new AxeBuilder({ page }).analyze();
  const violations = axe.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    count: v.nodes.length,
    selectors: v.nodes.map((n) => n.target),
  }));
  if (violations.length)
    console.log(
      JSON.stringify({
        gate: "PORTFOLIO_AXE_FAILURE",
        state,
        role,
        width,
        name,
        violations,
      }),
    );
  assert.equal(violations.length, 0, "All Axe severity gates must be zero");
  assert.equal(
    counts.consoleErrors,
    0,
    "Authenticated console errors must be zero",
  );
  assert.equal(counts.pageErrors, 0);
  assert.equal(counts.external, 0);
  await page.screenshot({
    path: resolve(
      evidence,
      `${state}-${role.toLowerCase()}-${width}-${name}.png`,
    ),
    fullPage: true,
  });
  return {
    state,
    role,
    width,
    name,
    overflow: 0,
    axe: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    consoleErrors: 0,
    pageErrors: 0,
    externalTraffic: 0,
    offlineFonts: counts.offlineFonts,
  };
}
async function menuProof(page) {
  const menu = page.getByRole("button", { name: "Open Menu", exact: true });
  if (await menu.isVisible()) {
    await menu.focus();
    await menu.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Application navigation",
      exact: true,
    });
    await dialog.waitFor();
    const close = page.getByRole("button", { name: "Close menu", exact: true });
    assert.ok(
      await close.evaluate((element) => document.activeElement === element),
    );
    assert.ok(
      await dialog
        .getByRole("link", { name: "Portfolio", exact: true })
        .isVisible(),
    );
    await close.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.ok(
      await menu.evaluate((element) => document.activeElement === element),
    );
    return "MENU_TRAP_RETURN_PASS";
  }
  assert.ok(
    await page
      .getByRole("link", { name: "Portfolio", exact: true })
      .first()
      .isVisible(),
  );
  return "SIDEBAR_PASS";
}
async function keyboardProof(page) {
  const all = page.getByRole("button", { name: "All", exact: true });
  await all.focus();
  await all.press("Tab");
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const style = el ? getComputedStyle(el) : null;
    return {
      active: el !== document.body,
      visible: !!el?.matches(":focus-visible"),
      outline: style?.outlineWidth,
    };
  });
  assert.ok(focus.active && focus.visible && parseFloat(focus.outline) > 0);
  const headings = await page
    .locator(
      ".creator-portfolio h1,.creator-portfolio h2,.creator-portfolio h3",
    )
    .evaluateAll((elements) =>
      elements.map((el) => Number(el.tagName.slice(1))),
    );
  assert.equal(headings[0], 1);
  assert.equal(headings[1], 2);
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i] <= headings[i - 1] + 1);
  return "TAB_VISIBLE_FOCUS_HEADING_ORDER_PASS";
}
async function filter(page, label) {
  const api = page.waitForResponse(apiMatch);
  await page.getByRole("button", { name: label, exact: true }).focus();
  await page.getByRole("button", { name: label, exact: true }).press("Enter");
  const response = await api;
  assert.equal(response.status(), 200);
  await page.getByRole("heading", { name: "Your work", exact: true }).waitFor();
  return response.json();
}
async function curate(page, counts, role, width) {
  const add = page.getByRole("button", {
    name: "Add work reference",
    exact: true,
  });
  await add.focus();
  await add.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Add work reference",
    exact: true,
  });
  await dialog.waitFor();
  await page.waitForFunction(() =>
    document.activeElement?.closest('[role="dialog"]'),
  );
  output.dialogs.push(
    await inspect(page, counts, "main", role, width, "add-dialog"),
  );
  const close = dialog.getByRole("button", {
    name: "Close Add work reference",
    exact: true,
  });
  const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
  await cancel.focus();
  await cancel.press("Tab");
  assert.ok(
    await close.evaluate((element) => document.activeElement === element),
  );
  await close.press("Shift+Tab");
  assert.ok(
    await cancel.evaluate((element) => document.activeElement === element),
  );
  await close.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await add.evaluate((el) => document.activeElement === el));
  await add.press("Enter");
  const title = `${role} work ${width}`,
    edited = `${role} edited work ${width}`;
  await page.getByLabel("Work title", { exact: true }).fill(title);
  await page
    .getByLabel("Original work link", { exact: true })
    .fill(`https://example.com/portfolio/${role.toLowerCase()}/${width}`);
  await page
    .getByLabel("Creator context (optional)", { exact: true })
    .fill("Synthetic Creator-authored context");
  const put = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/v1/creator/portfolio" &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Save work reference", exact: true })
    .click();
  assert.equal((await put).status(), 200);
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("heading", { name: title, exact: true }).waitFor();
  await page
    .getByRole("button", { name: `Edit ${title}`, exact: true })
    .click();
  await page.getByLabel("Work title", { exact: true }).fill(edited);
  const edit = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/v1/creator/portfolio" &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Save work reference", exact: true })
    .click();
  assert.equal((await edit).status(), 200);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("heading", { name: edited, exact: true }).waitFor();
  const remove = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/v1/creator/portfolio" &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: `Remove ${edited}`, exact: true })
    .click();
  assert.equal((await remove).status(), 200);
  await page
    .getByRole("heading", { name: edited, exact: true })
    .waitFor({ state: "hidden" });
  await filter(page, "Removed");
  await page.getByRole("heading", { name: edited, exact: true }).waitFor();
  const restore = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/v1/creator/portfolio" &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: `Restore ${edited}`, exact: true })
    .click();
  assert.equal((await restore).status(), 200);
  await page
    .getByRole("heading", { name: edited, exact: true })
    .waitFor({ state: "hidden" });
  await filter(page, "All");
  await page.getByRole("heading", { name: edited, exact: true }).waitFor();
  output.actions.push({
    role,
    width,
    add: 200,
    edit: 200,
    remove: 200,
    restore: 200,
    focusReturn: true,
    verifiedFactsEditable: false,
  });
}
try {
  for (const [width, height] of [
    [390, 844],
    [767, 900],
    [768, 900],
    [1440, 1000],
  ])
    for (const state of [
      "main",
      "partial",
      "unavailable",
      "processing",
      "removed",
      "empty",
      "notprocessed",
    ])
      for (const role of ["OWNER", "MANAGER", "ASSISTANT"]) {
        checkpoint = `${state}:${role}:${width}`;
        const { context, page, data, counts, authorization } = await pageFor(
          state,
          role,
          width,
          height,
        );
        try {
          assert.equal(
            data.discovery,
            state === "partial" || state === "processing"
              ? "PARTIAL"
              : state === "unavailable"
                ? "UNAVAILABLE"
                : state === "notprocessed"
                  ? "NOT_PROCESSED"
                  : "AVAILABLE",
          );
          assert.equal(data.context.canCurate, role !== "ASSISTANT");
          assert.equal(
            await page
              .getByRole("navigation", { name: "Portfolio filters" })
              .getByRole("button")
              .count(),
            5,
          );
          assert.equal(
            await page
              .locator(
                ".creator-portfolio video,.creator-portfolio iframe,.creator-portfolio img,.creator-portfolio input[type=file]",
              )
              .count(),
            0,
          );
          const navigation = await menuProof(page),
            keyboard = await keyboardProof(page);
          if (role === "ASSISTANT") {
            assert.equal(
              await page
                .getByRole("button", {
                  name: "Add work reference",
                  exact: true,
                })
                .count(),
              0,
            );
            assert.equal(
              await page.locator(".creator-portfolio__actions button").count(),
              0,
            );
          } else
            assert.ok(
              await page
                .getByRole("button", {
                  name: "Add work reference",
                  exact: true,
                })
                .isVisible(),
            );
          if (state === "main") {
            assert.equal(
              data.items.filter(
                (i) =>
                  i.provenance.some((p) => p.source === "INSTAGRAM") &&
                  i.provenance.some((p) => p.source === "CREATOR_SHOP"),
              ).length,
              1,
            );
            assert.ok(
              data.items.some(
                (i) =>
                  i.kind === "UGC" &&
                  i.provenance.some((p) => p.source === "CREATOR_SHOP"),
              ),
            );
            assert.ok(
              (
                await page
                  .locator(".creator-portfolio__sources")
                  .allTextContents()
              ).some(
                (text) =>
                  text.includes("Instagram Verified") &&
                  text.includes("Creator Shop Verified"),
              ),
            );
            if (!mainIDs.length) mainIDs = data.items.map((i) => i.id);
            const ig = await filter(page, "Instagram");
            assert.ok(
              ig.items.length >= 3 &&
                ig.items.every((i) =>
                  i.provenance.some((p) => p.source === "INSTAGRAM"),
                ),
            );
            const shop = await filter(page, "Creator Shop");
            assert.ok(
              shop.items.length >= 2 &&
                shop.items.every((i) =>
                  i.provenance.some((p) => p.source === "CREATOR_SHOP"),
                ),
            );
            await filter(page, "Added by me");
            await filter(page, "All");
            if (role !== "ASSISTANT") await curate(page, counts, role, width);
          } else if (state !== "empty" && state !== "notprocessed") {
            assert.ok(
              data.items.every((i) => !mainIDs.includes(i.id)),
              "Creator-subject data must not cross workspace",
            );
          }
          if (state === "removed") {
            assert.equal(data.items.length, 0);
            const removed = await filter(page, "Removed");
            assert.equal(removed.items.length, 3);
            if (role === "ASSISTANT")
              assert.equal(
                await page
                  .locator(".creator-portfolio__actions button")
                  .count(),
                0,
              );
            else
              assert.equal(
                await page.getByRole("button", { name: /^Restore / }).count(),
                3,
              );
          }
          if (state === "empty" || state === "notprocessed")
            assert.equal(data.items.length, 0);
          const sourceLinks = await page
            .locator(".creator-portfolio__item a")
            .evaluateAll((links) =>
              links.map((a) => ({
                href: a.href,
                rel: a.rel,
                label: a.getAttribute("aria-label"),
              })),
            );
          for (const link of sourceLinks) {
            assert.ok(
              link.href.startsWith("https://") &&
                link.rel.includes("noopener") &&
                link.rel.includes("noreferrer") &&
                link.label?.startsWith("Open original work:"),
            );
          }
          output.matrix.push({
            ...(await inspect(page, counts, state, role, width)),
            navigation,
            keyboard,
            sourceLinks: sourceLinks.length,
            auth: "REAL_PASSWORD_JWT",
            apiStatus: 200,
          });
          if (state === "main" && role === "ASSISTANT" && width === 390) {
            const deny = await context.request.put(
              backend + "/api/v1/creator/portfolio",
              {
                headers: { authorization: authorization() },
                data: {
                  intent: "REMOVE",
                  itemId: data.items[0].id,
                  expectedRevision: data.currentRevision,
                  idempotencyKey: crypto.randomUUID(),
                },
              },
            );
            assert.equal(deny.status(), 403);
            output.assistantMutation = 403;
          }
          if (state === "empty" && role === "OWNER" && width === 390) {
            const cross = await context.request.put(
              backend + "/api/v1/creator/portfolio",
              {
                headers: { authorization: authorization() },
                data: {
                  intent: "REMOVE",
                  itemId: mainIDs[0],
                  expectedRevision: data.currentRevision,
                  idempotencyKey: crypto.randomUUID(),
                },
              },
            );
            assert.equal(cross.status(), 404);
            output.tenantIsolation = {
              foreignItemMutation: 404,
              foreignItemsVisible: 0,
            };
          }
        } finally {
          await context.close();
        }
        console.log(
          JSON.stringify({
            gate: "PORTFOLIO_BROWSER_CASE",
            state,
            role,
            width,
            result: "PASS",
          }),
        );
      }
  // Explicit test-only malformed-response and delay fixtures exercise defensive states;
  // actual authentication, request and normal recovery response still use production API.
  for (const width of [390, 767, 768, 1440])
    for (const role of ["OWNER", "MANAGER", "ASSISTANT"]) {
      checkpoint = `controlled:${role}:${width}`;
      const { context, page, counts } = await pageFor(
        "unavailable",
        role,
        width,
        900,
      );
      try {
        let release;
        const held = new Promise((resolve) => {
          release = resolve;
        });
        let captured;
        await page.route(
          "**/api/v1/creator/portfolio?filter=ALL",
          async (route) => {
            const actual = await route.fetch();
            captured = actual;
            await held;
            await route.fulfill({ response: actual });
          },
        );
        await filter(page, "Instagram");
        const request = page
          .getByRole("button", { name: "All", exact: true })
          .click();
        await page.getByText("Loading Portfolio…", { exact: true }).waitFor();
        output.controlledFailures.push({
          ...(await inspect(page, counts, "loading", role, width)),
          fixture: "Delayed actual production GET response",
        });
        release();
        await request;
        await page
          .getByRole("heading", { name: "Your work", exact: true })
          .waitFor();
        assert.equal(captured.status(), 200);
        await page.unroute("**/api/v1/creator/portfolio?filter=ALL");
        await page.route("**/api/v1/creator/portfolio?filter=ALL", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ contractVersion: "malformed-test-only" }),
          }),
        );
        await filter(page, "Instagram");
        await page.getByRole("button", { name: "All", exact: true }).click();
        await page
          .getByText("Portfolio unavailable", { exact: true })
          .waitFor();
        output.controlledFailures.push({
          ...(await inspect(page, counts, "first-error", role, width)),
          fixture:
            "Test-only malformed HTTP200 body; strict parser failure, not a production payload",
        });
        await page.unroute("**/api/v1/creator/portfolio?filter=ALL");
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Your work", exact: true })
          .waitFor();
        const before = await page.locator(".creator-portfolio__item").count();
        await page.route("**/api/v1/creator/portfolio?filter=ALL", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ contractVersion: "malformed-test-only" }),
          }),
        );
        await page
          .getByRole("button", { name: "Retry saved-work view", exact: true })
          .click();
        await page
          .getByText("Last confirmed work is shown", { exact: true })
          .waitFor();
        assert.equal(
          await page.locator(".creator-portfolio__item").count(),
          before,
        );
        output.controlledFailures.push({
          ...(await inspect(page, counts, "last-good-error", role, width)),
          fixture:
            "Read-only saved-work retry with test-only parser failure; last confirmed work retained for every role",
        });
        await page.unroute("**/api/v1/creator/portfolio?filter=ALL");
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .click();
        await page.waitForFunction(
          (expected) =>
            document.querySelectorAll(".creator-portfolio__item").length ===
            expected,
          before,
        );
      } finally {
        await context.close();
      }
    }
  const anonymous = await browser.newContext();
  const p = await anonymous.newPage();
  await anonymous.route("**/*", (route) =>
    ["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.fulfill({ status: 200, contentType: "text/css", body: "" }),
  );
  await p.goto(frontend + "/creator/portfolio");
  await p.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  assert.equal(await p.locator(".creator-portfolio__item").count(), 0);
  output.anonymous = "AUTH_REDIRECT_NO_PRIVATE_ITEMS";
  await anonymous.close();
  assert.equal(output.matrix.length, 84);
  await writeFile(
    resolve(evidence, "browser-matrix.json"),
    JSON.stringify(output, null, 2),
  );
  console.log(
    JSON.stringify({
      gate: "PORTFOLIO_P4_BROWSER_MATRIX",
      cases: output.matrix.length,
      dialogs: output.dialogs.length,
      controlledStates: output.controlledFailures.length,
      axeAllSeverities: 0,
      consoleErrors: 0,
      pageErrors: 0,
      externalTraffic: 0,
      result: "PASS",
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      gate: "PORTFOLIO_BROWSER_MANDATORY_GATE_FAILED",
      checkpoint,
      diagnostic:
        error instanceof Error
          ? error.message.split("\n")[0]
          : "Unknown failure",
    }),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log("Portfolio browser process/contexts cleanup COMPLETE");
}
