import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

for (const name of [
  "P3_CONTENT_FRONTEND_URL",
  "P3_CONTENT_CHROME_PATH",
  "P3_CONTENT_EVIDENCE_DIR",
])
  if (!process.env[name]) throw new Error(`${name} is required`);
const frontend = process.env.P3_CONTENT_FRONTEND_URL;
const viewports = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];
const roles = ["OWNER", "MANAGER", "ASSISTANT"];
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

function content(role = "OWNER", overrides = {}) {
  return {
    contractVersion: "creator_content_v0.1",
    generatedAt: "2026-09-15T10:00:00.000Z",
    status: "READY",
    context: { role },
    source: "INSTAGRAM",
    sourceStatus: "CONNECTED",
    snapshot: {
      windowDays: 90,
      windowStart: "2026-06-17T10:00:00.000Z",
      windowEnd: "2026-09-15T10:00:00.000Z",
      eligibleCount: 4,
      providerRowsReturned: 4,
      cap: 24,
      coverage: 1,
      media: [
        {
          providerMediaId: "media-1",
          publishedAt: "2026-09-10T10:00:00.000Z",
          mediaType: "REEL",
          permalink: "https://www.instagram.com/p/example/",
          semanticState: "AVAILABLE",
          themes: ["Cooking"],
          captionPatterns: ["Question opening"],
          creativeStructures: ["Demonstration"],
          visualExecution: ["Close-up"],
          metrics: { REACH: 120 },
          evidenceRefs: ["evidence-1"],
        },
      ],
    },
    highlights: [
      {
        id: "highlight-1",
        kind: "RECURRENCE",
        text: "Cooking appeared across recent posts.",
        confidence: "MEDIUM",
        evidenceRefs: ["evidence-1"],
      },
    ],
    whatYouCreate: {
      themes: [
        { value: "Cooking", postCount: 2, evidenceRefs: ["evidence-1"] },
      ],
      formats: [{ value: "REEL", postCount: 4, evidenceRefs: ["evidence-1"] }],
    },
    performance: {
      comparisonProfile: "v0.1",
      claims: [
        {
          id: "claim-1",
          cohort: "Cooking posts",
          metric: "REACH",
          direction: "HIGHER",
          cohortMedian: 120,
          complementMedian: 80,
          absolutePercentagePointDelta: null,
          relativeDelta: 0.5,
          cohortSample: 2,
          complementSample: 2,
          cohortCoverage: 1,
          complementCoverage: 1,
          confidence: "MEDIUM",
          evidenceRefs: ["evidence-1"],
        },
      ],
    },
    representatives: [
      {
        providerMediaId: "media-1",
        publishedAt: "2026-09-10T10:00:00.000Z",
        reason: "Represents Cooking posts.",
        permalink: "https://www.instagram.com/p/example/",
        evidenceRefs: ["evidence-1"],
      },
    ],
    freshness: {
      state: "CURRENT",
      staleAfterHours: 48,
      capturedAt: "2026-09-15T10:00:00.000Z",
    },
    processingState: "IDLE",
    currentPreserved: false,
    limitations: [],
    settingsRecoveryRoute: "/creator/settings/instagram",
    ...overrides,
  };
}

