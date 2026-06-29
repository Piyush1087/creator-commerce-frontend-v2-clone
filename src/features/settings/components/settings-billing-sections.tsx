import { PricingBillingPanel } from "../../pricing/components/pricing-billing-panel";

type SettingsBillingSectionsProps = {
  hideBillingDetailsSection?: boolean;
};

export function SettingsBillingSections({
  hideBillingDetailsSection,
}: SettingsBillingSectionsProps) {
  return <PricingBillingPanel hideBillingDetailsSection={hideBillingDetailsSection} />;
}
