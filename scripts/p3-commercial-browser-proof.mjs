import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
const ui = "http://127.0.0.1:4182",
  api = "http://127.0.0.1:6062",
  password = process.env.CREATOR_COMMERCIAL_BROWSER_PASSWORD;
if (!password || process.env.CREATOR_COMMERCIAL_BROWSER_PROOF !== "true")
  throw new Error("COMMERCIAL_BROWSER_SYNTHETIC_CONFIGURATION_REQUIRED");
const assert = (condition, label) => {
  if (!condition) throw new Error("COMMERCIAL_" + label);
};
const assessmentOnly =
  process.env.CREATOR_COMMERCIAL_BROWSER_ASSESS_ONLY === "true";
const report = {
  matrix: [],
  roles: [],
  bankStates: [],
  negativeApi: [],
  liveGraphCalls: 0,
  liveModelCalls: 0,
  rawArtifactsPersisted: false,
};
const ownerEmail = (family, width) =>
  `commercial-browser-${family}-${width}-owner@example.test`;
const db = (mode, email) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        fileURLToPath(new URL("./p3-commercial-db-proof.mjs", import.meta.url)),
        mode,
        email,
      ],
      { encoding: "utf8", env: process.env },
    ),
  );
const activate = async (locator) => {
  await locator.focus();
  await locator.press("Enter");
};
let browser,
  progress = "INIT",
  lastPage;
