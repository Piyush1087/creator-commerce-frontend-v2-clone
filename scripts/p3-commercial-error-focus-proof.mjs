import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const password = process.env.CREATOR_COMMERCIAL_BROWSER_PASSWORD;
if (!password || process.env.CREATOR_COMMERCIAL_BROWSER_PROOF !== "true")
  throw new Error("Synthetic commercial opt-in required");
const assert = (value, label) => {
  if (!value) throw new Error("COMMERCIAL_" + label);
};
const inspect = () =>
  execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL("./p3-commercial-db-proof.mjs", import.meta.url)),
      "inspect",
      "commercial-browser-manual-390-owner@example.test",
    ],
    { encoding: "utf8", env: process.env },
  );
let browser;
try {
  const before = inspect();
  browser = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: [
      "--disable-background-networking",
      "--disable-component-update",
      "--no-first-run",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 1000 },
  });
  assert(
    (
      await context.request.post("http://127.0.0.1:6062/api/v1/auth/login", {
        data: {
          email: "commercial-browser-manual-390-owner@example.test",
          password,
        },
      })
    ).status() === 200,
    "REAL_LOGIN_FAILED",
  );
  const page = await context.newPage();
  const uncaught = [];
  page.on("pageerror", () => uncaught.push("PAGE_ERROR"));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1"
      ? route.continue()
      : route.fulfill({ status: 200, body: "", contentType: "text/css" });
  });
  await page.goto("http://127.0.0.1:4182/creator/commercial-setup");
  await page
    .getByRole("form", { name: "Work Preferences", exact: true })
    .waitFor();
  await page.route(
    "**/api/v1/creator/commercial-setup/work-preferences",
    (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({
            status: 409,
            contentType: "application/json",
            body: "{}",
          })
        : route.continue(),
  );
  await page.getByLabel("UGC-project willingness").selectOption("NO");
  await page
    .getByRole("button", { name: "Save Work Preferences", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "I reviewed the latest values", exact: true })
    .waitFor();
  assert(
    (await page.getByLabel("UGC-project willingness").inputValue()) === "NO",
    "CONFLICT_DRAFT_LOST",
  );
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("role") === "alert" &&
      document.activeElement?.textContent?.includes("Commercial Setup changed"),
  );
  assert(
    await page
      .getByRole("button", { name: "Save Work Preferences", exact: true })
      .isDisabled(),
    "CONFLICT_RETRY_NOT_FENCED",
  );
  await page
    .getByRole("button", { name: "I reviewed the latest values", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  assert(
    (await page.getByLabel("UGC-project willingness").inputValue()) === "NO",
    "REVIEW_DRAFT_LOST",
  );
  assert(inspect() === before, "ERROR_PATH_CHANGED_ROWS");
  assert(uncaught.length === 0, "UNCAUGHT_PAGE_ERROR");
  console.log(
    JSON.stringify({
      result: "PASS",
      width: 390,
      injectedConflict: 409,
      draftPreserved: true,
      latestReviewRequired: true,
      visibleErrorFocus: true,
      rowsStable: true,
      uncaughtPageErrors: 0,
      secretValuesIncluded: false,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      result: "FAIL",
      category: error?.message?.startsWith("COMMERCIAL_")
        ? error.message
        : "COMMERCIAL_ERROR_FOCUS_GATE_FAILED",
      secretValuesIncluded: false,
    }),
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
}
