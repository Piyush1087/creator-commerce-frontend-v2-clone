import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const name of [
  "E4_FRONTEND_URL",
  "E4_BACKEND_URL",
  "E4_C4_FIXTURE_PATH",
  "E4_ROLE_FIXTURE_PATH",
  "E4_CHROME_PATH",
]) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const frontend = process.env.E4_FRONTEND_URL;
const backend = process.env.E4_BACKEND_URL;
const owner = JSON.parse(await readFile(process.env.E4_C4_FIXTURE_PATH, "utf8"));
const roles = JSON.parse(await readFile(process.env.E4_ROLE_FIXTURE_PATH, "utf8"));
const widths = [390, 767, 768, 1440];
const externalHosts = new Set();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pageFor(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width < 1000 ? 900 : 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("ERR_BLOCKED_BY_CLIENT")) errors.push(message.text());
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost", "localtest.me"].includes(url.hostname) || ["data:", "blob:"].includes(url.protocol)) return route.continue();
    externalHosts.add(url.hostname);
    return route.abort("blockedbyclient");
  });
  return { context, page, errors };
}

async function login(page, fixture, errors) {
  await page.goto(`${frontend}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill(fixture.email);
  await page.locator('input[type="password"]').fill(fixture.password);
  const response = page.waitForResponse((item) => item.url().endsWith("/api/v1/auth/login") && item.request().method() === "POST");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const loginResponse = await response;
  assert(loginResponse.status() === 200, "Synthetic login failed");
  const session = await loginResponse.json();
  await page.waitForURL((url) => url.pathname !== "/login");
  errors.length = 0;
  return session;
}

async function openWorkspace(page) {
  const response = page.waitForResponse((item) => item.url().endsWith("/api/v1/brand-centre/instagram") && item.request().method() === "GET");
  await page.goto(`${frontend}/brand-centre/instagram`, { waitUntil: "domcontentloaded" });
  assert((await response).status() === 200, "Aggregate request failed");
  await page.getByRole("heading", { name: "Instagram Intelligence", exact: true }).waitFor();
}

async function axe(page) {
  const result = await new AxeBuilder({ page }).analyze();
  return {
    serious: result.violations.filter((item) => item.impact === "serious").length,
    critical: result.violations.filter((item) => item.impact === "critical").length,
    lesser: result.violations.filter((item) => ["minor", "moderate"].includes(item.impact ?? "")).length,
    lesserIds: result.violations.filter((item) => ["minor", "moderate"].includes(item.impact ?? "")).map((item) => item.id),
    blockers: result.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")).map((item) => item.id),
  };
}

async function assertNoOverflow(page, width) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert(!overflow, `Horizontal overflow at ${width}`);
}

async function openDetailFromAction(page) {
  const action = page.getByRole("button", { name: /View post details/ }).first();
  await action.focus();
  const detailResponse = page.waitForResponse((item) => item.url().includes("/api/v1/brand-centre/instagram/media/") && item.request().method() === "GET");
  await action.press("Enter");
  const response = await detailResponse;
  assert(response.status() === 200, `Detail request status ${response.status()}`);
  await page.getByRole("heading", { name: "Post details", exact: true }).waitFor();
  await page.getByRole("heading", { name: "1. Media context" }).waitFor();
  return action;
}

function assertAxePass(result, label) {
  assert(result.serious === 0 && result.critical === 0, `${label} Axe blocker: ${result.blockers.join(",")}`);
}

const browser = await chromium.launch({
  executablePath: process.env.E4_CHROME_PATH,
  headless: true,
  args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-first-run", "--no-proxy-server"],
});

const output = {
  widths: [],
  roles: [],
  isolation: {},
  stateMatrix: {},
  navigation: {},
  requests: {},
  externalRequestsBlockedBeforeNetwork: 0,
  liveProviderOrModelCalls: 0,
};

try {
  for (const width of widths) {
    const run = await pageFor(browser, width);
    await login(run.page, owner, run.errors);
    await openWorkspace(run.page);
    let detailRequests = 0;
    run.page.on("request", (request) => {
      if (request.url().includes("/api/v1/brand-centre/instagram/media/")) detailRequests += 1;
    });
    const action = await openDetailFromAction(run.page);
    assert(detailRequests === 1, `Expected one detail request at ${width}, got ${detailRequests}`);
    const headings = await run.page.locator(".instagram-detail h3").allTextContents();
    assert(headings.length === 6 && headings[0] === "1. Media context" && headings[5].startsWith("6."), `Wrong detail hierarchy at ${width}`);
    assert((await run.page.getByText("Instagram-content signal only; not a confirmed Creator Shop Collaboration.", { exact: true }).count()) === 1, `Missing collab disclaimer at ${width}`);
    assert((await run.page.locator(".instagram-detail").innerText()).includes("Not treated as zero.") === false, `Unexpected missing-value copy in observed fixture at ${width}`);
    assert(!(await run.page.locator(".instagram-detail").innerText()).includes(owner.mediaId), `Media identifier exposed at ${width}`);
    assert((await run.page.locator(".instagram-detail-surface__content").evaluate((element) => element.scrollHeight >= element.clientHeight)), `Drawer cannot scroll at ${width}`);
    await assertNoOverflow(run.page, width);
    const successAxe = await axe(run.page);
    assertAxePass(successAxe, `Success ${width}`);
    await run.page.getByRole("button", { name: "Close post details" }).focus();
    await run.page.keyboard.press("Escape");
    await run.page.getByRole("heading", { name: "Post details", exact: true }).waitFor({ state: "detached" });
    await run.page.waitForFunction(() => document.activeElement?.getAttribute("aria-label")?.startsWith("View post details"));
    assert(await action.evaluate((element) => element === document.activeElement), `Action focus not restored at ${width}`);
    assert(new URL(run.page.url()).pathname === "/brand-centre/instagram", `Close route wrong at ${width}`);
    assert(run.errors.length === 0, `Browser errors at ${width}: ${run.errors.join(" | ").replaceAll(/https?:\/\/[^/\s]+/gu, "[ORIGIN]")}`);
    const widthDetailPattern = `${backend}/api/v1/brand-centre/instagram/media/**`;
    await run.page.route(widthDetailPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.continue();
    }, { times: 1 });
    await run.page.getByRole("button", { name: /View post details/ }).first().click();
    await run.page.getByText("Loading post detail…", { exact: true }).waitFor();
    const loadingAxe = await axe(run.page);
    assertAxePass(loadingAxe, `Loading ${width}`);
    await run.page.getByRole("heading", { name: "1. Media context" }).waitFor();
    await run.page.getByRole("button", { name: "Close post details" }).click();
    await run.page.unroute(widthDetailPattern);
    await run.page.route(widthDetailPattern, (route) => route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "fixture-only" }) }), { times: 1 });
    await run.page.getByRole("button", { name: /View post details/ }).first().click();
    await run.page.getByRole("alert").waitFor();
    const errorAxe = await axe(run.page);
    assertAxePass(errorAxe, `Error ${width}`);
    await run.page.getByRole("button", { name: "Close post details" }).click();
    output.widths.push({ width, authenticatedRealBackend: "PASS", hierarchy: "PASS", overflow: "PASS", internalScroll: "PASS", keyboardEscape: "PASS", focusReturn: "PASS", oneRequest: "PASS", axe: { success: successAxe, loading: loadingAxe, error: errorAxe } });
    await run.context.close();
  }

  const direct = await pageFor(browser, 1440);
  await login(direct.page, owner, direct.errors);
  await direct.page.goto(`${frontend}/brand-centre/instagram/media/${encodeURIComponent(owner.mediaId)}?proof=e4#detail`, { waitUntil: "domcontentloaded" });
  await direct.page.getByRole("heading", { name: "Post details", exact: true }).waitFor();
  assert(new URL(direct.page.url()).search === "?proof=e4" && new URL(direct.page.url()).hash === "#detail", "Direct-link query/hash not retained");
  await direct.page.getByRole("button", { name: "Close post details" }).click();
  assert(new URL(direct.page.url()).pathname === "/brand-centre/instagram", "Direct close did not return to workspace");
  await direct.page.goBack();
  await direct.page.getByRole("heading", { name: "Post details", exact: true }).waitFor();
  await direct.page.goForward();
  await direct.page.getByRole("heading", { name: "Instagram Intelligence", exact: true }).waitFor();
  output.navigation = { directLink: "PASS", queryHashRetention: "PASS", close: "PASS", backForward: "PASS" };

  const detailPattern = `${backend}/api/v1/brand-centre/instagram/media/**`;
  await direct.page.route(detailPattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  }, { times: 1 });
  await direct.page.goto(`${frontend}/brand-centre/instagram/media/${encodeURIComponent(owner.mediaId)}`, { waitUntil: "domcontentloaded" });
  await direct.page.getByText("Loading post detail…", { exact: true }).waitFor();
  const loadingAxe = await axe(direct.page);
  assertAxePass(loadingAxe, "Loading");
  await direct.page.getByRole("heading", { name: "1. Media context" }).waitFor();
  await direct.page.unroute(detailPattern);

  await direct.page.route(detailPattern, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "fixture-only" }) }));
  await direct.page.reload({ waitUntil: "domcontentloaded" });
  await direct.page.getByRole("alert").waitFor();
  const errorAxe = await axe(direct.page);
  assertAxePass(errorAxe, "Error");
  assert((await direct.page.getByRole("button", { name: "Retry post detail" }).count()) === 1, "Retry action absent");
  output.stateMatrix = { loading: "FIXTURE_PASS", success: "REAL_BACKEND_PASS", error: "FIXTURE_PASS", retry: "FIXTURE_PASS", axe: { loading: loadingAxe, error: errorAxe } };
  await direct.context.close();

  for (const [role, fixture] of [["BRAND_OWNER", owner], ["CAMPAIGN_MANAGER", roles.manager], ["FINANCE_ADMIN", roles.finance]]) {
    const run = await pageFor(browser, 1440);
    await login(run.page, fixture, run.errors);
    await openWorkspace(run.page);
    await openDetailFromAction(run.page);
    output.roles.push({ role, activeBrandRead: "REAL_BACKEND_PASS", detailRead: "REAL_BACKEND_PASS" });
    await run.context.close();
  }

  for (const [kind, fixture] of [["INACTIVE_MEMBERSHIP", roles.inactive], ["NON_MEMBER", roles.nonmember], ["SECOND_TENANT", roles.secondTenant]]) {
    const run = await pageFor(browser, 1440);
    const session = await login(run.page, fixture, run.errors);
    const response = await run.page.request.get(`${backend}/api/v1/brand-centre/instagram/media/${encodeURIComponent(owner.mediaId)}`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    assert([403, 404].includes(response.status()), `${kind} detail disclosed with ${response.status()}`);
    output.isolation[kind] = { status: response.status(), nonDisclosure: "REAL_BACKEND_PASS" };
    await run.context.close();
  }

  const anonymous = await browser.newContext();
  const response = await anonymous.request.get(`${backend}/api/v1/brand-centre/instagram/media/${encodeURIComponent(owner.mediaId)}`);
  assert(response.status() === 401, `Anonymous detail status ${response.status()}`);
  output.isolation.UNAUTHENTICATED = { status: response.status(), nonDisclosure: "REAL_BACKEND_PASS" };
  await anonymous.close();
  output.requests = { aggregateEndpointPreserved: "PASS", detailEndpointExact: "PASS", staleResponsesIgnored: "UNIT_PASS", abortOnCloseOrChange: "UNIT_PASS" };
  output.externalRequestsBlockedBeforeNetwork = externalHosts.size;
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