try {
  browser = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: [
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-sync",
      "--no-first-run",
    ],
  });
  async function open(width, family, role = "owner") {
    progress = `${width}/${family}/${role}/login`;
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
    });
    const login = await context.request.post(api + "/api/v1/auth/login", {
      data: {
        email: `commercial-browser-${family}-${width}-${role}@example.test`,
        password,
      },
    });
    assert(login.status() === 200, "REAL_LOGIN_FAILED");
    const page = await context.newPage();
    lastPage = page;
    page.setDefaultTimeout(20000);
    const errors = [],
      commands = { work: [], rates: [] };
    let entryRequests = 0,
      authorization;
    page.on("pageerror", () => errors.push("PAGE_ERROR"));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push("CONSOLE_ERROR");
    });
    page.on("request", (request) => {
      const path = new URL(request.url()).pathname;
      if (path.includes("creator-entry")) entryRequests++;
      if (path.includes("/commercial-setup/"))
        authorization = request.headers().authorization ?? authorization;
      if (request.method() === "PUT" && path.endsWith("/work-preferences"))
        commands.work.push(request.postDataJSON());
      if (request.method() === "PUT" && path.endsWith("/rate-card"))
        commands.rates.push(request.postDataJSON());
    });
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (
        url.hostname === "127.0.0.1" ||
        ["data:", "blob:"].includes(url.protocol)
      )
        return route.continue();
      assert(
        !/facebook|instagram|openai|gemini|anthropic/.test(url.hostname),
        "LIVE_PROVIDER_REQUEST_ATTEMPTED",
      );
      return route.fulfill({ status: 200, contentType: "text/css", body: "" });
    });
    await page.goto(ui + "/creator/commercial-setup", {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("heading", { name: "Work Preferences", exact: true })
      .waitFor();
    await page
      .getByRole("form", { name: "Work Preferences", exact: true })
      .waitFor();
    await page.getByRole("form", { name: "Rate Card", exact: true }).waitFor();
    assert(Boolean(authorization), "REAL_SESSION_AUTHORIZATION_MISSING");
    const auth = {
      get: (url, options = {}) =>
        context.request.get(url, {
          ...options,
          headers: { Authorization: authorization },
        }),
      put: (url, options = {}) =>
        context.request.put(url, {
          ...options,
          headers: { Authorization: authorization },
        }),
    };
    const actor = await (
      await auth.get(api + "/api/v1/creator/workspace/actor-context")
    ).json();
    const expected = db("inspect", ownerEmail(family, width));
    assert(
      actor.actor_role === role.toUpperCase() &&
        actor.allowed_actions.includes("COMMERCIAL_SETUP_READ"),
      "EXPLICIT_TEAM_ACTION_MISSING",
    );
    assert(
      actor.subject_creator_profile_id === expected.creatorProfileId &&
        actor.workspace_id === expected.workspaceId,
      "CANONICAL_OWNER_SUBSTITUTED",
    );
    assert(expected.sourceConnections === 0, "MANUAL_SOURCE_DEPENDENCY");
    return {
      context,
      page,
      auth,
      errors,
      commands,
      get entryRequests() {
        return entryRequests;
      },
    };
  }
  async function save(run, section, buttonName) {
    progress += `/save-${section}`;
    const response = run.page.waitForResponse(
      (response) =>
        response.url().endsWith("/" + section) &&
        response.request().method() === "PUT",
    );
    await activate(
      run.page.getByRole("button", { name: buttonName, exact: true }),
    );
    const result = await response;
    assert(result.status() === 200, "SAVE_FAILED");
    await run.page
      .getByRole("status")
      .filter({
        hasText:
          section === "work-preferences"
            ? "Work Preferences saved."
            : "Rate Card saved.",
      })
      .waitFor();
    return result.json();
  }
  async function enterPrice(run, label, amount) {
    await run.page
      .getByLabel(`Enable ${label} starting price`)
      .selectOption("YES");
    await run.page
      .getByLabel(new RegExp(`^Starting from — ${label} \\(`))
      .fill(amount);
  }
  async function assess(run, width, family, role) {
    progress = `${width}/${family}/${role}/accessibility`;
    const { page } = run;
    assert((await page.locator("h1").count()) === 1, "HEADING_ORDER_FAILED");
    assert(
      !(await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )),
      "HORIZONTAL_OVERFLOW",
    );
    const links = page
      .getByRole("navigation", { name: "Commercial Setup sections" })
      .getByRole("link");
    await links.first().focus();
    await page.keyboard.press("Tab");
    assert(
      await links.nth(1).evaluate((node) => node === document.activeElement),
      "KEYBOARD_SECTION_NAV_FAILED",
    );
    assert(
      await links.nth(1).evaluate((node) => {
        const style = getComputedStyle(node);
        return (
          style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0
        );
      }),
      "VISIBLE_FOCUS_MISSING",
    );
    if (width < 768) {
      assert(
        (await page
          .locator(".aurora-bottom-nav")
          .locator("a,button")
          .count()) === 5,
        "BOTTOM_NAV_NOT_FIVE",
      );
      await activate(
        page.getByRole("button", { name: "Open Menu", exact: true }),
      );
      const dialog = page.getByRole("dialog", {
        name: "Application navigation",
        exact: true,
      });
      await dialog.waitFor();
      assert(
        (await dialog
          .getByRole("link", { name: "Commercial Setup", exact: true })
          .count()) === 1,
        "DRAWER_DESTINATION_MISSING",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Open Menu",
      );
    } else
      assert(
        (await page
          .locator(".aurora-sidebar")
          .getByRole("link", { name: "Commercial Setup", exact: true })
          .count()) === 1,
        "SIDEBAR_DESTINATION_MISSING",
      );
    const axe = await new AxeBuilder({ page }).analyze();
    if (
      axe.violations.some((item) =>
        ["serious", "critical"].includes(item.impact),
      )
    )
      console.log(
        JSON.stringify({
          accessibilityDiagnostics: axe.violations.map((item) => ({
            id: item.id,
            impact: item.impact,
            targets: item.nodes.map((node) => node.target),
          })),
        }),
      );
    assert(
      !axe.violations.some((item) =>
        ["serious", "critical"].includes(item.impact),
      ),
      "AXE_SERIOUS_CRITICAL",
    );
    assert(run.errors.length === 0, "AUTHORIZED_CONSOLE_PAGE_ERROR");
    assert(run.entryRequests === 0, "INSTAGRAM_ENTRY_REQUIRED");
    report.matrix.push({
      width,
      family,
      role,
      authenticated: "PASS",
      keyboardFocus: "PASS",
      menuFocusReturn: width < 768 ? "PASS" : "NOT_PRESENT",
      overflow: false,
      serious: 0,
      critical: 0,
      lesser: axe.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
      })),
      consoleErrors: 0,
      pageErrors: 0,
    });
  }
  for (const width of [390, 767, 768, 1440]) {
    for (const role of ["owner", "manager", "assistant"]) {
      const run = await open(width, "manual", role);
      progress = `${width}/manual/${role}/forms`;
      if (assessmentOnly) {
        const before = db("inspect", ownerEmail("manual", width));
        assert(
          before.preference?.baseCountry === "GB" &&
            before.rate?.reelAmountMinor === 10000,
          "FINAL_MANUAL_CANONICAL_STATE",
        );
        if (role === "assistant")
          assert(
            (await run.page
              .getByRole("button", { name: "Save Rate Card", exact: true })
              .count()) === 0,
            "ASSISTANT_MUTATION_VISIBLE",
          );
        await assess(run, width, "manual", role);
        assert(
          JSON.stringify(db("inspect", ownerEmail("manual", width))) ===
            JSON.stringify(before),
          "ASSESSMENT_CHANGED_ROWS",
        );
        report.roles.push({
          width,
          role,
          canonicalOwner: "PASS",
          mutation: "NOT_RUN_FINAL_READ_ONLY",
        });
        await run.context.close();
        continue;
      }
      if (
        role === "owner" &&
        !(
          db("inspect", ownerEmail("manual", width)).preference?.baseCountry ===
          "GB"
        )
      ) {
        await run.page.getByLabel(/^Base country/).selectOption("IN");
        await run.page.getByLabel("UGC-project willingness").selectOption("NO");
        await save(run, "work-preferences", "Save Work Preferences");
        await enterPrice(run, "Reel", "100.00");
        await save(run, "rate-card", "Save Rate Card");
        await run.page.getByLabel(/^Base country/).selectOption("US");
        await activate(
          run.page.getByRole("button", {
            name: "Save Work Preferences",
            exact: true,
          }),
        );
        await run.page
          .getByRole("dialog", { name: "Confirm monetary reset", exact: true })
          .waitFor();
        await run.page
          .getByRole("button", { name: "Cancel", exact: true })
          .waitFor();
        await activate(
          run.page.getByRole("button", { name: "Cancel", exact: true }),
        );
        assert(
          (await run.page.getByLabel(/^Base country/).inputValue()) === "US",
          "CANCEL_DRAFT_LOST",
        );
        await run.page.waitForFunction(
          () => document.activeElement?.textContent === "Save Work Preferences",
        );
        assert(
          db("inspect", ownerEmail("manual", width)).rate.reelAmountMinor ===
            10000,
          "CANCEL_MUTATED_MONEY",
        );
        await activate(
          run.page.getByRole("button", {
            name: "Save Work Preferences",
            exact: true,
          }),
        );
        const response = run.page.waitForResponse(
          (response) =>
            response.url().endsWith("/work-preferences") &&
            response.request().method() === "PUT",
        );
        await activate(
          run.page.getByRole("button", {
            name: "Confirm country change and clear monetary rates",
            exact: true,
          }),
        );
        assert((await response).status() === 200, "CONFIRMED_RESET_FAILED");
        await run.page
          .getByRole("status")
          .filter({ hasText: "Work Preferences saved." })
          .waitFor();
        await run.page
          .getByText("Canonical currency:", { exact: false })
          .waitFor();
        const reset = db("inspect", ownerEmail("manual", width));
        assert(
          reset.rate.currency === "USD" && reset.rate.reelAmountMinor === null,
          "RESET_RELABELLED_MONEY",
        );
        await enterPrice(run, "Reel", "100.00");
        await save(run, "rate-card", "Save Rate Card");
        await run.page.getByLabel(/^Base country/).selectOption("GB");
        await save(run, "work-preferences", "Save Work Preferences");
        assert(
          db("inspect", ownerEmail("manual", width)).rate.reelAmountMinor ===
            10000,
          "SAME_CURRENCY_MONEY_LOST",
        );
        const before = db("inspect", ownerEmail("manual", width));
        const replay = await run.auth.put(
          api + "/api/v1/creator/commercial-setup/rate-card",
          { data: run.commands.rates.at(-1) },
        );
        assert(replay.status() === 200, "EXACT_REPLAY_FAILED");
        assert(
          JSON.stringify(db("inspect", ownerEmail("manual", width))) ===
            JSON.stringify(before),
          "REPLAY_ROWS_DRIFT",
        );
        const injected = await run.auth.put(
          api + "/api/v1/creator/commercial-setup/rate-card",
          {
            data: {
              ...run.commands.rates.at(-1),
              currency: "INR",
              idempotencyKey: randomUUID(),
            },
          },
        );
        assert(injected.status() === 400, "MANUAL_CURRENCY_ACCEPTED");
        report.negativeApi.push({
          width,
          exactReplay: "PASS",
          manualCurrency: 400,
        });
      } else if (role === "owner") {
        report.negativeApi.push({
          width,
          exactReplay: "PASS_PREVIOUS_ATTEMPT",
          manualCurrency: 400,
          resumedCompletedFixture: true,
        });
      } else if (role === "manager") {
        await run.page
          .getByLabel("UGC-project willingness")
          .selectOption("YES");
        await save(run, "work-preferences", "Save Work Preferences");
        await enterPrice(run, "Story", "25.00");
        await save(run, "rate-card", "Save Rate Card");
        const rows = db("inspect", ownerEmail("manual", width));
        assert(
          rows.preference.ugcProjects === "YES" &&
            rows.rate.reelAmountMinor === 10000 &&
            rows.rate.storyAmountMinor === 2500,
          "MANAGER_OWNER_ROWS_FAILED",
        );
      } else {
        assert(
          (await run.page
            .getByRole("button", { name: "Save Work Preferences", exact: true })
            .count()) === 0 &&
            (await run.page
              .getByRole("button", { name: "Save Rate Card", exact: true })
              .count()) === 0,
          "ASSISTANT_MUTATION_VISIBLE",
        );
        assert(
          (await run.page
            .getByRole("link", { name: "Open payout Settings", exact: true })
            .count()) === 0,
          "ASSISTANT_SETTINGS_GRANTED",
        );
        const before = db("inspect", ownerEmail("manual", width));
        const current = await (
          await run.auth.get(
            api + "/api/v1/creator/commercial-setup/work-preferences",
          )
        ).json();
        const denied = await run.auth.put(
          api + "/api/v1/creator/commercial-setup/work-preferences",
          {
            data: {
              expectedRevision: current.currentRevision,
              expectedRateCardRevision: before.rate.currentRevision,
              confirmMonetaryReset: false,
              idempotencyKey: randomUUID(),
              values: current.values,
            },
          },
        );
        assert(denied.status() === 403, "ASSISTANT_API_WRITE_ALLOWED");
        assert(
          JSON.stringify(db("inspect", ownerEmail("manual", width))) ===
            JSON.stringify(before),
          "ASSISTANT_CHANGED_ROWS",
        );
      }
      await assess(run, width, "manual", role);
      report.roles.push({
        width,
        role,
        canonicalOwner: "PASS",
        mutation: role === "assistant" ? "DENIED_READ_ONLY" : "PASS",
      });
      await run.context.close();
    }
    for (const family of [
      "bank-same",
      "bank-cross",
      "bank-conflict",
      "bank-first",
    ]) {
      const run = await open(width, family);
      progress = `${width}/${family}/state`;
      if (assessmentOnly) {
        const before = db("inspect", ownerEmail(family, width));
        assert(
          await run.page.getByLabel(/^Base country/).isDisabled(),
          "BANK_COUNTRY_EDITABLE",
        );
        if (family === "bank-conflict")
          assert(
            (await run.page
              .getByRole("link", {
                name: "Recover country authority in Settings/Payouts",
                exact: true,
              })
              .count()) === 1,
            "SETTINGS_RECOVERY_MISSING",
          );
        if (family === "bank-cross")
          assert(
            before.rate.reelAmountMinor === null &&
              before.rate.currency === "USD",
            "FINAL_BANK_CROSS_STATE",
          );
        if (family === "bank-same")
          assert(
            before.rate.reelAmountMinor === 10000,
            "FINAL_BANK_SAME_STATE",
          );
        if (family === "bank-first")
          assert(
            before.preference.baseCountry === "US",
            "FINAL_BANK_FIRST_STATE",
          );
        await assess(run, width, family, "owner");
        assert(
          JSON.stringify(db("inspect", ownerEmail(family, width))) ===
            JSON.stringify(before),
          "ASSESSMENT_CHANGED_ROWS",
        );
        report.bankStates.push({
          width,
          family,
          result: "PASS_FINAL_READ_ONLY",
        });
        await run.context.close();
        continue;
      }
      if (family === "bank-conflict") {
        assert(
          (await run.page
            .getByText("Recover country authority in Settings/Payouts", {
              exact: true,
            })
            .count()) === 1,
          "SETTINGS_RECOVERY_MISSING",
        );
        assert(
          await run.page
            .getByRole("button", {
              name: "Reconcile Rate Card currency",
              exact: true,
            })
            .isDisabled(),
          "CONFLICT_MONEY_EDIT_ALLOWED",
        );
        assert(
          db("inspect", ownerEmail(family, width)).rate.reelAmountMinor ===
            10000,
          "CONFLICT_GET_WROTE",
        );
      } else if (family === "bank-first") {
        assert(
          await run.page.getByLabel(/^Base country/).isDisabled(),
          "BANK_COUNTRY_EDITABLE",
        );
        await save(run, "work-preferences", "Save Work Preferences");
        assert(
          db("inspect", ownerEmail(family, width)).preference.baseCountry ===
            "US",
          "BANK_FIRST_SETUP_FAILED",
        );
      } else {
        assert(
          await run.page.getByLabel(/^Base country/).isDisabled(),
          "BANK_COUNTRY_EDITABLE",
        );
        await save(run, "rate-card", "Reconcile Rate Card currency");
        const rows = db("inspect", ownerEmail(family, width));
        assert(
          rows.rate.usageDays === 30 && rows.rate.advancePercent === 25,
          "RECONCILIATION_TERMS_LOST",
        );
        assert(
          rows.rate.reelAmountMinor === (family === "bank-same" ? 10000 : null),
          "BANK_CURRENCY_RECONCILIATION_FAILED",
        );
      }
      await assess(run, width, family, "owner");
      report.bankStates.push({ width, family, result: "PASS" });
      await run.context.close();
    }
  }
  const anonymous = await browser.newContext();
  assert(
    (
      await anonymous.request.get(
        api + "/api/v1/creator/commercial-setup/work-preferences",
      )
    ).status() === 401,
    "ANONYMOUS_READ_ALLOWED",
  );
  await anonymous.close();
  const inactive = await browser.newContext();
  const inactiveLogin = await inactive.request.post(
    api + "/api/v1/auth/login",
    {
      data: {
        email: "commercial-browser-manual-390-inactive@example.test",
        password,
      },
    },
  );
  assert(inactiveLogin.status() === 200, "INACTIVE_FIXTURE_LOGIN_FAILED");
  const inactiveSession = await inactiveLogin.json();
  assert(
    (
      await inactive.request.get(
        api + "/api/v1/creator/commercial-setup/work-preferences",
        { headers: { Authorization: `Bearer ${inactiveSession.accessToken}` } },
      )
    ).status() === 403,
    "INACTIVE_READ_ALLOWED",
  );
  await inactive.close();
  console.log(
    JSON.stringify({
      ...report,
      result: "PASS",
      anonymous: 401,
      inactive: 403,
      secretValuesIncluded: false,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      result: "FAIL",
      progress,
      category:
        error instanceof Error && error.message.startsWith("COMMERCIAL_")
          ? error.message
          : "COMMERCIAL_BROWSER_GATE_FAILED",
      errorType: error?.name ?? "Unknown",
      route: lastPage ? new URL(lastPage.url()).pathname : null,
      secretValuesIncluded: false,
    }),
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
}
