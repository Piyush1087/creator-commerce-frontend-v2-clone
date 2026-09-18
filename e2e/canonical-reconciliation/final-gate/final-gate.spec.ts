import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { artifactPath, installLoopbackGuard, writeSanitizedJson } from "./helpers";
import { completeScenario, prepareScenario } from "./lifecycle";
import { FINAL_GATE_EXECUTIONS, REPRESENTATIVE_WIDTHS, ROLE_EMAILS, type FinalGateRole } from "./manifest";

const API = "http://127.0.0.1:3000";
const AWARENESS = "f1000000-0000-4000-8000-000000000101";
const TRUST = "f1000000-0000-4000-8000-000000000102";
const LEGACY = "f1000000-0000-4000-8000-000000000105";
const MEDIA_KIT = "finalgatecreator00000001";

type Runtime = { browser: Browser; baseURL: string; width: number; blocked: string[]; failures: string[]; contexts: BrowserContext[]; axe: Array<{ shell: string; critical: number }> };

async function rolePage(runtime: Runtime, role: FinalGateRole) {
  const context = await runtime.browser.newContext({ viewport: { width: runtime.width, height: 900 } });
  runtime.contexts.push(context);
  await installLoopbackGuard(context, runtime.blocked);
  const page = await context.newPage();
  page.on("pageerror", (error) => runtime.failures.push(`pageerror:${error.message}`));
  page.on("console", (message) => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) runtime.failures.push(`console:${message.text()}`); });
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    const anonymous = response.status() === 401 && ["/api/v1/auth/me", "/api/v1/auth/refresh"].includes(path);
    const b07Conflict = response.status() === 409 && path.includes("/reporting");
    const assistantPayoutDenial = role === "CREATOR_ASSISTANT" && response.status() === 403 && path.startsWith("/api/v1/creator/payouts");
    if (response.status() >= 400 && !anonymous && !b07Conflict && !assistantPayoutDenial) runtime.failures.push(`response:${response.status()}:${response.url()}`);
  });
  if (role !== "PUBLIC") {
    const password = process.env.FINAL_GATE_FIXTURE_PASSWORD;
    if (!password) throw new Error("FINAL_GATE_FIXTURE_PASSWORD is required");
    await page.goto(`${runtime.baseURL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel(/email/i).fill(ROLE_EMAILS[role]);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  }
  return { context, page };
}

async function shellAxe(runtime: Runtime, page: Page, shell: string) {
  await expect(page.locator("body")).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  const critical = result.violations.filter((item) => item.impact === "critical");
  runtime.axe.push({ shell, critical: critical.length });
  await writeSanitizedJson(artifactPath("axe", `${shell}-${runtime.width}.json`), result);
  expect(critical, `${shell} critical Axe violations`).toEqual([]);
}

async function keyboardProof(page: Page) {
  await page.keyboard.press("Tab");
  const tag = await page.evaluate(() => document.activeElement?.tagName ?? "");
  expect(tag).not.toBe("BODY");
  return tag;
}

async function b01(runtime: Runtime) {
  const { page } = await rolePage(runtime, "PUBLIC");
  await page.goto(`${runtime.baseURL}/campaigns/${AWARENESS}`);
  await expect(page.getByRole("heading", { name: "Final Gate AWARENESS Campaign", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /edit|approve|link campaign asset/i })).toHaveCount(0);
  await shellAxe(runtime, page, "B01-public-campaign");
  await page.goto(`${runtime.baseURL}/media-kit/${MEDIA_KIT}`);
  await expect(page.getByRole("heading", { name: "Final Gate Creator", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /edit|publish/i })).toHaveCount(0);
  await keyboardProof(page);
  await shellAxe(runtime, page, "B01-public-media-kit");
}

async function b02(runtime: Runtime) {
  const { page } = await rolePage(runtime, "BRAND_OWNER");
  const routes = [
    ["/brand/dashboard", "Brand Home"],
    ["/brand-centre", "Final Gate Verified Brand"],
    ["/brand-centre/offerings", "Final Gate Unlinked Product"],
    [`/brand/media-kits/${MEDIA_KIT}`, "Final Gate Creator"],
  ] as const;
  for (const [path, heading] of routes) {
    await page.goto(`${runtime.baseURL}${path}`);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  }
  await keyboardProof(page);
  await shellAxe(runtime, page, "B02-verified-brand");
}

const previewProjection = {
  runId: "final-gate-preview-run", state: "PREVIEW_READY", phase: "PREPARING_PREVIEW", completeness: "PARTIAL", retryAllowed: false,
  preview: {
    identity: { brand_name: "Final Gate Verified Brand", logo_url: null, website_url: "https://final-gate-brand.example.test", display_domain: "final-gate-brand.example.test", confirmed_industry: "D2C" },
    brand_descriptor: "Deterministic validation-only Brand Preview",
    brand_understanding_narrative: "A deterministic local projection used only by final validation.",
    audience_groups: [{ id: "audience-1", label: "Local audience", why_it_matters: "It proves accepted Preview rendering without a provider." }],
    creator_marketing_opportunities: [{ title: "Local creator proof", why_it_matters: "No external provider is called." }],
    creator_archetype_recommendations: [{ archetype_id: "EDUCATOR", label: "Local educators", rationale: "Deterministic accepted test projection." }],
  }, verification_context: { brand_profile_id: "f1000000-0000-4000-8000-000000000002" },
};

async function b03(runtime: Runtime) {
  const { context, page } = await rolePage(runtime, "BRAND_OWNER");
  await context.route("**/api/v1/discovery/final-gate-lead/brand-preview", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(previewProjection) }));
  await page.goto(`${runtime.baseURL}/`);
  await page.evaluate(() => sessionStorage.setItem("ccs.brandPreview.pending.v1", JSON.stringify({ leadId: "final-gate-lead", normalizedUrl: "https://final-gate-brand.example.test" })));
  await page.goto(`${runtime.baseURL}/brand/onboarding/scan`);
  await expect(page.getByText("Your Brand Preview", { exact: true })).toBeVisible();
  const verify = page.getByRole("button", { name: "Verify & claim this brand" });
  await verify.focus(); await expect(verify).toBeFocused();
  await shellAxe(runtime, page, "B03-brand-preview");
  const brandCentre = await rolePage(runtime, "BRAND_OWNER");
  await brandCentre.page.goto(`${runtime.baseURL}/brand-centre`);
  await expect(brandCentre.page.getByRole("heading", { name: "Final Gate Verified Brand" })).toBeVisible();
  await expect(brandCentre.page).not.toHaveURL(/\/login/);
}

async function b04(runtime: Runtime) {
  const { context, page } = await rolePage(runtime, "BRAND_OWNER");
  await context.route("**/api/v1/discovery/resolve", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ outcome: "waitlist", reason: "UNSUPPORTED_INDUSTRY", normalizedUrl: "https://unsupported.example.test", domain: "unsupported.example.test", industry: "REAL_ESTATE" }) }));
  await page.goto(`${runtime.baseURL}/`);
  await page.getByPlaceholder("Your website URL").fill("https://unsupported.example.test");
  await page.getByText("I confirm I own or am authorized", { exact: false }).click();
  await page.getByLabel("I agree to the Terms of Service and Privacy Policy").check();
  await page.getByRole("button", { name: "Analyze My Brand" }).click();
  await expect(page.getByText("Automated onboarding is not available for this brand yet")).toBeVisible();
  await expect(page.getByText("Your Brand Preview", { exact: true })).toHaveCount(0);
  await keyboardProof(page); await shellAxe(runtime, page, "B04-unsupported-gatekeeper");
}

async function b05(runtime: Runtime) {
  const { page } = await rolePage(runtime, "BRAND_OWNER");
  const objectives = [["AWARENESS", /Awareness — Reach & Visibility/], ["TRUST", /Trust — Credibility & Validation/], ["ASSETS", /Assets — Reusable Content/], ["ACTION", /Action — Measurable Response/]] as const;
  for (const [objective, label] of objectives) {
    await page.evaluate(() => localStorage.removeItem("creator-shop:campaign:create:draft-id"));
    const created = page.waitForResponse((response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith("/api/v1/brand-uce/campaigns/canonical-drafts") &&
      response.ok(),
    );
    await page.goto(`${runtime.baseURL}/brand/uce/campaigns/create`);
    await created;
    await expect.poll(() => page.evaluate(() => localStorage.getItem("creator-shop:campaign:create:draft-id"))).not.toBeNull();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Campaign Strategy" })).toBeVisible();
    const nameSaved = page.waitForResponse((response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.includes("/api/v1/brand-uce/campaigns/canonical-drafts/") &&
      response.request().postData()?.includes("strategy.campaign_name") === true &&
      response.ok(),
    );
    await page.getByLabel("Campaign Name").fill(`Final Gate ${objective} Draft`);
    await nameSaved;
    const objectiveSaved = page.waitForResponse((response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.includes("/api/v1/brand-uce/campaigns/canonical-drafts/") &&
      response.request().postData()?.includes("strategy.objective") === true &&
      response.ok(),
    );
    await page.getByRole("radio", { name: label }).click();
    await objectiveSaved;
    await expect(page.getByRole("status").filter({ hasText: /Saved/ })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Campaign Name")).toHaveValue(`Final Gate ${objective} Draft`);
    await expect(page.getByRole("radio", { name: label })).toHaveAttribute("aria-checked", "true");
    const editedNameSaved = page.waitForResponse((response) =>
      response.request().method() === "PATCH" &&
      response.request().postData()?.includes("strategy.campaign_name") === true &&
      response.ok(),
    );
    await page.getByLabel("Campaign Name").fill(`Final Gate ${objective} Draft Edited`);
    await editedNameSaved;
    await expect(page.getByRole("status").filter({ hasText: /Saved/ })).toBeVisible();
  }
  await expect(page.getByText(/PULSE|PROOF|PRODUCTION|PUSH/)).toHaveCount(0);
  await keyboardProof(page); await shellAxe(runtime, page, "B05-canonical-objectives");
}

async function b06(runtime: Runtime) {
  const { page } = await rolePage(runtime, "BRAND_OWNER");
  await page.goto(`${runtime.baseURL}/brand/uce/campaigns/${TRUST}`);
  for (const tab of ["Discovery", "Applicants", "Collaborations"]) {
    await page.getByRole("tab", { name: new RegExp(`^${tab}\\b`) }).click();
    await expect(page.getByRole("tabpanel").getByRole("heading", { name: tab, exact: true })).toBeVisible();
  }
  const canonicalSetupHeading = page.getByRole("heading", {
    name: "Campaign Asset → Brief",
    exact: true,
  });
  await expect(canonicalSetupHeading).toHaveCount(1);
  const canonicalSetup = canonicalSetupHeading.locator("xpath=ancestor::section[1]");
  await expect(canonicalSetup).toHaveCount(1);
  await canonicalSetup.getByRole("button", { name: "Link Campaign Asset", exact: true }).click();
  const assetDrawer = page.getByRole("dialog", { name: "Link Campaign Asset", exact: true });
  await expect(assetDrawer.getByText("Select one explicit Brand Centre entity. Legacy Campaign Products are never converted or linked automatically.", { exact: true })).toBeVisible();
  await assetDrawer.getByRole("button", { name: /Final Gate Unlinked Product/ }).click();
  await assetDrawer.getByRole("button", { name: "Link Asset", exact: true }).click();
  const asset = page.locator("article").filter({ has: page.getByText("Final Gate Unlinked Product", { exact: true }) });
  await expect(asset).toHaveCount(1);
  await expect(asset).toBeVisible(); await asset.getByRole("button", { name: "Create Brief" }).click();
  const briefDrawer = page.getByRole("dialog", { name: "Create Canonical Brief", exact: true });
  await briefDrawer.getByLabel("Brief title").fill("Final Gate Linked Brief");
  await briefDrawer.getByLabel("Creative requirements").fill("Create an accepted deterministic local validation asset.");
  await briefDrawer.getByLabel("Format").fill("REEL_VIDEO");
  await briefDrawer.getByLabel("Deliverable requirements").fill("One local validation reel");
  await briefDrawer.getByRole("button", { name: "Create Brief", exact: true }).click();
  await expect(page.getByText("Final Gate Linked Brief")).toBeVisible();
  await keyboardProof(page); await shellAxe(runtime, page, "B06-campaign-asset-brief");
}

async function authenticatedApi(context: BrowserContext, method: "GET" | "POST", path: string, role: Exclude<FinalGateRole, "PUBLIC"> = "BRAND_OWNER") {
  const login = await context.request.post(`${API}/api/v1/auth/login`, { data: { email: ROLE_EMAILS[role], password: process.env.FINAL_GATE_FIXTURE_PASSWORD! } });
  expect(login.status()).toBe(200);
  const body = await login.json() as { accessToken: string };
  return context.request.fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${body.accessToken}` } });
}

