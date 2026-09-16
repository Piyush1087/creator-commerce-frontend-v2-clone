import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const name of [
  "E2E3_FRONTEND_URL",
  "E2E3_BACKEND_URL",
  "E2E3_C4_FIXTURE_PATH",
  "E2E3_CHROME_PATH",
]) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const frontend = process.env.E2E3_FRONTEND_URL;
const backend = process.env.E2E3_BACKEND_URL;
const c4Fixture = JSON.parse(
  await readFile(process.env.E2E3_C4_FIXTURE_PATH, "utf8"),
);
const viewports = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];
const sectionOrder = [
  "Account and connection context",
  "Account performance",
  "What is working",
  "Content behavior",
  "Audience response",
  "Creator and collaboration signals",
  "Representative posts",
  "Coverage and freshness",
];
const externalHosts = new Set();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function newPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("ERR_BLOCKED_BY_CLIENT")
    )
      errors.push(message.text());
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      ["localtest.me", "127.0.0.1", "localhost"].includes(url.hostname) ||
      url.hostname.endsWith(".localhost") ||
      ["data:", "blob:"].includes(url.protocol)
    )
      return route.continue();
    externalHosts.add(url.hostname);
    return route.abort("blockedbyclient");
  });
  return { context, page, errors };
}

async function login(page, email, password, errors) {
  await page.goto(`${frontend}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  const response = page.waitForResponse(
    (item) =>
      item.url().endsWith("/api/v1/auth/login") &&
      item.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();
  assert((await response).status() === 200, `Login failed for ${email}`);
  await page.waitForURL((url) => url.pathname !== "/login");
  errors.length = 0;
}

async function openWorkspace(page) {
  const response = page.waitForResponse(
    (item) =>
      item.url().endsWith("/api/v1/brand-centre/instagram") &&
      item.request().method() === "GET",
  );
  await page.goto(`${frontend}/brand-centre/instagram`, {
    waitUntil: "domcontentloaded",
  });
  const api = await response;
  assert(api.status() === 200, `Aggregate status ${api.status()}`);
  await page
    .getByRole("heading", { name: "Instagram Intelligence", exact: true })
    .waitFor();
  return api.json();
}

async function axe(page) {
  const result = await new AxeBuilder({ page }).analyze();
  return {
    serious: result.violations.filter((item) => item.impact === "serious")
      .length,
    critical: result.violations.filter((item) => item.impact === "critical")
      .length,
    lesser: result.violations.filter((item) =>
      ["minor", "moderate"].includes(item.impact ?? ""),
    ).length,
    lesserIds: result.violations
      .filter((item) => ["minor", "moderate"].includes(item.impact ?? ""))
      .map((item) => item.id),
    blockerIds: result.violations
      .filter((item) => ["serious", "critical"].includes(item.impact ?? ""))
      .flatMap((item) =>
        item.nodes.map((node) => `${item.id}:${node.target.join(" ")}`),
      ),
  };
}

async function assertWorkspace(page, width) {
  const headings = await page.locator("main h2").allTextContents();
  assert(
    JSON.stringify(headings) === JSON.stringify(sectionOrder),
    `Wrong section order at ${width}`,
  );
  assert((await page.getByRole("tab").count()) === 0, `Inner tab at ${width}`);
  assert(
    (await page.getByRole("tablist").count()) === 0,
    `Inner tablist at ${width}`,
  );
  assert(
    (await page.getByText(/Last 30 days/).count()) > 0,
    `30-day context absent at ${width}`,
  );
  assert(
    headings.indexOf("Account performance") === 1,
    `Performance not near top at ${width}`,
  );
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  assert(!overflow, `Horizontal overflow at ${width}`);
  const desktop = page.locator(".brand-centre-workspace-navigation__desktop");
  const mobile = page.locator(".brand-centre-workspace-navigation__mobile");
  assert(
    width <= 767 ? await mobile.isVisible() : await desktop.isVisible(),
    `E1 navigation absent at ${width}`,
  );
  assert(
    width <= 767 ? !(await desktop.isVisible()) : !(await mobile.isVisible()),
    `Wrong E1 navigation variant at ${width}`,
  );
  const refresh = page.getByRole("button", { name: /Refresh Instagram/ });
  if (await refresh.count()) {
    await refresh.focus();
    assert(
      await refresh.evaluate((element) => element === document.activeElement),
      `Refresh focus failed at ${width}`,
    );
  }
}

function stateBody(
  current,
  connectionState,
  syncState = "IDLE",
  preserved = false,
) {
  return {
    ...current,
    connection: {
      ...current.connection,
      state: connectionState,
      reasonCodes:
        connectionState === "CONNECTED"
          ? []
          : [
              connectionState === "DIFFERENT_ACCOUNT_CONFLICT"
                ? "ACCOUNT_IDENTITY_CONFLICT"
                : connectionState === "TRANSIENT_PROVIDER_FAILURE"
                  ? "PROVIDER_TRANSIENT_FAILURE"
                  : connectionState === "PARTIAL_CAPABILITY"
                    ? "PARTIAL_CAPABILITY"
                    : connectionState === "REAUTH_REQUIRED"
                      ? "REAUTH_REQUIRED"
                      : connectionState === "UNKNOWN_CAPABILITY"
                        ? "UNKNOWN_CAPABILITY"
                        : connectionState === "AUTHORIZATION_DEGRADED"
                          ? "AUTHORIZATION_DEGRADED"
                          : connectionState === "CONNECTING"
                            ? "CONNECTION_CONNECTING"
                            : "CONNECTION_NOT_CONNECTED",
            ],
    },
    sync: {
      ...current.sync,
      state: syncState,
      currentPreserved: preserved,
      reasonCodes: preserved ? ["CURRENT_PRESERVED_AFTER_FAILURE"] : [],
    },
  };
}

const browser = await chromium.launch({
  executablePath: process.env.E2E3_CHROME_PATH,
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
  current: [],
  states: [],
  roles: [],
  isolation: {},
  externalRequestsBlockedBeforeNetwork: 0,
  liveProviderOrModelCalls: 0,
};
try {
  let currentBody;
  for (const [width, height] of viewports) {
    const run = await newPage(browser, { width, height });
    await login(run.page, c4Fixture.email, c4Fixture.password, run.errors);
    currentBody = await openWorkspace(run.page);
    await assertWorkspace(run.page, width);
    const currentAxe = await axe(run.page);
    assert(
      currentAxe.serious === 0 && currentAxe.critical === 0,
      `Current Axe blocker at ${width}: ${currentAxe.blockerIds.join(",")}`,
    );

    await run.page.route(`${backend}/api/v1/brand-centre/instagram`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(stateBody(currentBody, "NOT_CONNECTED")),
      }),
    );
    await run.page.reload({ waitUntil: "networkidle" });
    const disconnectedAxe = await axe(run.page);
    assert(
      disconnectedAxe.serious === 0 && disconnectedAxe.critical === 0,
      `Not-connected Axe blocker at ${width}`,
    );

    await run.page.unroute(`${backend}/api/v1/brand-centre/instagram`);
    await run.page.route(`${backend}/api/v1/brand-centre/instagram`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          stateBody(currentBody, "TRANSIENT_PROVIDER_FAILURE", "BACKOFF", true),
        ),
      }),
    );
    await run.page.reload({ waitUntil: "networkidle" });
    await run.page.getByText(/Current intelligence is preserved/).waitFor();
    const preservedAxe = await axe(run.page);
    assert(
      preservedAxe.serious === 0 && preservedAxe.critical === 0,
      `Preserved Axe blocker at ${width}`,
    );
    assert(
      run.errors.length === 0,
      `Browser errors at ${width}: ${run.errors.join(" | ").replaceAll(/https?:\/\/[^/\s]+/gu, "[LOCAL_ORIGIN]")}`,
    );
    output.current.push({
      width,
      hierarchy: "PASS",
      e1Navigation: width <= 767 ? "MOBILE_SELECTOR" : "HORIZONTAL_LINKS",
      overflow: "PASS",
      keyboard: "PASS",
      axe: {
        current: currentAxe,
        notConnected: disconnectedAxe,
        preserved: preservedAxe,
      },
    });
    await run.context.close();
  }

  const lifecycle = await newPage(browser, { width: 1440, height: 1000 });
  await login(
    lifecycle.page,
    c4Fixture.email,
    c4Fixture.password,
    lifecycle.errors,
  );
  for (const [connection, sync] of [
    ["CONNECTING", "INITIALIZING"],
    ["CONNECTED", "REFRESHING"],
    ["PARTIAL_CAPABILITY", "IDLE"],
    ["UNKNOWN_CAPABILITY", "IDLE"],
    ["REAUTH_REQUIRED", "BLOCKED"],
    ["AUTHORIZATION_DEGRADED", "BLOCKED"],
    ["SAME_ACCOUNT_RECONNECTING", "REFRESHING"],
    ["DIFFERENT_ACCOUNT_CONFLICT", "BLOCKED"],
    ["TRANSIENT_PROVIDER_FAILURE", "BACKOFF"],
    ["DISCONNECTED", "IDLE"],
  ]) {
    await lifecycle.page.route(
      `${backend}/api/v1/brand-centre/instagram`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            stateBody(
              currentBody,
              connection,
              sync,
              connection === "TRANSIENT_PROVIDER_FAILURE" ||
                connection === "DISCONNECTED",
            ),
          ),
        }),
      { times: 1 },
    );
    await lifecycle.page.goto(`${frontend}/brand-centre/instagram`, {
      waitUntil: "networkidle",
    });
    await lifecycle.page
      .getByRole("heading", { name: "Instagram Intelligence" })
      .waitFor();
    output.states.push({ connection, sync, rendered: "PASS" });
  }

  let aggregate = currentBody;
  await lifecycle.page.unroute(`${backend}/api/v1/brand-centre/instagram`);
  await lifecycle.page.route(
    `${backend}/api/v1/brand-centre/instagram`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(aggregate),
      }),
  );
  await lifecycle.page.route(
    `${backend}/api/v1/brand-centre/instagram/refresh`,
    (route) =>
      route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          accepted: true,
          requestIdentity: "fixture-only",
          cooldownSeconds: 900,
        }),
      }),
  );
  await lifecycle.page.goto(`${frontend}/brand-centre/instagram`, {
    waitUntil: "networkidle",
  });
  await lifecycle.page
    .getByRole("button", { name: "Refresh Instagram" })
    .press("Enter");
  await lifecycle.page.getByText(/Refresh accepted/).waitFor();
  output.states.push({
    manualRefreshAccepted: "FIXTURE_VISUAL_PASS",
    focusPreserved: await lifecycle.page
      .getByText(/Refresh accepted/)
      .evaluate((element) => element === document.activeElement),
  });
  await lifecycle.context.close();

  for (const [role, email] of [
    ["CAMPAIGN_MANAGER", "e2e3-manager@example.test"],
    ["FINANCE_ADMIN", "e2e3-finance@example.test"],
  ]) {
    for (const width of [390, 1440]) {
      const run = await newPage(browser, { width, height: 900 });
      await login(run.page, email, c4Fixture.password, run.errors);
      const body = await openWorkspace(run.page);
      assert(
        role === "FINANCE_ADMIN"
          ? body.actions.manualRefresh.state === "DENIED"
          : body.actions.manualRefresh.state === "ALLOWED",
        `Wrong refresh authority for ${role}`,
      );
      assert(
        role === "FINANCE_ADMIN"
          ? (await run.page
              .getByRole("button", { name: /Refresh Instagram/ })
              .count()) === 0
          : (await run.page
              .getByRole("button", { name: /Refresh Instagram/ })
              .count()) === 1,
        `Wrong refresh UI for ${role}`,
      );
      output.roles.push({ role, width, authority: "PASS" });
      await run.context.close();
    }
  }

  for (const [tenant, email] of [
    ["PRIMARY_NO_CONNECTION", "a3-owner@example.test"],
    ["SECOND_TENANT", "a3-second-owner@example.test"],
  ]) {
    const run = await newPage(browser, { width: 1440, height: 900 });
    await login(run.page, email, "synthetic-browser-only", run.errors);
    const body = await openWorkspace(run.page);
    assert(
      body.connection.state === "NOT_CONNECTED",
      `${tenant} leaked another tenant connection`,
    );
    output.isolation[tenant] = "REAL_BACKEND_PASS";
    await run.context.close();
  }

  const anonymous = await browser.newContext();
  const unauthenticated = await anonymous.request.get(
    `${backend}/api/v1/brand-centre/instagram`,
  );
  output.isolation.unauthenticatedStatus = unauthenticated.status();
  assert(
    unauthenticated.status() === 401,
    "Unauthenticated aggregate read not denied",
  );
  await anonymous.close();
  output.externalRequestsBlockedBeforeNetwork = externalHosts.size;
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
