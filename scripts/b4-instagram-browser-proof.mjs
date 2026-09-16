import { chromium } from "@playwright/test";

const required = ["B4_FRONTEND_URL", "B4_BACKEND_URL", "B4_BROWSER_PASSWORD", "B4_CHROME_PATH"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const frontend = process.env.B4_FRONTEND_URL;
const backend = process.env.B4_BACKEND_URL;
const browser = await chromium.launch({ executablePath: process.env.B4_CHROME_PATH, headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const externalRequests = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["localhost", "127.0.0.1", "localtest.me"].includes(url.hostname) || ["data:", "blob:"].includes(url.protocol)) return route.continue();
    externalRequests.push(`${url.protocol}//${url.hostname}`); await route.abort("blockedbyclient");
  });
  await page.goto(`${frontend}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill("b4-owner@example.test");
  await page.locator('input[type="password"]').fill(process.env.B4_BROWSER_PASSWORD);
  const loginWait = page.waitForResponse((response) => response.url().endsWith("/api/v1/auth/login") && response.request().method() === "POST");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const login = await loginWait;
  if (login.status() !== 200) throw new Error("B4 synthetic login failed");
  await page.waitForURL((url) => url.pathname !== "/login");
  consoleErrors.length = 0;
  pageErrors.length = 0;
  externalRequests.length = 0;
  const apiWait = page.waitForResponse((response) => response.url().endsWith("/api/v1/brand-centre/instagram") && response.request().method() === "GET");
  await page.evaluate(() => {
    window.history.pushState({}, "", "/brand-centre/instagram");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  const api = await apiWait;
  if (api.status() !== 200) throw new Error("B4 consumer GET failed");
  const body = await api.json();
  await page.getByRole("heading", { name: "Instagram Intelligence", exact: true }).waitFor();
  await page.getByText("Not enough posts to identify patterns or learnings").waitFor();
  await page.getByText(/last successful current insight is preserved/i).waitFor();
  const text = await page.locator("body").innerText();
  if (!text.includes("Observed format: IMAGE") || !text.includes("Partial") || !text.includes("Current")) throw new Error("B4 consumer truth did not render");
  if (/Pattern detected|Learning detected|accessToken|processorExecution|bundleHash|temporaryPath/i.test(text)) throw new Error("Forbidden pipeline or semantic claim rendered");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const providerRequests = externalRequests.filter((url) => /instagram|facebook|fbcdn|meta|openai/i.test(url));
  if (overflow || consoleErrors.length || pageErrors.length || providerRequests.length) throw new Error(`B4 browser safety assertion failed: overflow=${overflow}; console=${consoleErrors.length}; page=${pageErrors.length}; provider=${providerRequests.length}`);
  if (body.contentBehavior?.currentPreserved !== true || body.latestProcessing?.state !== "DEGRADED") throw new Error("B4 preserved-current API truth missing");
  console.log(JSON.stringify({ route: "/brand-centre/instagram", width: 1440, apiStatus: api.status(), authenticated: true,
    contentFromConsumer: true, partialLimitationVisible: true, preservedCurrentVisible: true, horizontalOverflow: false,
    consoleErrors: 0, pageErrors: 0, liveProviderOrModelRequests: 0 }));
  await context.close();
} finally { await browser.close(); }
