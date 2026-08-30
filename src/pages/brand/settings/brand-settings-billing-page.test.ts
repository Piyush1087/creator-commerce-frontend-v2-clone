import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./brand-settings-billing-page.tsx", import.meta.url), "utf8");
const financeSource = readFileSync(
  new URL("../../../features/settings/components/brand/brand-finance-settings.tsx", import.meta.url),
  "utf8",
);
const routesSource = readFileSync(new URL("../../../routes/app-routes.tsx", import.meta.url), "utf8");
const settingsClientSource = readFileSync(
  new URL("../../../features/settings/api/brand-settings-client.ts", import.meta.url),
  "utf8",
);
const settingsContractsSource = readFileSync(
  new URL("../../../features/settings/contracts/brand-settings.contracts.ts", import.meta.url),
  "utf8",
);

describe("FE-B Settings composition regressions", () => {
  it("preserves accepted billing while removing the obsolete withdrawal model", () => {
    expect(pageSource).toContain("<EscrowAccountCard />");
    expect(financeSource).not.toContain("BrandWithdrawalAccountSection");
    expect(financeSource).not.toContain("withdrawal");
    expect(settingsClientSource).not.toContain("withdrawal-account");
    expect(settingsContractsSource).not.toContain("WithdrawalAccount");
    expect(pageSource).toContain("<SettingsBillingSections />");
    expect(pageSource).toContain("<BrandFinanceSettings />");
  });

  it("preserves the canonical Settings billing route", () => {
    expect(routesSource).toContain('path="billing"');
    expect(routesSource).toContain("<BrandSettingsBillingPage />");
  });
});
