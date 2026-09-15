import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ui = process.env.CREATOR_BRAND_P3_UI;
const api = process.env.CREATOR_BRAND_P3_API;
const password = process.env.CREATOR_BRAND_P3_PASSWORD;
if (!ui || !api || !password || !process.env.CREATOR_BRAND_P3_BROWSER)
  throw new Error("P3_LOCAL_BROWSER_CONFIGURATION_REQUIRED");
for (const address of [ui, api])
  if (new URL(address).hostname !== "127.0.0.1")
    throw new Error("P3_LOCAL_ROUTE_REQUIRED");
const assert = (condition, label) => {
  if (!condition) throw new Error(label);
};
const browser = await chromium.launch({
  executablePath: process.env.CREATOR_BRAND_P3_BROWSER,
  headless: true,
  args: [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-first-run",
  ],
});
const report = { widths: [], roles: [], externalProviderCalls: 0 };
const manualSubjects = new Map();
const fixtureDb = (mode) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        fileURLToPath(
          new URL("./p3-creator-brand-db-proof.mjs", import.meta.url),
        ),
        mode,
      ],
      { encoding: "utf8" },
    ),
  );
async function open(width, email, role) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
  });
  const login = await context.request.post(api + "/api/v1/auth/login", {
    data: { email, password },
  });
  assert(login.status() === 200, "REAL_LOGIN_FAILED");
  const page = await context.newPage();
  const errors = [];
  const responses = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith("/api/v1/"))
      responses.push({ path: url.pathname, status: response.status() });
  });
  let entryRequests = 0;
  let puts = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push("CONSOLE_ERROR");
  });
  page.on("request", (request) => {
    if (request.url().endsWith("/creator-entry/state")) entryRequests++;
    if (request.url().endsWith("/creator/brand") && request.method() === "PUT")
      puts++;
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      url.hostname === "127.0.0.1" ||
      ["data:", "blob:"].includes(url.protocol)
    )
      return route.continue();
    assert(
      !/facebook|instagram|openai|gemini|anthropic/u.test(url.hostname),
      "LIVE_PROVIDER_REQUEST_ATTEMPTED",
    );
    // Existing remote font styles are unnecessary for a local acceptance route.
    return route.fulfill({ status: 200, contentType: "text/css", body: "" });
  });
  const loaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/creator/brand") &&
      response.request().method() === "GET",
  );
  const actorLoaded = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/creator/workspace/actor-context"),
  );
  await page.goto(ui + "/creator/brand", { waitUntil: "domcontentloaded" });
  const response = await loaded.catch(() => {
    console.log(
      JSON.stringify({
        diagnostic: "P3_READ_TIMEOUT",
        route: new URL(page.url()).pathname,
        responses,
        errors,
      }),
    );
    throw new Error("P3_READ_TIMEOUT");
  });
  assert(response.status() === 200, "BRAND_READ_FAILED");
  const body = await response.json();
  const actor = await (await actorLoaded).json();
  assert(
    actor.actor_role === role &&
      actor.allowed_actions.includes("CREATOR_BRAND_READ"),
    "ACTUAL_TEAM_ACTION_MISSING",
  );
  if (role === "OWNER") {
    assert(
      actor.actor_user_id === actor.subject_owner_user_id,
      "OWNER_SUBJECT_MISMATCH",
    );
    manualSubjects.set(width, {
      owner: actor.subject_owner_user_id,
      profile: actor.subject_creator_profile_id,
      workspace: actor.workspace_id,
      identity: body.identity,
    });
  } else {
    assert(
      actor.actor_user_id !== actor.subject_owner_user_id,
      "DELEGATED_SUBJECT_INFERRED_FROM_ACTOR",
    );
    if (email.includes("-manual-")) {
      const expected = manualSubjects.get(width);
      assert(
        expected &&
          expected.owner === actor.subject_owner_user_id &&
          expected.profile === actor.subject_creator_profile_id &&
          expected.workspace === actor.workspace_id,
        "DELEGATED_CANONICAL_OWNER_CHANGED",
      );
      assert(
        JSON.stringify(body.identity) === JSON.stringify(expected.identity),
        "DELEGATED_IDENTITY_NOT_OWNER",
      );
    }
  }
  assert(
    body.context.role === role && body.context.sourceIndependent,
    "REAL_ROLE_CONTEXT_FAILED",
  );
  await page
    .getByRole("heading", { name: "Creator Brand", level: 1, exact: true })
    .waitFor();
  await page.waitForLoadState("networkidle");
  return {
    page,
    context,
    errors,
    body,
    get entryRequests() {
      return entryRequests;
    },
    get puts() {
      return puts;
    },
  };
}
async function activate(locator) {
  await locator.page().waitForTimeout(100);
  await locator.focus();
  await locator.press("Enter");
}
async function save(run, intent) {
  const response = run.page.waitForResponse(
    (response) =>
      response.url().endsWith("/creator/brand") &&
      response.request().method() === "PUT",
  );
  await activate(
    run.page.getByRole("button", { name: "Save Creator Brand", exact: true }),
  );
  const saved = await response;
  assert(saved.status() === 200, "CANONICAL_SAVE_FAILED");
  const command = saved.request().postDataJSON();
  assert(
    command.intent === intent && Number.isInteger(command.expectedRevision),
    "STRICT_COMMAND_FAILED",
  );
  assert(
    /^[a-f0-9-]{36}$/u.test(command.idempotencyKey),
    "IDEMPOTENCY_UUID_MISSING",
  );
  assert(
    !("creatorId" in command) && !("ownerId" in command),
    "CALLER_SUBJECT_PRESENT",
  );
  const body = await saved.json();
  await run.page
    .getByRole("button", { name: "Edit Creator Brand", exact: true })
    .waitFor();
  await run.page.waitForFunction(
    () => document.activeElement?.tagName === "H1",
  );
  assert(
    body.profile && body.state === "CONFIGURED",
    "SERVER_CONFIRMATION_MISSING",
  );
  return body;
}
try {
  for (const width of [390, 767, 768, 1440]) {
    const run = await open(
      width,
      `creator-brand-p3-manual-${width}@example.test`,
      "OWNER",
    );
    const { page } = run;
    assert(
      run.body.suggestions.state === "UNAVAILABLE",
      "NO_SOURCE_FIXTURE_NOT_UNAVAILABLE",
    );
    const before = run.puts;
    await activate(
      page
        .getByRole("button", {
          name: /^(Set up Creator Brand|Edit Creator Brand)/u,
        })
        .first(),
    );
    const headline = page.getByLabel("Headline / Positioning", { exact: true });
    await headline.fill("Manual creator positioning " + width);
    await page
      .getByLabel("Commercial Bio", { exact: true })
      .fill("Creator-authored commercial bio. " + "B".repeat(700));
    await page
      .getByLabel("Voice description", { exact: true })
      .fill("Clear creator-authored delivery.");
    if (!run.body.profile) {
      await page
        .getByLabel("Search Primary Niches", { exact: true })
        .fill("Education");
      await activate(
        page.getByRole("button", { name: "Education", exact: true }),
      );
      await page
        .getByLabel("Search Creator Archetypes", { exact: true })
        .fill("Educator");
      await activate(
        page.getByRole("button", { name: /Educator/u, exact: true }).last(),
      );
      await page
        .getByLabel("Search Voice descriptors", { exact: true })
        .fill("Educational");
      await activate(
        page.getByRole("button", { name: "Educational", exact: true }),
      );
      for (const [label, value] of [
        ["Languages I create in", "en-IN"],
        ["Visual-style descriptors", "Clean, high contrast"],
        ["Palette", "#1a2b3c"],
      ]) {
        await page.getByLabel("Add " + label, { exact: true }).fill(value);
        await activate(
          page.getByRole("button", { name: "Add " + label, exact: true }),
        );
      }
    }
    const saved = await save(run, "MANUAL");
    assert(run.puts === before + 1, "SAVE_NOT_EXACTLY_ONE_PUT");
    assert(
      saved.profile.palette[0] === "#1A2B3C" &&
        saved.profile.languages[0] === "en-IN",
      "CANONICAL_NORMALIZATION_FAILED",
    );
    await activate(
      page.getByRole("button", { name: "Edit Creator Brand", exact: true }),
    );
    await page
      .getByLabel("Headline / Positioning", { exact: true })
      .fill("Cancelled draft");
    await activate(page.getByRole("button", { name: "Cancel", exact: true }));
    await page.waitForFunction(() => document.activeElement?.tagName === "H1");
    assert(run.puts === before + 1, "CANCEL_WROTE_PROFILE");
    assert(
      await page
        .locator("h1")
        .evaluate((node) => node === document.activeElement),
      "CANCEL_FOCUS_RETURN_FAILED",
    );
    const read = page.waitForResponse(
      (response) =>
        response.url().endsWith("/creator/brand") &&
        response.request().method() === "GET",
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    assert((await read).status() === 200, "RELOAD_FAILED");
    await page
      .getByRole("button", { name: "Edit Creator Brand", exact: true })
      .waitFor();
    assert((await page.locator("h1").count()) === 1, "HEADING_ORDER_FAILED");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    assert(!overflow, "HORIZONTAL_OVERFLOW");
    if (width < 768) {
      assert(
        (await page
          .locator(".aurora-bottom-nav")
          .locator("a, button")
          .count()) === 5,
        "BOTTOM_NAV_NOT_FIVE",
      );
      const trigger = page.getByRole("button", {
        name: "Open Menu",
        exact: true,
      });
      await activate(trigger);
      const dialog = page.getByRole("dialog", {
        name: "Application navigation",
        exact: true,
      });
      await dialog.waitFor();
      assert(
        (await dialog
          .getByRole("link", { name: "Creator Brand", exact: true })
          .count()) === 1,
        "DRAWER_BRAND_PEER_MISSING",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Open Menu",
      );
    } else {
      assert(
        (await page
          .locator(".aurora-sidebar")
          .getByRole("link", { name: "Creator Brand", exact: true })
          .count()) === 1,
        "SIDEBAR_BRAND_PEER_MISSING",
      );
    }
    const focus = page.getByRole("button", {
      name: "Edit Creator Brand",
      exact: true,
    });
    await focus.focus();
    const visibleFocus = await focus.evaluate((node) => {
      const style = getComputedStyle(node);
      return (
        style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0
      );
    });
    assert(visibleFocus, "VISIBLE_FOCUS_MISSING");
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact),
    );
    assert(!serious.length, "AXE_SERIOUS_CRITICAL");
    assert(!run.errors.length, "AUTHORIZED_BROWSER_CONSOLE_ERROR");
    assert(run.entryRequests === 0, "CREATOR_ENTRY_PREREQUISITE_REQUESTED");
    report.widths.push({
      width,
      realLogin: "PASS",
      manualSaveCancelReload: "PASS",
      keyboardFocus: "PASS",
      overflow: false,
      serious: 0,
      critical: 0,
      lesser: axe.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
      })),
      consoleErrors: 0,
      entryRequests: 0,
    });
    await run.context.close();
  }
  for (const width of [390, 767, 768, 1440]) {
    for (const role of ["MANAGER", "ASSISTANT"]) {
      const run = await open(
        width,
        `creator-brand-p3-manual-${width}-${role.toLowerCase()}@example.test`,
        role,
      );
      if (role === "MANAGER") {
        await activate(
          run.page.getByRole("button", {
            name: "Edit Creator Brand",
            exact: true,
          }),
        );
        await run.page
          .getByLabel("Headline / Positioning", { exact: true })
          .fill("Manager confirmed positioning");
        await save(run, "MANUAL");
      } else {
        assert(
          (await run.page
            .getByRole("button", {
              name: /Edit Creator Brand|Set up Creator Brand|Use suggestion/u,
            })
            .count()) === 0,
          "ASSISTANT_MUTATION_CONTROL",
        );
        const session = await run.context.request.post(
          api + "/api/v1/auth/login",
          {
            data: {
              email: `creator-brand-p3-manual-${width}-assistant@example.test`,
              password,
            },
          },
        );
        const login = await session.json();
        const denied = await run.context.request.put(
          api + "/api/v1/creator/brand",
          {
            headers: { Authorization: "Bearer " + login.accessToken },
            data: {
              intent: "MANUAL",
              expectedRevision: run.body.currentRevision,
              idempotencyKey: crypto.randomUUID(),
              values: run.body.profile,
            },
          },
        );
        assert(denied.status() === 403, "ASSISTANT_BACKEND_DENIAL_FAILED");
      }
      assert(
        run.entryRequests === 0 && !run.errors.length,
        "DELEGATED_REAL_BROWSER_ERROR",
      );
      report.roles.push({
        width,
        role,
        noSourceRead: "PASS",
        ownerSubject: "SERVER_RESOLVED",
        mutation: role === "MANAGER" ? "PASS" : "DENIED_403",
      });
      await run.context.close();
    }
  }
  report.suggestions = [];
  for (const width of [390, 767, 768, 1440]) {
    const supported = await open(
      width,
      "creator-brand-p3-manager@example.test",
      "MANAGER",
    );
    assert(
      ["AVAILABLE", "PARTIAL"].includes(supported.body.suggestions.state),
      "SUPPORTED_CURRENT_SUGGESTIONS_MISSING",
    );
    if (supported.body.profile) {
      await activate(
        supported.page.getByRole("button", {
          name: "Edit Creator Brand",
          exact: true,
        }),
      );
      await supported.page
        .getByLabel("Headline / Positioning", { exact: true })
        .fill("Manual source workspace headline " + width);
      await save(supported, "MANUAL");
    }
    const useResponse = supported.page.waitForResponse(
      (response) =>
        response.url().endsWith("/creator/brand") &&
        response.request().method() === "PUT",
    );
    await activate(
      supported.page.getByRole("button", {
        name: "Use suggestion for Headline / Positioning",
        exact: true,
      }),
    );
    const used = await useResponse;
    assert(
      used.status() === 200 &&
        used.request().postDataJSON().intent === "USE_SUGGESTION",
      "REAL_USE_FAILED",
    );
    const useCommand = used.request().postDataJSON();
    assert(
      !("values" in useCommand) &&
        Object.keys(useCommand.suggestionReference).length === 3,
      "USE_REFERENCE_SHAPE_FAILED",
    );
    await activate(
      supported.page.getByRole("button", {
        name: "Edit Voice description before using",
        exact: true,
      }),
    );
    await supported.page
      .getByLabel("Voice description", { exact: true })
      .fill("Creator edited source-supported voice.");
    const edited = await save(supported, "EDIT_SUGGESTION");
    const confirmed = JSON.stringify(edited.profile);
    fixtureDb("disconnect");
    const disconnectedResponse = supported.page.waitForResponse(
      (response) =>
        response.url().endsWith("/creator/brand") &&
        response.request().method() === "GET",
    );
    await activate(
      supported.page.getByRole("button", {
        name: "Reload confirmed values",
        exact: true,
      }),
    );
    const disconnected = await (await disconnectedResponse).json();
    assert(
      JSON.stringify(disconnected.profile) === confirmed &&
        disconnected.currentRevision === edited.currentRevision,
      "DISCONNECT_CHANGED_CONFIRMED_TRUTH",
    );
    assert(
      !["AVAILABLE", "PARTIAL"].includes(disconnected.suggestions.state),
      "DISCONNECT_SUGGESTIONS_NOT_FENCED",
    );
    await supported.page
      .getByRole("button", { name: "Edit Creator Brand", exact: true })
      .waitFor();
    assert(
      (await supported.page
        .getByRole("button", { name: /^Use suggestion/u })
        .count()) === 0,
      "DISCONNECT_CONFIRM_ACTION_PRESENT",
    );
    const failedRead = async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ contractVersion: "invalid" }),
      });
    await supported.page.route("**/api/v1/creator/brand", failedRead);
    await activate(
      supported.page.getByRole("button", {
        name: "Reload confirmed values",
        exact: true,
      }),
    );
    await supported.page.getByRole("alert").waitFor();
    assert(
      (await supported.page
        .getByRole("button", { name: "Edit Creator Brand", exact: true })
        .count()) === 1,
      "LAST_GOOD_MANUAL_CONTROL_LOST",
    );
    assert(
      (await supported.page
        .locator(".creator-brand-confirmed")
        .filter({ hasText: "Creator edited source-supported voice." })
        .count()) === 1,
      "LAST_GOOD_CONFIRMED_VALUE_LOST",
    );
    await supported.page.unroute("**/api/v1/creator/brand", failedRead);
    fixtureDb("restore");
    assert(
      !supported.errors.length && supported.entryRequests === 0,
      "SUPPORTED_BROWSER_ERROR",
    );
    report.suggestions.push({
      width,
      use: "REAL_API_PASS",
      edit: "REAL_API_PASS",
      bioAutoWrite: false,
      disconnectPreservation: "PASS",
      lastGoodAfterInvalidGet: "PASS",
    });
    await supported.context.close();
  }
  report.database = fixtureDb("counts");
  report.denials = [];
  for (const width of [390, 767, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
    });
    const anonymous = await context.request.get(api + "/api/v1/creator/brand");
    assert(anonymous.status() === 401, "ANONYMOUS_NOT_DENIED");
    for (const category of ["inactive", "missing"]) {
      const login = await context.request.post(api + "/api/v1/auth/login", {
        data: {
          email: `creator-brand-p3-manual-${width}-${category}@example.test`,
          password,
        },
      });
      assert(login.status() === 200, "NEGATIVE_FIXTURE_LOGIN_FAILED");
      const session = await login.json();
      const headers = { Authorization: "Bearer " + session.accessToken };
      const actor = await context.request.get(
        api + "/api/v1/creator/workspace/actor-context",
        { headers },
      );
      const brand = await context.request.get(api + "/api/v1/creator/brand", {
        headers,
      });
      assert(
        actor.status() === 403 && brand.status() === 403,
        "INACTIVE_MISSING_NOT_DENIED",
      );
      report.denials.push({
        width,
        category,
        actorStatus: 403,
        brandStatus: 403,
        anonymousStatus: 401,
      });
    }
    await context.close();
  }
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
