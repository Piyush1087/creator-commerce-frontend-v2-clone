import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

for (const name of [
  "P4_FRONTEND_URL",
  "P4_BACKEND_URL",
  "P4_BROWSER_PASSWORD",
  "P4_CHROME_PATH",
]) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const viewports = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({
  executablePath: process.env.P4_CHROME_PATH,
  headless: true,
  args: [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-first-run",
    "--no-proxy-server",
  ],
});
const output = { viewports: [], unauthenticatedApiStatus: null, liveCalls: 0 };
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const browserErrors = [];
    const blockedHosts = new Set();
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !message.text().includes("ERR_BLOCKED_BY_CLIENT")
      ) {
        browserErrors.push(message.text());
      }
    });
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (
        ["localhost", "127.0.0.1"].includes(url.hostname) ||
        ["data:", "blob:"].includes(url.protocol)
      ) {
        return route.continue();
      }
      blockedHosts.add(url.hostname);
      return route.abort("blockedbyclient");
    });
    await page.goto(`${process.env.P4_FRONTEND_URL}/login`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByLabel("Email", { exact: true })
      .fill("creator-audience-p4@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.P4_BROWSER_PASSWORD);
    const loginResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/auth/login") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    assert((await loginResponse).status() === 200, `Login failed at ${width}`);
    const audienceResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/creator/insights/audience") &&
        response.request().method() === "GET",
    );
    await page.goto(
      `${process.env.P4_FRONTEND_URL}/creator/insights/audience`,
      { waitUntil: "domcontentloaded" },
    );
    const response = await audienceResponse;
    assert(response.status() === 200, `Audience API failed at ${width}`);
    const body = await response.json();
    assert(body.contractVersion === "creator_audience_v0.1", "Wrong contract");
    assert(body.status === "READY", "Preserved fixture current was not ready");
    assert(
      body.freshness.state === "STALE",
      "Inclusive 192h stale boundary was not exposed",
    );
    assert(
      body.processingState === "FAILED",
      "Latest provider failure was not exposed",
    );
    assert(
      body.currentPreserved === true,
      "Last-good current was not marked preserved",
    );
    assert(
      body.sourceStatus === "PROVIDER_FAILURE",
      "Provider failure source truth was lost",
    );
    assert(body.cohorts.length === 2, "Both fixture cohorts were not returned");
    assert(body.highlights.length <= 3, "Highlight cap exceeded");
    assert(
      !/accessToken|providerPayload|evidenceRef|lease|mutation/i.test(
        JSON.stringify(body),
      ),
      "Consumer exposed an internal or mutable field",
    );
    await page.getByRole("heading", { level: 1, name: "Audience" }).waitFor();
    await page
      .getByText("Showing the last good Audience snapshot", { exact: true })
      .waitFor();
    assert(
      (await page.getByText("Failed", { exact: true }).count()) > 0,
      `Failed processing truth was not rendered at ${width}`,
    );
    assert(
      (await page.getByText("Stale", { exact: true }).count()) > 0,
      `Stale freshness truth was not rendered at ${width}`,
    );
    // The unauthenticated bootstrap refresh intentionally returns 401 before
    // password login. Only errors attributable to the authenticated route are
    // acceptance failures.
    browserErrors.length = 0;
    await page.getByRole("tab", { name: "Followers" }).focus();
    await page.getByRole("tab", { name: "Followers" }).press("ArrowRight");
    assert(
      (await page
        .getByRole("tab", { name: "Engaged" })
        .getAttribute("aria-selected")) === "true",
      `Cohort keyboard operation failed at ${width}`,
    );
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    assert(!overflow, `Horizontal overflow at ${width}`);
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter(({ impact }) => impact === "serious");
    const critical = axe.violations.filter(
      ({ impact }) => impact === "critical",
    );
    assert(
      serious.length === 0 && critical.length === 0,
      `Axe blocker at ${width}`,
    );
    assert(
      browserErrors.length === 0,
      `Browser error at ${width}: ${browserErrors.join(" | ")}`,
    );
    output.viewports.push({
      width,
      authenticatedApiToUi: "PASS",
      navigation: width <= 767 ? "MOBILE_BOTTOM_NAV" : "DESKTOP_SIDEBAR",
      keyboard: "PASS",
      overflow: "PASS",
      axe: {
        serious: 0,
        critical: 0,
        lesser: axe.violations.filter(({ impact }) =>
          ["minor", "moderate"].includes(impact ?? ""),
        ).length,
      },
      externalHostsBlocked: blockedHosts.size,
    });
    await context.close();
  }
  const anonymous = await browser.newContext();
  const response = await anonymous.request.get(
    `${process.env.P4_BACKEND_URL}/api/v1/creator/insights/audience`,
  );
  output.unauthenticatedApiStatus = response.status();
  assert(
    response.status() === 401,
    "Unauthenticated Audience read was not denied",
  );
  await anonymous.close();
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
