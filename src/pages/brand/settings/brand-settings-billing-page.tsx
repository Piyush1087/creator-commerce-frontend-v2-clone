import { EscrowAccountCard } from "../../../features/brand-escrow/components/escrow-account-card";
import { SettingsBillingSections } from "../../../features/settings/components/settings-billing-sections";

export function BrandSettingsBillingPage() {
  return (
    <>
      <SettingsBillingSections />
      <div style={{ marginTop: "var(--space-lg)" }}>
        <EscrowAccountCard />
      </div>
    </>
  );
}