async function b07(runtime: Runtime) {
  const { context, page } = await rolePage(runtime, "BRAND_OWNER");
  await page.goto(`${runtime.baseURL}/brand/uce/campaigns/${LEGACY}`);
  await expect(page.getByText("Objective unavailable", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /report|performance/i })).toHaveCount(0);
  await expect(page.getByText(/PULSE|PROOF|PRODUCTION|PUSH/)).toHaveCount(0);
  await expect(page.getByText(/impressions|click-through|engagement rate/i)).toHaveCount(0);
  await keyboardProof(page); await shellAxe(runtime, page, "B07-legacy-campaign");
  for (const [method, suffix] of [["GET", "reporting"], ["POST", "reporting/refresh-sync"]] as const) {
    const response = await authenticatedApi(context, method, `/api/v1/brand-uce/campaigns/${AWARENESS}/${suffix}`);
    expect(response.status()).toBe(409);
    const payload = JSON.stringify(await response.json());
    expect(payload).toContain("CAMPAIGN_REPORTING_CANONICAL_OBJECTIVE_UNAVAILABLE");
    expect(payload).not.toMatch(/impressions|engagementRate|timeSeries|assetGallery/i);
  }
}

async function b08(runtime: Runtime) {
  const creator = await rolePage(runtime, "CREATOR_OWNER");
  await creator.page.goto(`${runtime.baseURL}/creator/campaigns/opportunities/${AWARENESS}`);
  await expect(creator.page.getByText("Creator access could not be verified.")).toHaveCount(0);
  await creator.page.getByRole("button", { name: "Apply to this Brief" }).click();
  await expect(creator.page.getByRole("heading", { name: "Review Application" })).toBeVisible();
  await creator.page.getByRole("button", { name: "Submit Application", exact: true }).click();
  const submittedState = creator.page.getByRole("main").getByRole("status").filter({
    hasText: /^Application submitted\. Status: PENDING\.$/,
  });
  await expect(submittedState).toHaveCount(1);
  await expect(submittedState).toBeVisible();
  const brand = await rolePage(runtime, "BRAND_OWNER");
  await brand.page.goto(`${runtime.baseURL}/brand/uce/campaigns/${AWARENESS}`);
  await brand.page.getByRole("tab", { name: /Applicants/ }).click();
  await brand.page.getByRole("button", { name: "Approve" }).click();
  await creator.page.goto(`${runtime.baseURL}/creator/collaborations`);
  await expect(creator.page.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible();
  const collaborationThread = creator.page.getByRole("button").filter({
    has: creator.page.getByText(
      "Final Gate AWARENESS Campaign · Collaboration brief",
      { exact: true },
    ),
  });
  await expect(collaborationThread).toHaveCount(1);
  await expect(collaborationThread).toBeVisible();
  await keyboardProof(creator.page); await shellAxe(runtime, creator.page, "B08-c03-c04");
}

async function b09(runtime: Runtime) {
  for (const role of ["BRAND_OWNER", "FINANCE_ADMIN"] as const) {
    const { page } = await rolePage(runtime, role); await page.goto(`${runtime.baseURL}/brand/payouts`);
    await expect(page.getByRole("heading", { name: "Payouts", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /execute|retry payout|manual trigger/i })).toHaveCount(0);
    await shellAxe(runtime, page, `B09-${role}`);
  }
}

async function b10(runtime: Runtime) {
  const { page } = await rolePage(runtime, "CAMPAIGN_MANAGER"); await page.goto(`${runtime.baseURL}/brand/payouts`);
  await expect(page.getByRole("heading", { name: "Payouts", exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Payouts command availability", exact: true }).getByText("Operational read-only access", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Add funds|Brand Return|execute/i })).toHaveCount(0);
  await keyboardProof(page); await shellAxe(runtime, page, "B10-campaign-manager-payout");
}

async function b11(runtime: Runtime) {
  const { context, page } = await rolePage(runtime, "CREATOR_OWNER");
  const entryState = await authenticatedApi(context, "GET", "/api/v1/creator-entry/state", "CREATOR_OWNER");
  expect(entryState.status()).toBe(200);
  expect(await entryState.json()).toMatchObject({
    accountContext: "CREATOR_READY",
    onboardingStatus: "COMPLETE",
    canEnterCreatorPlatform: true,
    nextAction: "CREATOR_WORKSPACE_ENTRY",
  });

  await page.goto(`${runtime.baseURL}/creator/home`);
  await expect(page).toHaveURL(`${runtime.baseURL}/creator/home`);
  await expect(page.getByRole("heading", { name: "Welcome back, Final Gate Creator", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connect your professional Instagram", exact: true })).toHaveCount(0);
  await expect(page.getByText("Creator access could not be verified.")).toHaveCount(0);

  await page.goto(`${runtime.baseURL}/creator/centre`);
  await expect(page).toHaveURL(`${runtime.baseURL}/creator/home`);
  await expect(page.getByRole("heading", { name: "Welcome back, Final Gate Creator", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connect your professional Instagram", exact: true })).toHaveCount(0);

  await page.goto(`${runtime.baseURL}/creator/settings/account`);
  await expect(page.getByRole("heading", { name: "Account security", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByText("Creator access could not be verified.")).toHaveCount(0);

  await page.goto(`${runtime.baseURL}/creator/payouts`);
  await expect(page.getByRole("heading", { name: "Creator payouts", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No canonical payout totals yet", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByText("Creator access could not be verified.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /execute|retry payout|manual trigger/i })).toHaveCount(0);
  await keyboardProof(page); await shellAxe(runtime, page, "B11-creator-platform");
}

function instagramState(lifecycleState: string) {
  const retained = lifecycleState !== "NOT_CONNECTED";
  return { platform: "INSTAGRAM", lifecycleState,
    identity: { retained, handle: retained ? "final_gate_creator" : null, displayTitle: retained ? "Final Gate Creator" : null, avatarUrl: null },
    authorization: { health: lifecycleState === "CONNECTED_HEALTHY" ? "USABLE" : "UNKNOWN", reasonCode: null, basicCapability: lifecycleState === "CONNECTED_HEALTHY" ? "AVAILABLE" : "NOT_CONNECTED", insightsCapability: lifecycleState === "CONNECTED_HEALTHY" ? "AVAILABLE" : "NOT_CONNECTED", tokenExpiresAt: null, lastValidatedAt: null, lastMetadataSyncAt: null },
    allowedActions: { initialConnect: !retained, revalidate: lifecycleState === "PROVIDER_BLOCKED_RECOVERABLE", sameIdReconnect: false, disconnect: lifecycleState === "CONNECTED_HEALTHY" },
    recovery: { settingsAvailable: true, permanentIdentityRequired: true, differentAccountRequiresManualReview: true } };
}

async function b12(runtime: Runtime) {
  const manager = await rolePage(runtime, "CREATOR_MANAGER"); let state = instagramState("NOT_CONNECTED");
  await manager.context.route("**/api/v1/creator/settings/instagram", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(state) }));
  await manager.page.goto(`${runtime.baseURL}/creator/settings/instagram`); await expect(manager.page.getByText("No permanent Instagram identity")).toBeVisible();
  await expect(manager.page.getByText("Creator access could not be verified.")).toHaveCount(0);
  state = instagramState("CONNECTED_HEALTHY"); await manager.page.reload(); await expect(manager.page.getByText("Instagram connected", { exact: true })).toBeVisible();
  state = instagramState("PROVIDER_BLOCKED_RECOVERABLE"); await manager.page.reload(); await expect(manager.page.getByText("Instagram access is temporarily blocked")).toBeVisible();
  const assistant = await rolePage(runtime, "CREATOR_ASSISTANT"); await assistant.page.goto(`${runtime.baseURL}/creator/settings/account`); await expect(assistant.page).not.toHaveURL(/\/login/);
  await expect(assistant.page.getByText("Creator access could not be verified.")).toHaveCount(0);
  await assistant.page.goto(`${runtime.baseURL}/creator/payouts`);
  await expect(assistant.page.getByRole("heading", { name: "Creator payouts", exact: true })).toBeVisible();
  await expect(assistant.page.getByText("Payout workspace unavailable", { exact: true })).toBeVisible();
  await keyboardProof(manager.page); await shellAxe(runtime, manager.page, "B12-instagram-states");
}

const implementations: Record<string, (runtime: Runtime) => Promise<void>> = { B01: b01, B02: b02, B03: b03, B04: b04, B05: b05, B06: b06, B07: b07, B08: b08, B09: b09, B10: b10, B11: b11, B12: b12 };

for (const { scenario, width } of FINAL_GATE_EXECUTIONS) {
  const representative = REPRESENTATIVE_WIDTHS[scenario.id] === width;
  test(`${scenario.id} ${representative ? "REPRESENTATIVE" : "FINAL_MATRIX"} [${width}]`, async ({ browser, baseURL }) => {
    const runtime: Runtime = { browser, baseURL: String(baseURL), width, blocked: [], failures: [], contexts: [], axe: [] };
    prepareScenario(scenario.id);
    let scenarioError: unknown;
    try {
      await implementations[scenario.id](runtime);
      expect(runtime.blocked).toEqual([]); expect(runtime.failures).toEqual([]);
      await writeSanitizedJson(artifactPath("assertions", `${scenario.id}-${width}.json`), { scenario: scenario.id, width, representative, expectedFinalState: scenario.expectedFinalState, operations: scenario.orderedOperations, axe: runtime.axe, blocked: runtime.blocked.length });
    } catch (error) { scenarioError = error; }
    await Promise.all(runtime.contexts.map((context) => context.close()));
    let auditError: unknown;
    try { completeScenario(scenario.id); } catch (error) { auditError = error; }
    if (scenarioError) throw scenarioError;
    if (auditError) throw auditError;
  });
}
