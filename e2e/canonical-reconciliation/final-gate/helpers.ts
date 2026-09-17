import type { BrowserContext, Page, Route } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SECRET_KEYS = /password|token|cookie|authorization|secret/i;

export function isAllowedFinalGateUrl(raw: string): boolean {
  const url = new URL(raw);
  return (
    ["data:", "blob:", "about:"].includes(url.protocol) ||
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SECRET_KEYS.test(key) ? "[REDACTED]" : redactSecrets(entry),
      ]),
    );
  }
  return value;
}

export async function writeSanitizedJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(redactSecrets(value), null, 2), "utf8");
}

export function artifactPath(...parts: string[]): string {
  const root = process.env.FINAL_GATE_ARTIFACT_DIR ?? ".artifacts/final-gate";
  return resolve(root, ...parts);
}

export async function installLoopbackGuard(
  context: BrowserContext,
  blocked: string[],
) {
  await context.addInitScript(() => {
    const appendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function <T extends Node>(node: T): T {
      if (node instanceof HTMLStyleElement) {
        node.textContent = (node.textContent ?? "").replace(
          /^\s*@import\s+url\(["']https?:\/\/[^)]+\)[^;]*;\s*$/gim,
          "",
        );
      }
      return appendChild.call(this, node) as T;
    };
  });
  await context.route("**/*", async (route: Route) => {
    const url = route.request().url();
    if (isAllowedFinalGateUrl(url)) {
      if (new URL(url).pathname.endsWith(".css")) {
        const response = await route.fetch();
        const body = (await response.text()).replace(
          /https:\/\/(?:api\.fontshare\.com|fonts\.googleapis\.com)[^\\"]+/g,
          "data:text/css,",
        );
        return route.fulfill({ response, body });
      }
      return route.continue();
    }
    blocked.push(url);
    await route.abort("blockedbyclient");
  });
}

export function collectPageFailures(page: Page) {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().startsWith("Failed to load resource:")
    )
      failures.push(`console:${message.text()}`);
  });
  page.on("response", (response) => {
    const expectedAnonymousProbe =
      response.status() === 401 &&
      ["/api/v1/auth/me", "/api/v1/auth/refresh"].includes(
        new URL(response.url()).pathname,
      );
    if (response.status() >= 400 && !expectedAnonymousProbe)
      failures.push(`response:${response.status()}:${response.url()}`);
  });
  return failures;
}
