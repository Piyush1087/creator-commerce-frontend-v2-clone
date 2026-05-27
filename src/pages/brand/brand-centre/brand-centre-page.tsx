import { BrandDNA } from "../../../features/brand-centre/components/BrandDNA";
import { BudgetManagement } from "../../../features/brand-centre/components/BudgetManagement";
import { AccountInfrastructure } from "../../../features/brand-centre/components/AccountInfrastructure";
import { BrandCentreTabs } from "../../../features/brand-centre/components/BrandCentreTabs";
import { useBrandCentreShell } from "../../../features/brand-centre/context/brand-centre-shell-context";
import { MOCK_BRAND_CENTRE_DATA } from "../../../features/brand-centre/mock-data/brand-centre-data";
import "../../../features/brand-centre/brand-centre.css";

export function BrandCentrePage() {
  const shell = useBrandCentreShell();
  const activeTabId = shell?.activeTabId ?? "dna";

  return (
    <div className="brand-centre-page">
      <BrandCentreTabs
        activeTabId={activeTabId}
        onTabChange={shell?.setActiveTabId}
      />

      <div className="brand-centre-page__content">
        {activeTabId === "dna" ? (
          <>
            <BrandDNA data={MOCK_BRAND_CENTRE_DATA} />
            <BudgetManagement data={MOCK_BRAND_CENTRE_DATA} />
            <AccountInfrastructure data={MOCK_BRAND_CENTRE_DATA} />
          </>
        ) : (
          <p className="brand-centre-page__placeholder">Coming soon.</p>
        )}
      </div>
    </div>
  );
}
