import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const frontend = process.env.CREATOR_MEDIA_KIT_FRONTEND_ORIGIN;
const backend = process.env.CREATOR_MEDIA_KIT_BACKEND_ORIGIN;
const password = process.env.CREATOR_MEDIA_KIT_FIXTURE_PASSWORD;
const executablePath = process.env.CREATOR_MEDIA_KIT_BROWSER_PATH;
const manifestPath = process.env.CREATOR_MEDIA_KIT_FIXTURE_MANIFEST;
const evidencePath = process.env.CREATOR_MEDIA_KIT_BROWSER_EVIDENCE;
assert.ok(
  frontend &&
    backend &&
    password &&
    executablePath &&
    manifestPath &&
    evidencePath,
);
const fixture = JSON.parse(await readFile(manifestPath, "utf8"));
const widths = [
  [390, 844],
  [767, 900],
  [768, 900],
  [1440, 1000],
];
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-first-run",
  ],
});
const evidence = {
  widths: [],
  roles: {},
  public: {},
  brands: {},
  axe: { serious: 0, critical: 0, lesser: 0 },
  externalTrafficBlocked: 0,
  pageErrors: 0,
  consoleErrors: 0,
};

async function contextAt(width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const failures = { console: [], page: [], external: [] };
  const mediaKitResponses = [];
  let observe = false;
  page.on("console", (message) => {
    if (observe && message.type() === "error")
      failures.console.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (observe) failures.page.push(error.message);
  });
  page.on("response", (response) => {
    if (response.url().includes("/api/v1/creator/media-kit"))
      mediaKitResponses.push({
        method: response.request().method(),
        status: response.status(),
      });
  });
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      ["127.0.0.1", "localhost"].includes(url.hostname) ||
      ["data:", "blob:"].includes(url.protocol)
    )
      return route.continue();
    if (
      (url.hostname === "api.fontshare.com" && url.pathname === "/v2/css") ||
      (url.hostname === "fonts.googleapis.com" && url.pathname === "/css2")
    )
      return route.fulfill({
        status: 200,
        contentType: "text/css",
        body: "/* bounded offline acceptance fixture */",
      });
    failures.external.push(url.hostname);
    return route.abort("blockedbyclient");
  });
  return {
    context,
    page,
    failures,
    mediaKitResponses,
    startObserving: () => (observe = true),
  };
}

