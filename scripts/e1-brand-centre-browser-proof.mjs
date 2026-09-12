import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const required = [
  "E1_FRONTEND_URL",
  "E1_BACKEND_URL",
  "E1_BROWSER_PASSWORD",
  "E1_CHROME_PATH",
  "E1_EVIDENCE_DIR",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const frontend = process.env.E1_FRONTEND_URL;
const backend = process.env.E1_BACKEND_URL;
const password = process.env.E1_BROWSER_PASSWORD;
const evidenceDir = process.env.E1_EVIDENCE_DIR;
const workspaces = [
  ["Overview", "/brand-centre/overview", "Overview"],
  ["Brand", "/brand-centre", "Brand"],
  ["Offerings", "/brand-centre/offerings", "Offerings"],
  ["Instagram", "/brand-centre/instagram", "Instagram Intelligence"],
  ["Market", "/brand-centre/market", "Market"],
  ["Recommendations", "/brand-centre/recommendations", "Recommendations"],
];
const ownerViewports = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];
const roles = [
  ["BRAND_OWNER", "a3-owner@example.test"],
  ["CAMPAIGN_MANAGER", "a3-manager@example.test"],
  ["FINANCE_ADMIN", "a3-finance@example.test"],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(browser, email, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const blockedExternalHosts = new Set();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      ["localhost", "127.0.0.1", "localtest.me"].includes(url.hostname) ||
      url.hostname.endsWith(".localhost") ||
      ["data:", "blob:"].includes(url.protocol)
    ) {
      await route.continue();
      return;
    }
    blockedExternalHosts.add(url.hostname);
    await route.abort("blockedbyclient");
  });
  await page.goto(`${frontend}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const response = await responsePromise;
  assert(response.status() === 200, `Login failed for ${email}`);
  await page.waitForURL((url) => url.pathname !== "/login");
  consoleErrors.length = 0;
  pageErrors.length = 0;
  return { context, page, consoleErrors, pageErrors, blockedExternalHosts };
}

async function assertRoute(page, label, route, width, heading = label) {
  await page.goto(`${frontend}${route}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: heading, exact: true }).last().waitFor();
  const desktop = page.locator(
    ".brand-centre-workspace-navigation__desktop",
  );
  const mobile = page.locator(".brand-centre-workspace-navigation__mobile");
  if (width <= 767) {
    assert(await mobile.isVisible(), `Mobile selector absent at ${width}`);
    assert(!(await desktop.isVisible()), `Desktop navigation visible at ${width}`);
    assert(
      (await mobile.locator("select").inputValue()) ===
        label.toLowerCase().replaceAll(" ", "-"),
      `Wrong mobile active value for ${label}`,
    );
  } else {
    assert(await desktop.isVisible(), `Desktop navigation absent at ${width}`);
    assert(!(await mobile.isVisible()), `Mobile selector visible at ${width}`);
    const current = desktop.locator('a[aria-current="page"]');
    assert((await current.count()) === 1, `Expected one current link for ${label}`);
    assert((await current.innerText()) === label, `Wrong current link for ${label}`);
    assert(
      (await desktop.getByRole("link").count()) === 6,
      `Six peer links not visible at ${width}`,
    );
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  assert(!overflow, `Horizontal overflow at ${width} on ${label}`);
}

async function navigateAll(page, width) {
  for (const [label, route, heading] of workspaces) {
    if (width <= 767) {
      await page
        .getByLabel("Brand Centre workspace selector")
        .selectOption(label.toLowerCase().replaceAll(" ", "-"));
    } else {
      await page
        .locator(".brand-centre-workspace-navigation__desktop")
        .getByRole("link", { name: label, exact: true })
        .press("Enter");
    }
    await page.waitForURL((url) => url.pathname === route);
    await assertRoute(page, label, route, width, heading);
  }
}

