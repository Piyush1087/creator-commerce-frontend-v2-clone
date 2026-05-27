import { BrandDNA } from "../../../features/brand-centre/components/BrandDNA";
import { BudgetManagement } from "../../../features/brand-centre/components/BudgetManagement";
import { AccountInfrastructure } from "../../../features/brand-centre/components/AccountInfrastructure";
import { BrandCentreTabs } from "../../../features/brand-centre/components/BrandCentreTabs";
import { MOCK_BRAND_CENTRE_DATA } from "../../../features/brand-centre/mock-data/brand-centre-data";
import "../../../features/brand-centre/brand-centre.css";

export function BrandCentrePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <BrandCentreTabs />
      
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* BREADCRUMBS (Content-specific) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
          <span>Brand Centre</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-high)' }}>Solv Skincare</span>
        </div>

        <BrandDNA data={MOCK_BRAND_CENTRE_DATA} />
        <BudgetManagement data={MOCK_BRAND_CENTRE_DATA} />
        <AccountInfrastructure data={MOCK_BRAND_CENTRE_DATA} />
      </div>
    </div>
  );
}
