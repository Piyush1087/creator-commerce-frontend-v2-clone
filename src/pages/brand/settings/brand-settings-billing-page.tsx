import { EscrowAccountCard } from "../../../features/brand-escrow/components/escrow-account-card";
import { BrandFinanceSettings } from "../../../features/settings/components/brand/brand-finance-settings";
import { SettingsBillingSections } from "../../../features/settings/components/settings-billing-sections";

export function BrandSettingsBillingPage() {
  return (
    <>
      <SettingsBillingSections hideBillingDetailsSection />
      <div style={{ marginTop: "var(--space-lg)" }}>
        <BrandFinanceSettings />
      </div>
      <div style={{ marginTop: "var(--space-lg)" }}>
        <EscrowAccountCard />
      </div>
    </>
  );
}