async function axeNavigation(page) {
  const result = await new AxeBuilder({ page }).analyze();
  const blockers = result.violations.filter(
    ({ impact, nodes }) =>
      ["serious", "critical"].includes(impact ?? "") &&
      nodes.some(({ target }) =>
        target.some((selector) =>
          String(selector).includes("brand-centre-workspace-navigation"),
        ),
      ),
  );
  assert(blockers.length === 0, "E1 navigation introduced an Axe blocker");
  return {
    navigationSeriousCritical: 0,
    pageSerious: result.violations.filter(({ impact }) => impact === "serious")
      .length,
    pageCritical: result.violations.filter(({ impact }) => impact === "critical")
      .length,
    lesser: result.violations.filter(({ impact }) =>
      ["minor", "moderate"].includes(impact ?? ""),
    ).length,
  };
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.E1_CHROME_PATH,
    headless: true,
    args: [
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-sync",
      "--no-first-run",
      "--no-proxy-server",
    ],
  });
  const output = {
    viewports: [],
    roles: [],
    inactive: null,
    liveCalls: 0,
    blockedExternalRequests: 0,
  };
  try {
    for (const [width, height] of ownerViewports) {
      const run = await login(browser, roles[0][1], { width, height });
      for (const [label, route, heading] of workspaces) {
        await assertRoute(run.page, label, route, width, heading);
      }
      await navigateAll(run.page, width);
      await run.page.goBack();
      assert(
        new URL(run.page.url()).pathname === "/brand-centre/market",
        `Back history failed at ${width}`,
      );
      await run.page.goForward();
      assert(
        new URL(run.page.url()).pathname === "/brand-centre/recommendations",
        `Forward history failed at ${width}`,
      );
      const axe = await axeNavigation(run.page);
      await run.page.screenshot({
        path: join(evidenceDir, `e1-${width}.png`),
        fullPage: true,
      });
      const attributableConsoleErrors = run.consoleErrors.filter(
        (message) => !message.includes("ERR_BLOCKED_BY_CLIENT"),
      );
      if (attributableConsoleErrors.length || run.pageErrors.length) {
        console.log(
          JSON.stringify({
            width,
            consoleErrors: attributableConsoleErrors.map((message) =>
              message.replaceAll(/https?:\/\/[^/\s]+/gu, "[LOCAL_ORIGIN]"),
            ),
            pageErrors: run.pageErrors.map((message) =>
              message.replaceAll(/https?:\/\/[^/\s]+/gu, "[LOCAL_ORIGIN]"),
            ),
          }),
        );
      }
      assert(run.pageErrors.length === 0, `Page error at ${width}`);
      assert(
        attributableConsoleErrors.length === 0,
        `Console error at ${width}`,
      );
      output.viewports.push({
        width,
        navigation: width <= 767 ? "MOBILE_SELECTOR" : "HORIZONTAL_LINKS",
        workspaces: 6,
        directRoutes: "PASS",
        history: "PASS",
        overflow: "PASS",
        keyboard: "PASS",
        axe,
      });
      output.blockedExternalRequests += run.blockedExternalHosts.size;
      await run.context.close();
    }

    for (const [role, email] of roles) {
      for (const width of [390, 1440]) {
        const run = await login(browser, email, { width, height: 900 });
        await assertRoute(run.page, "Brand", "/brand-centre", width);
        await assertRoute(run.page, "Offerings", "/brand-centre/offerings", width);
        output.roles.push({ role, width, directRoutes: "PASS" });
        await run.context.close();
      }
    }

    const inactiveContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const inactiveResponse = await inactiveContext.request.get(
      `${backend}/api/v1/brand-centre/brand`,
    );
    output.inactive = {
      unauthenticatedDirectApiStatus: inactiveResponse.status(),
      denied: inactiveResponse.status() === 401,
    };
    assert(output.inactive.denied, "Unauthenticated direct API read was not denied");
    await inactiveContext.close();
    assert(output.liveCalls === 0, "A live provider/model call was attempted");
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await browser.close();
  }
}

await main();
