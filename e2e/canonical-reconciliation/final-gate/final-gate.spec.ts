import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  artifactPath,
  collectPageFailures,
  installLoopbackGuard,
  writeSanitizedJson,
} from "./helpers";
import { FINAL_GATE_EXECUTIONS } from "./manifest";

for (const { scenario, width } of FINAL_GATE_EXECUTIONS) {
  test(`${scenario.id} ${scenario.state} [${width}]`, async ({
    browser,
    baseURL,
  }) => {
    const storageState =
      scenario.role === "PUBLIC"
        ? undefined
        : artifactPath("sessions", `${scenario.role.toLowerCase()}.json`);
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      storageState,
    });
    const blocked: string[] = [];
    await installLoopbackGuard(context, blocked);
    const page = await context.newPage();
    const failures = collectPageFailures(page);
    try {
      for (const path of scenario.paths) {
        const response = await page.goto(`${baseURL}${path}`, {
          waitUntil: "domcontentloaded",
        });
        expect(response, `${scenario.id} did not mount ${path}`).not.toBeNull();
        expect(
          response!.status(),
          `${scenario.id} route failed ${path}`,
        ).toBeLessThan(500);
        await expect(page.locator("body")).toBeVisible();
        if (scenario.role !== "PUBLIC")
          await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
      }
      await page.goto(`${baseURL}${scenario.paths[0]}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page
          .locator(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          )
          .first(),
      ).toBeVisible();
      await page.keyboard.press("Tab");
      const focusedTag = await page.evaluate(
        () => document.activeElement?.tagName ?? "",
      );
      expect(focusedTag).not.toBe("BODY");
      const axe = await new AxeBuilder({ page }).analyze();
      await writeSanitizedJson(
        artifactPath("axe", `${scenario.id}-${width}.json`),
        axe,
      );
      expect(
        axe.violations.filter((violation) => violation.impact === "critical"),
      ).toEqual([]);
      expect(blocked).toEqual([]);
      expect(failures).toEqual([]);
      await writeSanitizedJson(
        artifactPath("assertions", `${scenario.id}-${width}.json`),
        {
          id: scenario.id,
          role: scenario.role,
          secondaryRole: scenario.secondaryRole,
          state: scenario.state,
          width,
          paths: scenario.paths,
          routeMounted: true,
          loopbackOnly: true,
          keyboardFocus: focusedTag,
          criticalAxeViolations: 0,
        },
      );
    } finally {
      await context.close();
    }
  });
}