const session = {
  accessToken: "synthetic-browser-session",
  accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
  user: {
    id: "browser-actor",
    email: "browser-actor@example.test",
    name: "Browser Actor",
    role: "CREATOR",
  },
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

async function pageFor(
  browser,
  viewport,
  role = "OWNER",
  body = content(role),
) {
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
    const url = new URL(route.request().url());
    const json = (value, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(value),
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
      return json({
        actor_user_id: "browser-actor",
        actor_membership_id: `membership-${role}`,
        actor_role: role,
        workspace_id: "browser-workspace",
        organization_id: "browser-organization",
        subject_creator_profile_id: "browser-creator",
        subject_owner_user_id:
          role === "OWNER" ? "browser-actor" : "browser-owner",
        allowed_actions: [
          "WORKSPACE_PROFILE_READ",
          "INSTAGRAM_SETTINGS_READ",
          "INSIGHTS_AUDIENCE_READ",
          "INSIGHTS_CONTENT_READ",
        ],
      });
    if (url.pathname.endsWith("/api/v1/creator-entry/state"))
      return json(entryState);
    if (url.pathname.endsWith("/api/v1/creator/insights/content"))
      return json(body);
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
  await page.getByLabel("Password", { exact: true }).fill("synthetic-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
  await page.goto(`${frontend}/creator/insights/content`, {
    waitUntil: "networkidle",
  });
  try {
    await page
      .getByRole("heading", { level: 1, name: "Content" })
      .waitFor({ timeout: 10_000 });
  } catch {
    throw new Error(
      `Content route did not render at ${page.url()}: ${(await page.locator("body").innerText()).slice(0, 500)}`,
    );
  }
}

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

await mkdir(process.env.P3_CONTENT_EVIDENCE_DIR, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.P3_CONTENT_CHROME_PATH,
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
  viewports: [],
  roles: [],
  states: [],
  liveProviderOrModelCalls: 0,
};
try {
  for (const [width, height] of viewports) {
    const run = await pageFor(browser, { width, height });
    await login(run.page);
    run.errors.length = 0;
    const headings = await run.page
      .locator(".creator-content h1, .creator-content h2, .creator-content h3")
      .allTextContents();
    const required = [
      "Content",
      "Content Snapshot",
      "Content Highlights",
      "What You Create",
      "Content Performance",
      "Representative Content",
      "Data Status & Limitations",
    ];
    required.forEach((heading, index) =>
      assert(
        headings.indexOf(heading) >=
          (index ? headings.indexOf(required[index - 1]) : 0),
        `Hierarchy failed for ${heading} at ${width}`,
      ),
    );
    assert(
      !(await run.page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      )),
      `Horizontal overflow at ${width}`,
    );
    const nav = run.page.getByRole("navigation", {
      name: "Creator Insights sections",
    });
    await nav.getByRole("link", { name: "Audience" }).focus();
    await run.page.keyboard.press("Tab");
    assert(
      await nav
        .getByRole("link", { name: "Content" })
        .evaluate((node) => node === document.activeElement),
      `Peer-nav focus failed at ${width}`,
    );
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
      path: join(
        process.env.P3_CONTENT_EVIDENCE_DIR,
        `creator-content-${width}.png`,
      ),
      fullPage: true,
    });
    output.viewports.push({
      width,
      hierarchy: "PASS",
      keyboardFocus: "PASS",
      overflow: "PASS",
      axe: result,
    });
    await run.context.close();
  }
  for (const role of roles) {
    const run = await pageFor(browser, { width: 1440, height: 1000 }, role);
    await login(run.page);
    assert(
      await run.page
        .getByRole("heading", { level: 1, name: "Content", exact: true })
        .isVisible(),
      `${role} access failed`,
    );
    output.roles.push({ role, access: "PASS", projectedContext: role });
    await run.context.close();
  }
  const degradedBody = content("OWNER", {
    status: "PARTIAL",
    sourceStatus: "REAUTH_REQUIRED",
    freshness: {
      state: "STALE",
      staleAfterHours: 48,
      capturedAt: "2026-09-01T10:00:00.000Z",
    },
    processingState: "FAILED",
    currentPreserved: true,
    limitations: ["SOURCE_REAUTH_REQUIRED"],
  });
  const degraded = await pageFor(
    browser,
    { width: 390, height: 844 },
    "OWNER",
    degradedBody,
  );
  await login(degraded.page);
  assert(
    await degraded.page
      .getByText("Showing the last good Content snapshot")
      .isVisible(),
    "Preserved-current state missing",
  );
  assert(
    await degraded.page
      .getByRole("link", { name: "Review Instagram settings" })
      .isVisible(),
    "Settings recovery missing",
  );
  output.states.push({
    degradedCurrentPreserved: "PASS",
    recovery: "SETTINGS_ONLY",
  });
  await degraded.context.close();
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
