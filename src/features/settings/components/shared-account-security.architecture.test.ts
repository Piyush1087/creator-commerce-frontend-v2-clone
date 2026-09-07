import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Shared Settings account security", () => {
  it("is one shared implementation consumed by Brand and Creator pages", () => {
    const brand = source(
      "src/features/settings/components/brand/brand-general-settings.tsx",
    );
    const creator = source(
      "src/pages/creator/settings/creator-settings-account-page.tsx",
    );
    const compatibilityExport = source(
      "src/features/settings/components/brand/account-security-settings.tsx",
    );

    expect(brand).toContain("../account-security-settings");
    expect(creator).toContain("components/account-security-settings");
    expect(compatibilityExport).toContain(
      'from "../account-security-settings"',
    );
    expect(compatibilityExport).not.toContain("useState");
  });
});
