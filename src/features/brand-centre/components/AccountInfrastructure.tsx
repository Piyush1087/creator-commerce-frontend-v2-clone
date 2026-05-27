import { ChevronRight } from "lucide-react";
import type { BrandCentreData } from "../types";

interface AccountInfrastructureProps {
  data: BrandCentreData;
}

export function AccountInfrastructure({ data }: AccountInfrastructureProps) {
  return (
    <div className="aurora-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Account & Setup Infrastructure</h2>
      </div>

      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px' }}>
        {/* Column 1: Plan & Financials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan & Financials</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Escrow Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>{data.escrowStatus}</span>
                <a href="#" style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Manage Escrow →</a>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Current Plan</p>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{data.currentPlan}</p>
            </div>

            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Outreach Quota</p>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{data.outreachQuota.used} / {data.outreachQuota.total} used</p>
            </div>

            <button className="aurora-button" style={{ background: 'var(--color-primary)', color: 'black', width: 'fit-content', padding: '10px 24px', fontWeight: 700 }}>
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Column 2: Integrations & Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Integrations & Team</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Meta Connection Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>{data.metaConnectionStatus}</span>
                <a href="#" style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Manage Accounts →</a>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Team Management</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>{data.teamManagement}</p>
              <a href="#" style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Invite or Manage Team →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
