import { BudgetAdjustment } from "../../../features/brand-centre/components/BudgetAdjustment";
import { BrandCentreTabs } from "../../../features/brand-centre/components/BrandCentreTabs";
import "../../../features/brand-centre/brand-centre.css";

export function BrandCentreBudgetPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <BrandCentreTabs />
      
      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* BREADCRUMBS (Content-specific) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
          <span>Brand Centre</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>Solv Skincare</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-high)' }}>Budget Adjustment</span>
        </div>

        <BudgetAdjustment />
      </div>
    </div>
  );
}
