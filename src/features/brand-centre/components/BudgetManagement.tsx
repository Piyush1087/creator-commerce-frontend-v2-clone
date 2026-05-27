import { Edit2, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { BrandCentreData } from "../types";

interface BudgetManagementProps {
  data: BrandCentreData;
}

export function BudgetManagement({ data }: BudgetManagementProps) {
  const utilizationPercent = (data.utilizedBudget / data.monthlyBudget) * 100;

  return (
    <div className="aurora-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Strategic Budget Management</h2>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Section 1: Budget Ceiling & Utilization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget Ceiling & Utilization</h3>
            <button className="aurora-header__btn" style={{ width: '32px', height: '32px' }}><Edit2 size={14} /></button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Monthly Budget</p>
              <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>₹{data.monthlyBudget.toLocaleString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Utilized</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>₹{data.utilizedBudget.toLocaleString()} ({utilizationPercent}%)</p>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '12px', background: 'var(--surface-page)', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{ width: `${utilizationPercent}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '100px' }}></div>
          </div>
        </div>

        {/* Section 2: AI-Calculated Strategic Allocation Mix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI-Calculated Strategic Allocation Mix</h3>
            <Link to="/brand-centre-budget" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textDecoration: 'none' }}>
              Know how the budget split is planned <HelpCircle size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {/* Asset Allocation */}
            <DonutCard title="Asset Allocation" data={data.assetAllocation} />
            {/* Influencer Tiers */}
            <DonutCard title="Influencer Tiers" data={data.influencerTiers} />
            {/* Campaign Objectives */}
            <DonutCard title="Campaign Objectives" data={data.campaignObjectives} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DonutCard({ title, data }: { title: string; data: { label: string; value: number; color: string }[] }) {
  const mainValue = data[0].value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '24px', background: 'var(--surface-page)', borderRadius: '16px', border: '1px solid var(--border-default)' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>{title}</p>
      
      <div style={{ position: 'relative', width: '112px', height: '112px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E5E7EB" strokeWidth="12"></circle>
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            fill="transparent" 
            stroke="var(--color-primary)" 
            strokeWidth="12" 
            strokeDasharray={`${(mainValue / 100) * 238} 238`}
          ></circle>
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: 700 }}>{mainValue}%</span>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></span>
              {item.label}
            </span>
            <span style={{ fontWeight: 700 }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
