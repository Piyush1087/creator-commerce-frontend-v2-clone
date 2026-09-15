import "dotenv/config";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const frontend = "http://localhost:43491";
const backend = "http://localhost:33491";
const password = process.env.CREATOR_AUDIENCE_V1_FIXTURE_PASSWORD;
const executablePath = process.env.P4_BROWSER_PATH;
const evidenceDir = resolve(process.env.P4_EVIDENCE_DIR ?? "");
assert.ok(password && executablePath && process.env.P4_EVIDENCE_DIR);
assert.equal(new URL(process.env.VITE_API_URL).origin, backend);
await mkdir(evidenceDir, { recursive: true });
const widths = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];
const fixtures = [
  ["owner", "OWNER", "READY"],
  ["manager", "MANAGER", "READY"],
  ["assistant", "ASSISTANT", "READY"],
  ["partial", "OWNER", "PARTIAL"],
  ["empty", "OWNER", "UNAVAILABLE"],
  ["stale", "OWNER", "READY"],
  ["preserved", "OWNER", "READY"],
  ["processing", "OWNER", "UNAVAILABLE"],
  ["disconnected", "OWNER", "READY"],
  ["capability", "OWNER", "UNAVAILABLE"],
];
const browser = await chromium.launch({
  executablePath,
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
  anonymous: null,
  inactive: null,
  externalTraffic: 0,
  offlineFontFixture:
    "Inherited font CSS locally fulfilled; declared fallback fonts, zero outbound requests",
};
async function loggedInPage(fixture, width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const failures = { console: [], page: [], external: [], offlineFonts: 0 };
  let authenticatedAudience = false;
  page.on("console", (message) => {
    if (authenticatedAudience && message.type() === "error")
      failures.console.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (authenticatedAudience) failures.page.push(error.message);
  });
  await context.route("**/*", async (route) => {
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
      failures.offlineFonts++;
      return route.fulfill({
        status: 200,
        contentType: "text/css",
        body: "/* Offline acceptance fixture: use unchanged declared fallback fonts. */",
      });
    }
    failures.external.push(url.hostname);
    return route.abort("blockedbyclient");
  });
  await page.goto(frontend + "/login", { waitUntil: "domcontentloaded" });
  await page
    .getByLabel("Email", { exact: true })
    .fill("audience-v1-p4-" + fixture + "@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  const login = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  assert.equal((await login).status(), 200, "Real password login failed");
  // Startup refresh before login is intentionally unauthenticated. No error is
  // filtered or cleared after the authenticated Audience navigation begins.
  authenticatedAudience = true;
  const api = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/creator/insights/audience") &&
      response.request().method() === "GET",
  );
  await page.goto(frontend + "/creator/insights/audience", {
    waitUntil: "domcontentloaded",
  });
  const response = await api;
  assert.equal(response.status(), 200, "Real Audience API failed");
  const data = await response.json();
  await page
    .getByRole("heading", { level: 1, name: "Audience", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { level: 2, name: "Overview", exact: true })
    .waitFor();
  return { context, page, failures, data };
}
try {
  for (const [width, height] of widths) {
    for (const [fixture, role, status] of fixtures) {
      const { context, page, failures, data } = await loggedInPage(
        fixture,
        width,
        height,
      );
      try {
        assert.equal(data.contractVersion, "creator_audience_v1.1");
        assert.equal(data.context.role, role);
        assert.equal(data.status, status);
        const allTabs = page.getByRole("tab");
        if ((await allTabs.count()) === 2) {
          await page
            .getByRole("tab", { name: "Followers", exact: true })
            .focus();
          await page
            .getByRole("tab", { name: "Followers", exact: true })
            .press("End");
          await page
            .getByRole("tab", { name: "Engaged", exact: true })
            .waitFor();
          assert.equal(
            await page
              .getByRole("tab", { name: "Engaged", exact: true })
              .getAttribute("aria-selected"),
            "true",
          );
          await page
            .getByRole("tab", { name: "Engaged", exact: true })
            .press("Home");
        }
        const navLink = page.locator(".creator-insights-nav a").first();
        const navigation = (await navLink.count())
          ? navLink
          : page.getByRole("link", { name: "Content", exact: true }).first();
        await navigation.focus();
        assert.ok(
          await navigation.evaluate(
            (element) => document.activeElement === element,
          ),
          "Navigation is not keyboard reachable",
        );
        await navigation.press("Tab");
        assert.ok(
          await page.evaluate(() => document.activeElement !== document.body),
          "Navigation Tab lost focus",
        );
        const menu = page.getByRole("button", {
          name: "Open Menu",
          exact: true,
        });
        if (await menu.isVisible()) {
          await menu.focus();
          await menu.press("Enter");
          const dialog = page.getByRole("dialog", {
            name: "Application navigation",
            exact: true,
          });
          await dialog.waitFor();
          const close = page.getByRole("button", {
            name: "Close menu",
            exact: true,
          });
          assert.ok(
            await close.evaluate(
              (element) => document.activeElement === element,
            ),
            "Menu did not receive focus",
          );
          await close.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          assert.ok(
            await menu.evaluate(
              (element) => document.activeElement === element,
            ),
            "Menu did not return focus",
          );
        }
        if (["owner", "manager", "assistant"].includes(fixture)) {
          assert.equal(data.overview.accountFollowerCount, 1000);
          assert.equal(data.profiles.length, 2);
          assert.equal(data.change.state, "AVAILABLE");
          assert.ok(data.contentContext.length > 0);
          const headings = await page
            .getByRole("heading", { level: 2 })
            .allTextContents();
          assert.deepEqual(headings, [
            "Overview",
            "Audience Highlights",
            "Audience Profiles",
            "Audience & Content Context",
            "Change Over Time",
            "Data status & limitations",
          ]);
          const tab = page.getByRole("tab", { name: "Followers", exact: true });
          await tab.focus();
          const focus = await tab.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              active: document.activeElement === element,
              outline: style.outlineStyle,
              shadow: style.boxShadow,
            };
          });
          assert.ok(
            focus.active &&
              (focus.outline !== "none" || focus.shadow !== "none"),
            "Visible focus missing",
          );
          await tab.press("ArrowRight");
          await page
            .getByRole("tab", { name: "Engaged", exact: true })
            .evaluate((element) => {
              if (
                document.activeElement !== element ||
                element.getAttribute("aria-selected") !== "true"
              )
                throw new Error("Cohort keyboard/focus return failed");
            });
          await page
            .getByRole("tab", { name: "Engaged", exact: true })
            .press("Home");
          // At desktop the cohort switch can be the final focusable control.
          // Forward Tab may legitimately leave the document for browser chrome.
          // Shift+Tab proves return to the preceding in-page navigation.
          await page
            .getByRole("tab", { name: "Followers", exact: true })
            .press("Shift+Tab");
          assert.ok(
            await page.evaluate(() => document.activeElement !== document.body),
            "Keyboard navigation lost focus",
          );
        }
        if (fixture === "empty") {
          assert.equal(data.overview.accountFollowerCount, null);
          assert.equal(data.change.state, "NOT_PROCESSED");
          assert.equal(await page.getByRole("tab").count(), 0);
          assert.equal(
            await page.getByText("Change Over Time", { exact: true }).count(),
            0,
          );
        }
        if (fixture === "stale") {
          assert.equal(data.freshness.state, "STALE");
          assert.equal(data.processingState, "FAILED");
          assert.equal(data.currentPreserved, true);
          assert.equal(
            await page
              .getByText("Audience & Content Context", { exact: true })
              .count(),
            0,
          );
        }
        if (["preserved", "disconnected"].includes(fixture)) {
          assert.equal(data.currentPreserved, true);
          await page
            .getByText("Showing the last good Audience snapshot", {
              exact: true,
            })
            .waitFor();
        }
        if (fixture === "processing")
          assert.equal(data.processingState, "PROCESSING");
        if (fixture === "disconnected")
          assert.equal(data.sourceStatus, "DISCONNECTED");
        if (fixture === "capability")
          assert.equal(data.sourceStatus, "CAPABILITY_UNKNOWN");
        assert.equal(
          await page
            .getByRole("button", { name: /refresh|generate|publish|confirm/i })
            .count(),
          0,
        );
        assert.ok(
          !(await page.evaluate(
            () =>
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
          )),
          "Horizontal overflow",
        );
        const axe = await new AxeBuilder({ page }).analyze();
        const violations = axe.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          selectors: nodes.map((node) => node.target),
        }));
        await writeFile(
          resolve(evidenceDir, fixture + "-" + width + "-axe.json"),
          JSON.stringify({ violations }, null, 2),
        );
        assert.equal(
          axe.violations.length,
          0,
          "Axe violations: " + JSON.stringify(violations),
        );
        assert.equal(
          failures.console.length,
          0,
          "Authenticated console errors: " + failures.console.join(" | "),
        );
        assert.equal(failures.page.length, 0, "Uncaught page errors");
        assert.equal(
          failures.external.length,
          0,
          "Prohibited external browser traffic",
        );
        await page.screenshot({
          path: resolve(evidenceDir, fixture + "-" + width + ".png"),
          fullPage: true,
        });
        const row = {
          fixture,
          role,
          width,
          status,
          apiToUi: "PASS",
          keyboard: "PASS",
          focus: "PASS",
          overflow: 0,
          axe: { serious: 0, critical: 0, lesser: 0 },
          consoleErrors: 0,
          pageErrors: 0,
          externalTraffic: 0,
          inheritedFontCssLocallyFulfilled: failures.offlineFonts,
        };
        output.matrix.push(row);
        console.log(JSON.stringify(row));
      } finally {
        await context.close();
      }
    }
  }
  const anonymous = await browser.newContext();
  const anonymousResponse = await anonymous.request.get(
    backend + "/api/v1/creator/insights/audience",
  );
  assert.equal(anonymousResponse.status(), 401);
  output.anonymous = 401;
  await anonymous.close();
  const inactiveContext = await browser.newContext();
  const login = await inactiveContext.request.post(
    backend + "/api/v1/auth/login",
    {
      data: {
        email: "audience-v1-p4-inactive@example.test",
        password,
      },
    },
  );
  assert.equal(login.status(), 200);
  const token = (await login.json()).accessToken;
  const denied = await inactiveContext.request.get(
    backend + "/api/v1/creator/insights/audience",
    { headers: { Authorization: "Bearer " + token } },
  );
  assert.equal(denied.status(), 403);
  output.inactive = 403;
  await inactiveContext.close();
  await writeFile(
    resolve(evidenceDir, "browser-matrix.json"),
    JSON.stringify(output, null, 2),
  );
  console.log(
    JSON.stringify({
      gate: "P4_BROWSER_MATRIX",
      result: "PASS",
      cases: output.matrix.length,
      anonymous: 401,
      inactive: 403,
      externalTraffic: 0,
    }),
  );
} finally {
  await browser.close();
}
