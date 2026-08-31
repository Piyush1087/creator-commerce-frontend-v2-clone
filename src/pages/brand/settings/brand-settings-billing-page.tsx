import { BrandFinanceSettings } from "../../../features/settings/components/brand/brand-finance-settings";
import { SettingsBillingSections } from "../../../features/settings/components/settings-billing-sections";

export function BrandSettingsBillingPage() {
  return (
    <div className="brand-settings__billing-overview">
      <SettingsBillingSections />
      <BrandFinanceSettings />
    </div>
  );
}
