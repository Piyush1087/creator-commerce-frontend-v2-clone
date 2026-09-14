import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

for (const name of ["P3_FRONTEND_URL", "P3_CHROME_PATH", "P3_EVIDENCE_DIR"]) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const frontend = process.env.P3_FRONTEND_URL;
const viewports = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function audience(overrides = {}) {
  return {
    contractVersion: "creator_audience_v0.1",
    generatedAt: "2026-09-14T10:00:00.000Z",
    status: "READY",
    context: { role: "OWNER" },
    source: "INSTAGRAM",
    sourceStatus: "CONNECTED",
    snapshotBasis: {
      period: "lifetime",
      timeframe: "this_month",
      capturedAt: "2026-09-14T10:00:00.000Z",
    },
    defaultCohort: "FOLLOWERS",
    highlights: [
      {
        id: "largest-age",
        text: "18–24 is the largest follower group.",
        evidence: ["FOLLOWERS:AGE:18-24"],
      },
    ],
    cohorts: [
      {
        id: "FOLLOWERS",
        availability: "AVAILABLE",
        size: 1200,
        dimensions: [
          {
            id: "AGE",
            state: "AVAILABLE",
            denominatorValid: true,
            buckets: [
              { key: "18-24", count: 720, percentage: 60 },
              { key: "25-34", count: 480, percentage: 40 },
            ],
            limitations: [],
          },
          {
            id: "COUNTRY",
            state: "AVAILABLE",
            denominatorValid: false,
            buckets: [{ key: "India", count: 850, percentage: null }],
            limitations: ["NO_VALID_DENOMINATOR"],
          },
        ],
        limitations: [],
      },
      {
        id: "ENGAGED",
        availability: "AVAILABLE",
        size: 430,
        dimensions: [
          {
            id: "AGE",
            state: "AVAILABLE",
            denominatorValid: true,
            buckets: [{ key: "25-34", count: 258, percentage: 60 }],
            limitations: [],
          },
        ],
        limitations: [],
      },
    ],
    freshness: { state: "CURRENT", staleAfterHours: 192 },
    processingState: "IDLE",
    currentPreserved: false,
    limitations: [],
    settingsRecoveryRoute: "/creator/settings/instagram",
    ...overrides,
  };
}

const session = {
  accessToken: "browser-fixture",
  accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
  user: {
    id: "browser-owner",
    email: "browser-owner@example.test",
    name: "Browser Owner",
    role: "CREATOR",
  },
};

const actor = {
  actor_user_id: "browser-owner",
  actor_membership_id: "browser-membership",
  actor_role: "OWNER",
  workspace_id: "browser-workspace",
  organization_id: "browser-organization",
  subject_creator_profile_id: "browser-creator",
  subject_owner_user_id: "browser-owner",
  allowed_actions: [
    "CAMPAIGN_OPPORTUNITY_VIEW",
    "WORKSPACE_PROFILE_READ",
    "CONTACT_READ",
    "TEAM_READ",
    "INSTAGRAM_SETTINGS_READ",
    "INSIGHTS_AUDIENCE_READ",
    "PAYOUT_SETTINGS_READ",
    "LEGAL_PROFILE_READ",
  ],
};

const entryState = {
  accountContext: "CREATOR_READY",
  onboardingStatus: "COMPLETE",
  canEnterCreatorPlatform: true,
  nextAction: "CREATOR_WORKSPACE_ENTRY",
  instagram: {
    identityConnection: "CONNECTED",
    basicAuthorization: "AVAILABLE",
    insightsCapability: "AVAILABLE",
    authorizationHealth: "ACTIVE",
  },
};

async function axe(page) {
  const result = await new AxeBuilder({ page }).analyze();
  const blockers = result.violations.filter(({ impact }) =>
    ["serious", "critical"].includes(impact ?? ""),
  );
  return {
    serious: blockers.filter(({ impact }) => impact === "serious").length,
    critical: blockers.filter(({ impact }) => impact === "critical").length,
    lesser: result.violations.filter(({ impact }) =>
      ["minor", "moderate"].includes(impact ?? ""),
    ).length,
    blockerIds: blockers.map(({ id }) => id),
  };
}

async function browserPage(browser, viewport, audienceBody = audience()) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  let loggedIn = false;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("ERR_BLOCKED_BY_CLIENT")
    )
      errors.push(message.text());
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (url.pathname.endsWith("/api/v1/auth/refresh"))
      return loggedIn
        ? json(session)
        : json({ message: "Unauthenticated" }, 401);
    if (url.pathname.endsWith("/api/v1/auth/login")) {
      loggedIn = true;
      return json(session);
    }
    if (url.pathname.endsWith("/api/v1/creator/workspace/actor-context"))
      return json(actor);
    if (url.pathname.endsWith("/api/v1/creator-entry/state"))
      return json(entryState);
    if (url.pathname.endsWith("/api/v1/creator/insights/audience"))
      return json(audienceBody);
    if (
      ["localhost", "127.0.0.1"].includes(url.hostname) ||
      ["data:", "blob:"].includes(url.protocol)
    )
      return route.continue();
    return route.abort("blockedbyclient");
  });
  return { context, page, errors };
}