async function login(surface, email) {
  const { page } = surface;
  await page.goto(`${frontend}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const pending = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const response = await pending;
  assert.equal(
    response.status(),
    200,
    `Real password login failed for ${email}`,
  );
  const session = await response.json();
  assert.equal(typeof session.accessToken, "string");
  await page.waitForURL((url) => url.pathname !== "/login");
  await page.waitForLoadState("networkidle");
  return session;
}

async function assertSurface(surface, label) {
  const { page, failures } = surface;
  await page.waitForTimeout(250);
  assert.ok(
    (await page.getByRole("heading").count()) > 0,
    `${label}: heading missing`,
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assert.ok(overflow <= 1, `${label}: horizontal overflow ${overflow}px`);
  const scopedFocusable = page
    .locator(
      ".media-kit-workspace button:not([disabled]),.media-kit-sheet button:not([disabled]),.media-kit-verified-toolbar button:not([disabled]),.media-kit-sheet a[href],.media-kit-workspace input:not([disabled])",
    )
    .first();
  const hasScopedFocusable = (await scopedFocusable.count()) > 0;
  const focusable = hasScopedFocusable
    ? scopedFocusable
    : page
        .locator("button:not([disabled]),a[href],input:not([disabled])")
        .first();
  if (await focusable.count()) {
    if (!hasScopedFocusable) {
      await page.keyboard.press("Tab");
      assert.ok(
        await page.evaluate(() => document.activeElement !== document.body),
        `${label}: keyboard focus missing`,
      );
    } else {
      await focusable.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
    }
    const focus = await focusable.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        active: document.activeElement === element,
        outline: style.outlineStyle,
        shadow: style.boxShadow,
      };
    });
    if (hasScopedFocusable)
      assert.ok(
        focus.active && (focus.outline !== "none" || focus.shadow !== "none"),
        `${label}: visible focus missing`,
      );
    await focusable.press("Tab");
  }
  const menu = page.getByRole("button", { name: "Open Menu", exact: true });
  if (await menu.isVisible().catch(() => false)) {
    await menu.focus();
    await menu.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Application navigation",
      exact: true,
    });
    await dialog.waitFor();
    await page
      .getByRole("button", { name: "Close menu", exact: true })
      .press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.ok(
      await menu.evaluate((element) => document.activeElement === element),
      `${label}: menu focus did not return`,
    );
  }
  const axe = await new AxeBuilder({ page }).analyze();
  const counts = { serious: 0, critical: 0, lesser: 0 };
  for (const violation of axe.violations) {
    if (violation.impact === "serious")
      counts.serious += violation.nodes.length;
    else if (violation.impact === "critical")
      counts.critical += violation.nodes.length;
    else counts.lesser += violation.nodes.length;
  }
  evidence.axe.serious += counts.serious;
  evidence.axe.critical += counts.critical;
  evidence.axe.lesser += counts.lesser;
  if (counts.serious || counts.critical || counts.lesser)
    throw new Error(
      `${label}: Axe ${JSON.stringify(
        axe.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          targets: violation.nodes.map((node) => node.target),
        })),
      )}`,
    );
  evidence.externalTrafficBlocked += failures.external.length;
  evidence.pageErrors += failures.page.length;
  evidence.consoleErrors += failures.console.length;
  assert.deepEqual(failures.page, [], `${label}: page errors`);
  assert.deepEqual(failures.console, [], `${label}: console errors`);
  return counts;
}

let livePublicId;
let draftPublicId;
try {
  for (const [index, [width, height]] of widths.entries()) {
    const roleCases = [
      ["OWNER", fixture.creatorOwnerEmail],
      ["MANAGER", fixture.creatorManagerEmail],
      ["ASSISTANT", fixture.creatorAssistantEmail],
    ];
    for (const [role, email] of roleCases) {
      const surface = await contextAt(width, height);
      try {
        const session = await login(surface, email);
        await surface.page.goto(`${frontend}/creator/media-kit`, {
          waitUntil: "domcontentloaded",
        });
        surface.startObserving();
        await surface.page
          .getByRole("heading", { level: 1, name: "Media Kit", exact: true })
          .waitFor();
        const response = await surface.context.request.get(
          `${backend}/api/v1/creator/media-kit?preview=VERIFIED`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        );
        assert.equal(response.status(), 200);
        const kit = await response.json();
        assert.equal(kit.actorRole, role);
        livePublicId ??= kit.configuration.publicId;
        try {
          await surface.page
            .getByText(kit.configuration.lifecycle, { exact: true })
            .waitFor({ timeout: 5_000 });
        } catch {
          throw new Error(
            `${role} UI load failed ${JSON.stringify(surface.mediaKitResponses)}: ${(await surface.page.locator("body").innerText()).slice(0, 800)}`,
          );
        }
        if (role === "ASSISTANT") {
          assert.equal(
            await surface.page
              .getByRole("button", { name: /Publish|Unpublish/u })
              .count(),
            0,
          );
          assert.equal(await surface.page.getByRole("switch").count(), 0);
        } else {
          assert.equal(
            await surface.page
              .getByRole("button", { name: /Publish|Unpublish/u })
              .count(),
            1,
          );
        }
        if (
          index === 0 &&
          role === "OWNER" &&
          kit.configuration.lifecycle === "DRAFT"
        ) {
          const mutation = surface.page.waitForResponse(
            (item) =>
              item.url().endsWith("/api/v1/creator/media-kit") &&
              item.request().method() === "PATCH",
          );
          await surface.page
            .getByRole("button", { name: "Publish", exact: true })
            .click();
          assert.equal((await mutation).status(), 200);
          await surface.page.getByText("LIVE", { exact: true }).waitFor();
        }
        if (index === widths.length - 1 && role === "OWNER") {
          const download = surface.page.waitForEvent("download");
          await surface.page
            .getByRole("button", { name: "Download PDF", exact: true })
            .click();
          const artifact = await download;
          assert.match(artifact.suggestedFilename(), /^creator-media-kit-/u);
        }
        await assertSurface(surface, `${role}-${width}`);
        evidence.roles[`${role}-${width}`] = "PASS";
      } finally {
        await surface.context.close();
      }
    }

    if (index === 0) {
      const draft = await contextAt(width, height);
      try {
        const session = await login(draft, fixture.draftCreatorOwnerEmail);
        await draft.page.goto(`${frontend}/creator/media-kit`, {
          waitUntil: "domcontentloaded",
        });
        await draft.page
          .getByRole("heading", { level: 1, name: "Media Kit", exact: true })
          .waitFor();
        const response = await draft.context.request.get(
          `${backend}/api/v1/creator/media-kit?preview=VERIFIED`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        );
        assert.equal(response.status(), 200);
        const kit = await response.json();
        assert.equal(kit.configuration.lifecycle, "DRAFT");
        draftPublicId = kit.configuration.publicId;
      } finally {
        await draft.context.close();
      }
    }

    const publicSurface = await contextAt(width, height);
    try {
      await publicSurface.page.goto(`${frontend}/media-kit/${livePublicId}`, {
        waitUntil: "domcontentloaded",
      });
      await publicSurface.page
        .getByRole("heading", { level: 1, name: "Media Kit Fixture Creator" })
        .waitFor();
      publicSurface.startObserving();
      assert.equal(
        await publicSurface.page
          .getByText("Work With Me / Rate Card", { exact: true })
          .count(),
        0,
      );
      assert.equal(
        await publicSurface.page
          .locator('meta[name="robots"]')
          .getAttribute("content"),
        "noindex,nofollow,noarchive",
      );
      if (index === 0) {
        await publicSurface.page
          .getByRole("button", { name: /Work with Creator/u })
          .click();
        await publicSurface.page
          .getByText(
            "Interest recorded. No downstream journey is configured by Media Kit.",
            { exact: true },
          )
          .waitFor();
        await publicSurface.page
          .getByRole("button", { name: /Reveal Email ID/u })
          .click();
        await publicSurface.page.getByText(/Business email:/u).waitFor();
      }
      await assertSurface(publicSurface, `PUBLIC-${width}`);
      evidence.public[`LIVE-${width}`] = "PASS";
    } finally {
      await publicSurface.context.close();
    }

    const draftSurface = await contextAt(width, height);
    try {
      await draftSurface.page.goto(`${frontend}/media-kit/${draftPublicId}`, {
        waitUntil: "domcontentloaded",
      });
      await draftSurface.page
        .getByRole("heading", { name: "Media Kit unavailable", exact: true })
        .waitFor();
      draftSurface.startObserving();
      assert.equal(
        await draftSurface.page
          .getByText("Rate Card", { exact: false })
          .count(),
        0,
      );
      await assertSurface(draftSurface, `DRAFT-PUBLIC-${width}`);
      evidence.public[`DRAFT-${width}`] = "FAIL_CLOSED_PASS";
    } finally {
      await draftSurface.context.close();
    }

    for (const [kind, email, expected] of [
      ["VERIFIED", fixture.verifiedBrandEmail, true],
      ["UNVERIFIED", fixture.unverifiedBrandEmail, false],
      ["FOREIGN_VERIFIED", fixture.foreignBrandEmail, true],
    ]) {
      const brand = await contextAt(width, height);
      try {
        const session = await login(brand, email);
        await brand.page.goto(`${frontend}/brand/media-kits/${livePublicId}`, {
          waitUntil: "domcontentloaded",
        });
        if (expected) {
          await brand.page
            .getByText("Verified Brand view", { exact: true })
            .waitFor();
          const direct = await brand.context.request.get(
            `${backend}/api/v1/brand/media-kits/${livePublicId}?brandProfileId=caller-supplied-invalid`,
            { headers: { Authorization: `Bearer ${session.accessToken}` } },
          );
          assert.equal(direct.status(), 200);
          const body = await direct.json();
          const expectedBrandId =
            kind === "VERIFIED"
              ? fixture.verifiedBrandProfileId
              : fixture.foreignBrandProfileId;
          assert.equal(body.viewer.brandId, expectedBrandId);
          if (index === widths.length - 1 && kind === "VERIFIED") {
            const download = brand.page.waitForEvent("download");
            await brand.page
              .getByRole("button", { name: "Download PDF", exact: true })
              .click();
            assert.match(
              (await download).suggestedFilename(),
              /^creator-media-kit-/u,
            );
          }
        } else {
          await brand.page
            .getByRole("heading", {
              name: "Verified Media Kit unavailable",
              exact: true,
            })
            .waitFor();
          assert.equal(
            await brand.page
              .getByText("Work With Me / Rate Card", { exact: true })
              .count(),
            0,
          );
          const denied = await brand.context.request.get(
            `${backend}/api/v1/brand/media-kits/${livePublicId}`,
            { headers: { Authorization: `Bearer ${session.accessToken}` } },
          );
          assert.equal(denied.status(), 403);
        }
        brand.startObserving();
        await assertSurface(brand, `${kind}-${width}`);
        evidence.brands[`${kind}-${width}`] = "PASS";
      } finally {
        await brand.context.close();
      }
    }
    evidence.widths.push({ width, status: "PASS" });
  }

  const inactive = await contextAt(390, 844);
  try {
    const session = await login(inactive, fixture.inactiveCreatorEmail);
    await inactive.page.goto(`${frontend}/creator/media-kit`, {
      waitUntil: "domcontentloaded",
    });
    await inactive.page.waitForURL(
      (url) => url.pathname === "/creator/settings/account",
    );
    const denied = await inactive.context.request.get(
      `${backend}/api/v1/creator/media-kit?preview=VERIFIED`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    );
    assert.equal(denied.status(), 403);
    evidence.roles.INACTIVE = "DENIED_PASS";
  } finally {
    await inactive.context.close();
  }

  const anonymousBrand = await contextAt(390, 844);
  try {
    await anonymousBrand.page.goto(
      `${frontend}/brand/media-kits/${livePublicId}`,
      { waitUntil: "domcontentloaded" },
    );
    await anonymousBrand.page
      .getByRole("heading", { name: "Sign in", exact: true })
      .waitFor();
    evidence.brands.ANONYMOUS = "LOGIN_REQUIRED_PASS";
  } finally {
    await anonymousBrand.context.close();
  }

  assert.deepEqual(evidence.axe, { serious: 0, critical: 0, lesser: 0 });
  assert.equal(evidence.pageErrors, 0);
  assert.equal(evidence.consoleErrors, 0);
  await writeFile(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
} finally {
  await browser.close();
}
