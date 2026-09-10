import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const FRONTEND_URL = process.env.A3_FRONTEND_URL;
const BACKEND_URL = process.env.A3_BACKEND_URL;
const PASSWORD = process.env.A3_BROWSER_PASSWORD;
const EVIDENCE_DIR = process.env.A3_EVIDENCE_DIR;
const CHROME_PATH = process.env.A3_CHROME_PATH;

for (const [name, value] of Object.entries({
  A3_FRONTEND_URL: FRONTEND_URL,
  A3_BACKEND_URL: BACKEND_URL,
  A3_BROWSER_PASSWORD: PASSWORD,
  A3_EVIDENCE_DIR: EVIDENCE_DIR,
  A3_CHROME_PATH: CHROME_PATH,
})) {
  if (!value) throw new Error(`${name} is required`);
}

const PRIMARY_BRAND_ID = "a3000000-0000-4000-8000-000000000002";
const SECONDARY_BRAND_ID = "a3000000-0000-4000-8000-000000000004";
const ROLE_FIXTURES = [
  { role: "BRAND_OWNER", email: "a3-owner@example.test" },
  { role: "CAMPAIGN_MANAGER", email: "a3-manager@example.test" },
  { role: "FINANCE_ADMIN", email: "a3-finance@example.test" },
];
const VIEWPORTS = [
  { label: "390", width: 390, height: 844 },
  { label: "767", width: 767, height: 900 },
  { label: "768", width: 768, height: 900 },
  { label: "desktop", width: 1440, height: 1000 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function loginAndEnterBrandCentre(browser, fixture, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const externalHosts = new Set();
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      ["127.0.0.1", "localhost", "localtest.me"].includes(url.hostname) ||
      url.protocol === "data:" ||
      url.protocol === "blob:"
    ) {
      await route.continue();
      return;
    }
    externalHosts.add(url.hostname);
    await route.abort("blockedbyclient");
  });

  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill(fixture.email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const loginResponse = await loginResponsePromise;
  assert(loginResponse.status() === 200, `${fixture.role} login failed`);
  const loginBody = await loginResponse.json();
  assert(loginBody.user?.role === "BRAND", `${fixture.role} is not a Brand actor`);
  assert(typeof loginBody.accessToken === "string", "Access token missing");

  const brandResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/brand-centre/brand") &&
      response.request().method() === "GET",
  );
  await page.evaluate(() => {
    window.history.pushState({}, "", "/brand-centre");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  const brandResponse = await brandResponsePromise;
  assert(brandResponse.status() === 200, `${fixture.role} Brand read failed`);
  const brandBody = await brandResponse.json();
  assert(
    brandBody.brandId === PRIMARY_BRAND_ID,
    `${fixture.role} resolved outside the authorized Brand`,
  );
  assert(
    brandBody.brandId !== SECONDARY_BRAND_ID,
    `${fixture.role} read the second tenant`,
  );

  const overrideResponse = await context.request.get(
    `${BACKEND_URL}/api/v1/brand-centre/brand?brandProfileId=${SECONDARY_BRAND_ID}`,
    {
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`,
        "X-Brand-Profile-Id": SECONDARY_BRAND_ID,
      },
    },
  );
  assert(overrideResponse.status() === 200, "Tenant override probe failed");
  const overrideBody = await overrideResponse.json();
  assert(
    overrideBody.brandId === PRIMARY_BRAND_ID,
    `${fixture.role} supplied a cross-tenant Brand selector`,
  );

  await page.getByRole("heading", { name: "Brand", exact: true }).waitFor();
  assert(
    (await page.getByText("Could not load Brand information").count()) === 0,
    "Authenticated Brand projection was rejected by the frontend contract",
  );
  assert(
    ![...externalHosts].some((host) =>
      /(^|\.)(instagram\.com|facebook\.com|fbcdn\.net|meta\.com)$/iu.test(host),
    ),
    "A Meta/Instagram network request was attempted",
  );

  return { context, page, externalHosts };
}

async function keyboardAndStructure(page, width) {
  const navigationLinks = await page.locator("nav a:visible").count();
  assert(navigationLinks > 0, "No usable visible navigation links");

  const headingLevels = await page
    .locator("h1:visible, h2:visible, h3:visible, h4:visible, h5:visible, h6:visible")
    .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
  assert(headingLevels.length > 0, "No visible heading structure");
  assert(headingLevels[0] === 1, "Visible heading order does not start at h1");
  for (let index = 1; index < headingLevels.length; index += 1) {
    assert(
      headingLevels[index] <= headingLevels[index - 1] + 1,
      "Visible heading order skips a level",
    );
  }

  await page.locator("body").click({ position: { x: 1, y: 1 } });
  let focusProof = null;
  for (let index = 0; index < 24; index += 1) {
    await page.keyboard.press("Tab");
    focusProof = await page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || active === document.body) return null;
      const style = getComputedStyle(active);
      const visible = Boolean(active.offsetWidth || active.offsetHeight);
      const focusVisible =
        (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== "none";
      return { visible, focusVisible, tag: active.tagName };
    });
    if (focusProof?.visible && focusProof.focusVisible) break;
  }
  assert(focusProof?.visible, "Keyboard navigation did not reach a visible control");
  assert(focusProof?.focusVisible, "Focused control has no visible focus indication");

  let focusReturn = "NOT_PRESENT";
  if (width <= 767) {
    const trigger = page.getByRole("button", { name: "Open Menu" });
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Application navigation" });
    await dialog.waitFor({ state: "visible" });
    assert(
      await page.getByRole("button", { name: "Close menu" }).evaluate(
        (node) => document.activeElement === node,
      ),
      "Mobile dialog did not receive focus",
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert(
      await trigger.evaluate((node) => document.activeElement === node),
      "Mobile dialog did not return focus to its trigger",
    );
    focusReturn = "PASS";
  }

  return { navigationLinks, headingLevels, focusReturn };
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-sync",
      "--metrics-recording-only",
      "--no-first-run",
      "--no-proxy-server",
    ],
  });
  const result = {
    roles: [],
    viewports: [],
    providerCalls: 0,
    credentials: "SYNTHETIC_NOT_REPORTED",
  };
  try {
    for (const fixture of ROLE_FIXTURES) {
      const { context, page, externalHosts } = await loginAndEnterBrandCentre(
        browser,
        fixture,
        { width: 1440, height: 1000 },
      );
      result.roles.push({
        role: fixture.role,
        authenticatedBrandContext: "PRIMARY_ONLY",
        suppliedSecondTenantSelector: "IGNORED",
      });
      result.providerCalls += [...externalHosts].filter((host) =>
        /instagram|facebook|fbcdn|meta/iu.test(host),
      ).length;
      await context.close();
    }

    for (const viewport of VIEWPORTS) {
      const { context, page, externalHosts } = await loginAndEnterBrandCentre(
        browser,
        ROLE_FIXTURES[0],
        { width: viewport.width, height: viewport.height },
      );
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      assert(
        overflow.scrollWidth <= overflow.clientWidth,
        `Horizontal overflow at ${viewport.label}`,
      );
      const keyboard = await keyboardAndStructure(page, viewport.width);
      const axe = await new AxeBuilder({ page }).analyze();
      const serious = axe.violations.filter((item) => item.impact === "serious");
      const critical = axe.violations.filter((item) => item.impact === "critical");
      assert(serious.length === 0, `Serious Axe violations at ${viewport.label}`);
      assert(critical.length === 0, `Critical Axe violations at ${viewport.label}`);
      const lesser = Object.fromEntries(
        ["minor", "moderate"].map((impact) => [
          impact,
          axe.violations.filter((item) => item.impact === impact).length,
        ]),
      );
      const screenshot = join(EVIDENCE_DIR, `brand-centre-${viewport.label}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      result.viewports.push({
        width: viewport.width,
        label: viewport.label,
        overflow: "PASS",
        keyboard: "PASS",
        focusReturn: keyboard.focusReturn,
        visibleNavigationLinks: keyboard.navigationLinks,
        headingLevels: keyboard.headingLevels,
        axe: { serious: 0, critical: 0, lesser },
        screenshot: `brand-centre-${viewport.label}.png`,
      });
      result.providerCalls += [...externalHosts].filter((host) =>
        /instagram|facebook|fbcdn|meta/iu.test(host),
      ).length;
      await context.close();
    }
  } finally {
    await browser.close();
  }
  assert(result.providerCalls === 0, "Provider request count is non-zero");
  console.log(JSON.stringify(result, null, 2));
}

await main();