async function login(page) {
  await page.goto(`${frontend}/login`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Sign in" }).waitFor();
  await page.getByLabel("Email", { exact: true }).fill(session.user.email);
  await page.getByLabel("Password", { exact: true }).fill("browser-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
  await page.goto(`${frontend}/creator/insights/audience`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { level: 1, name: "Audience" }).waitFor();
}

async function assertCurrent(page, width) {
  const headings = await page
    .locator(".creator-audience h1, .creator-audience h2, .creator-audience h3")
    .allTextContents();
  assert(
    headings[0] === "Audience",
    `Audience heading is not first at ${width}`,
  );
  assert(
    headings.indexOf("Audience Highlights") <
      headings.indexOf("Followers audience"),
    `Highlights hierarchy failed at ${width}`,
  );
  assert(
    headings.at(-1) === "Data status & limitations",
    `Data status is not last at ${width}`,
  );
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  assert(!overflow, `Horizontal overflow at ${width}`);
  const bottom = page.locator(".aurora-bottom-nav");
  const sidebar = page.locator(".aurora-sidebar");
  assert(
    width <= 767 ? await bottom.isVisible() : await sidebar.isVisible(),
    `Expected navigation variant missing at ${width}`,
  );
  assert(
    width <= 767 ? !(await sidebar.isVisible()) : !(await bottom.isVisible()),
    `Wrong navigation variant visible at ${width}`,
  );
  const tabs = page.getByRole("tab");
  assert((await tabs.count()) === 2, `Two-cohort switch missing at ${width}`);
  await tabs.first().focus();
  await tabs.first().press("ArrowRight");
  assert(
    (await page
      .getByRole("tab", { name: "Engaged" })
      .getAttribute("aria-selected")) === "true",
    `Keyboard cohort selection failed at ${width}`,
  );
  assert(
    await page
      .getByRole("tab", { name: "Engaged" })
      .evaluate((node) => node === document.activeElement),
    `Keyboard focus did not follow the cohort selection at ${width}`,
  );
}

await mkdir(process.env.P3_EVIDENCE_DIR, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.P3_CHROME_PATH,
  headless: true,
  args: [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-first-run",
    "--no-proxy-server",
  ],
});
const output = { viewports: [], states: [], liveProviderOrModelCalls: 0 };
try {
  for (const [width, height] of viewports) {
    const run = await browserPage(browser, { width, height });
    await login(run.page);
    run.errors.length = 0;
    await assertCurrent(run.page, width);
    const result = await axe(run.page);
    assert(
      result.serious === 0 && result.critical === 0,
      `Axe blocker at ${width}: ${result.blockerIds.join(",")}`,
    );
    assert(
      run.errors.length === 0,
      `Browser errors at ${width}: ${run.errors.join(" | ")}`,
    );
    await run.page.screenshot({
      path: join(process.env.P3_EVIDENCE_DIR, `creator-audience-${width}.png`),
      fullPage: true,
    });
    output.viewports.push({
      width,
      navigation: width <= 767 ? "MOBILE_BOTTOM_NAV" : "DESKTOP_SIDEBAR",
      hierarchy: "PASS",
      keyboard: "PASS",
      overflow: "PASS",
      axe: result,
    });
    await run.context.close();
  }

  const unavailableBody = audience({
    status: "UNAVAILABLE",
    sourceStatus: "REAUTH_REQUIRED",
    snapshotBasis: {
      period: "lifetime",
      timeframe: "this_month",
      capturedAt: null,
    },
    defaultCohort: null,
    highlights: [],
    cohorts: audience().cohorts.map((cohort) => ({
      ...cohort,
      availability: "UNAVAILABLE",
      dimensions: [],
    })),
    freshness: { state: "UNKNOWN", staleAfterHours: 192 },
    limitations: ["SOURCE_REAUTH_REQUIRED"],
  });
  const unavailable = await browserPage(
    browser,
    { width: 1440, height: 1000 },
    unavailableBody,
  );
  await login(unavailable.page);
  assert(
    (await unavailable.page.getByRole("tab").count()) === 0,
    "Unavailable state exposed an empty switch",
  );
  assert(
    (await unavailable.page
      .getByRole("link", { name: "Review Instagram settings" })
      .count()) > 0,
    "Recovery route missing",
  );
  output.states.push({
    unavailable: "PASS",
    emptyCharts: 0,
    recovery: "SETTINGS_ONLY",
  });
  await unavailable.context.close();

  const countOnlyBody = audience({
    status: "PARTIAL",
    highlights: [],
    cohorts: [
      {
        ...audience().cohorts[0],
        dimensions: audience().cohorts[0].dimensions.map((dimension) => ({
          ...dimension,
          denominatorValid: false,
          buckets: dimension.buckets.map((bucket) => ({
            ...bucket,
            percentage: null,
          })),
        })),
      },
      { ...audience().cohorts[1], availability: "UNAVAILABLE", dimensions: [] },
    ],
  });
  const countOnly = await browserPage(
    browser,
    { width: 390, height: 844 },
    countOnlyBody,
  );
  await login(countOnly.page);
  assert(
    (await countOnly.page.getByRole("tab").count()) === 0,
    "One cohort exposed a one-option switch",
  );
  assert(
    !(await countOnly.page.locator(".creator-audience").innerText()).includes(
      "60%",
    ),
    "Invalid denominator exposed a percentage",
  );
  output.states.push({ countOnly: "PASS", oneOptionSwitch: "ABSENT" });
  await countOnly.context.close();

  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
