import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

for (const name of [
  "P4_CONTENT_FRONTEND_URL",
  "P4_CONTENT_BACKEND_URL",
  "P4_CONTENT_BROWSER_PASSWORD",
  "P4_CONTENT_CHROME_PATH",
])
  if (!process.env[name]) throw new Error(`${name} is required`);
const viewports = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];
const identities = {
  OWNER: "creator-content-p4@example.test",
  MANAGER: "creator-content-p4-manager@example.test",
  ASSISTANT: "creator-content-p4-assistant@example.test",
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const browser = await chromium.launch({
  executablePath: process.env.P4_CONTENT_CHROME_PATH,
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
  productionVertical: [],
  roles: [],
  inactiveActor: null,
  unauthenticatedApiStatus: null,
  liveCalls: 0,
};

async function authenticatedPage(
  viewport,
  role = "OWNER",
  email = identities[role],
) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  const blockedHosts = new Set();
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
      ["MANAGER", "ASSISTANT"].includes(role) &&
      url.pathname.endsWith("/api/v1/creator-entry/state")
    ) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accountContext: "CREATOR_READY",
          onboardingStatus: "COMPLETE",
          canEnterCreatorPlatform: true,
          nextAction: "CREATOR_WORKSPACE_ENTRY",
          instagram: {
            identityConnection: "CONNECTED",
            basicAuthorization: "AVAILABLE",
            insightsCapability: "AVAILABLE",
            authorizationHealth: "USABLE",
          },
        }),
      });
    }
    if (
      ["localhost", "127.0.0.1"].includes(url.hostname) ||
      ["data:", "blob:"].includes(url.protocol)
    )
      return route.continue();
    blockedHosts.add(url.hostname);
    return route.abort("blockedbyclient");
  });
  await page.goto(`${process.env.P4_CONTENT_FRONTEND_URL}/login`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.P4_CONTENT_BROWSER_PASSWORD);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  assert((await loginResponse).status() === 200, `${role} login failed`);
  return { context, page, errors, blockedHosts };
}

async function openContent(run, role) {
  const api = run.page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/creator/insights/content") &&
      response.request().method() === "GET",
  );
  await run.page.goto(
    `${process.env.P4_CONTENT_FRONTEND_URL}/creator/insights/content`,
    { waitUntil: "domcontentloaded" },
  );
  let response;
  try {
    response = await api;
  } catch {
    throw new Error(
      `Content API was not requested for ${role} at ${run.page.url()}: ${(await run.page.locator("body").innerText()).slice(0, 500)}`,
    );
  }
  assert(response.status() === 200, `${role} Content API failed`);
  const body = await response.json();
  assert(
    body.contractVersion === "creator_content_v0.1",
    "Wrong Content contract",
  );
  assert(body.context.role === role, `${role} projection mismatch`);
  assert(
    body.snapshot.eligibleCount === 8 && body.snapshot.media.length === 8,
    "Fixture corpus was not projected exactly",
  );
  assert(
    body.highlights.length <= 3 && body.representatives.length <= 6,
    "Bounded collections exceeded",
  );
  assert(
    body.performance.claims.length > 0,
    "Deterministic comparison missing",
  );
  assert(
    body.currentPreserved === true &&
      body.processingState === "FAILED" &&
      body.sourceStatus === "PROVIDER_FAILURE",
    "Failed changed execution did not expose preserved-current truth",
  );
  assert(
    !/accessToken|providerPayload|lease|temporaryPath|prompt|reasoning/i.test(
      JSON.stringify(body),
    ),
    "Consumer exposed an internal field",
  );
  await run.page
    .getByRole("heading", { level: 1, name: "Content", exact: true })
    .waitFor();
  await run.page
    .getByText("Showing the last good Content snapshot", { exact: true })
    .waitFor();
  return body;
}

try {
  for (const [width, height] of viewports) {
    const run = await authenticatedPage({ width, height });
    await openContent(run, "OWNER");
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
        `Hierarchy failed at ${width}`,
      ),
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
      `Keyboard focus failed at ${width}`,
    );
    assert(
      !(await run.page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      )),
      `Horizontal overflow at ${width}`,
    );
    const axe = await new AxeBuilder({ page: run.page }).analyze();
    const serious = axe.violations.filter(({ impact }) => impact === "serious");
    const critical = axe.violations.filter(
      ({ impact }) => impact === "critical",
    );
    assert(!serious.length && !critical.length, `Axe blocker at ${width}`);
    assert(
      !run.errors.length,
      `Browser errors at ${width}: ${run.errors.join(" | ")}`,
    );
    output.productionVertical.push({
      width,
      apiToUi: "PASS",
      keyboardFocus: "PASS",
      overflow: "PASS",
      axe: {
        serious: 0,
        critical: 0,
        lesser: axe.violations.filter(({ impact }) =>
          ["minor", "moderate"].includes(impact ?? ""),
        ).length,
      },
      externalHostsBlocked: run.blockedHosts.size,
    });
    await run.context.close();
  }
  for (const role of ["MANAGER", "ASSISTANT"]) {
    const run = await authenticatedPage({ width: 1440, height: 1000 }, role);
    await openContent(run, role);
    output.roles.push({ role, authenticatedApiToUi: "PASS" });
    await run.context.close();
  }
  output.roles.unshift({ role: "OWNER", authenticatedApiToUi: "PASS" });
  const inactive = await authenticatedPage(
    { width: 1440, height: 1000 },
    "INACTIVE",
    "creator-content-p4-inactive@example.test",
  );
  await inactive.page.goto(
    `${process.env.P4_CONTENT_FRONTEND_URL}/creator/insights/content`,
    { waitUntil: "networkidle" },
  );
  assert(
    !inactive.page.url().endsWith("/creator/insights/content"),
    "Inactive actor entered Content route",
  );
  assert(
    (await inactive.page
      .getByRole("heading", { name: "Content", exact: true })
      .count()) === 0,
    "Inactive actor rendered Content",
  );
  output.inactiveActor = { contentRendered: false, failClosed: "PASS" };
  await inactive.context.close();
  const anonymous = await browser.newContext();
  const response = await anonymous.request.get(
    `${process.env.P4_CONTENT_BACKEND_URL}/api/v1/creator/insights/content`,
  );
  output.unauthenticatedApiStatus = response.status();
  assert(
    response.status() === 401,
    "Unauthenticated Content read was not denied",
  );
  await anonymous.close();
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
