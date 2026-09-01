import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("C-05 P1D frontend architecture", () => {
  it("uses Aurora and keeps routing/root composition out of the checkpoint", () => {
    const component = read(
      "src/features/creator-payout-settings/components/creator-payout-legal-settings.tsx",
    );
    expect(component).toContain('from "../../../design-system/aurora"');
    expect(component).toContain("SideDrawer");
    expect(component).not.toContain("App.tsx");
    expect(component).not.toContain("createBrowserRouter");
  });

  it("implements the 768px bottom-sheet, full-width action, and long-value seams", () => {
    const css = read(
      "src/features/creator-payout-settings/creator-payout-settings.css",
    );
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("align-items: flex-end");
    expect(css).toContain("height: min(92dvh, 48rem)");
    expect(css).toContain("width: 100%");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).not.toContain("100vw");
  });

  it("does not log or retain destination secrets in browser storage", () => {
    const component = read(
      "src/features/creator-payout-settings/components/creator-payout-legal-settings.tsx",
    );
    const destinationDrawer = read(
      "src/features/creator-payout-settings/components/creator-payout-destination-drawer.tsx",
    );
    const api = read(
      "src/features/creator-payout-settings/api/creator-payout-settings-client.ts",
    );
    for (const source of [component, api]) {
      expect(source).not.toContain("console.");
      expect(source).not.toContain("localStorage");
      expect(source).not.toContain("sessionStorage");
    }
    expect(component).toContain("destinationOpen && legal");
    expect(destinationDrawer).toContain('setAccountNumber("")');
    expect(destinationDrawer).toContain('autoComplete="off"');
  });

  it("contains no fake verified state or provider execution action", () => {
    const component = read(
      "src/features/creator-payout-settings/components/creator-payout-legal-settings.tsx",
    );
    expect(component).toContain("Configured — not verified");
    expect(component).not.toContain("Verified active");
    expect(component).not.toContain("Execute payout");
    expect(component).not.toContain("Start KYC");
  });
});
