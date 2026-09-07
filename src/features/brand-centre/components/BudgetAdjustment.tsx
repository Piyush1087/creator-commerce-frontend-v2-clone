import { AlertCircle } from "lucide-react";

export function BudgetAdjustment() {
  return (
    <div className="aurora-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Influencer Marketing Framework Alignment</h2>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Our AI engine has analyzed your brand's current lifecycle stage (Scaling Tier 2) and market competition. The following allocation represents a data-backed strategy to maximize ROI.
        </p>

        <div style={{ background: '#FFF6F6', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#F5926E" />
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#F5926E', margin: 0 }}>
            ⚠️ Changing the mix may impact ongoing prospects. Live and committed collaborations remain secure.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <SliderGroup title="Asset Allocation">
            <SliderItem label="Product" value={63} amount="₹53,550" />
            <SliderItem label="Collection" value={25} amount="₹21,250" />
            <SliderItem label="Sitewide Sale" value={12} amount="₹10,200" />
          </SliderGroup>

          <SliderGroup title="Influencer Tiers">
            <SliderItem label="Nano" value={30} amount="₹25,500" />
            <SliderItem label="Micro" value={50} amount="₹42,500" restricted />
            <SliderItem label="Mega" value={15} amount="₹12,750" />
          </SliderGroup>
        </div>

        <div style={{ padding: '24px 0', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button className="aurora-button" style={{ background: 'var(--surface-page)', color: 'var(--text-high)' }}>Cancel</button>
          <button className="aurora-button" style={{ background: 'var(--color-primary)', color: 'black', fontWeight: 700 }}>Confirm New Allocation</button>
        </div>
      </div>
    </div>
  );
}

function SliderGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
      </div>
    </div>
  );
}

function SliderItem({ label, value, amount, restricted }: { label: string; value: number; amount: string; restricted?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>% {label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {restricted && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-error)', background: '#FFF6F6', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(202, 15, 28, 0.1)' }}>RESTriction active</span>
          )}
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>{value}% <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>({amount})</span></span>
        </div>
      </div>
      <div style={{ position: 'relative', height: '8px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '4px', background: 'var(--surface-page)', borderRadius: '100px' }}></div>
        <div style={{ position: 'absolute', width: `${value}%`, height: '4px', background: restricted ? '#E5E7EB' : 'var(--color-primary)', borderRadius: '100px' }}></div>
        <div style={{ 
          position: 'absolute', 
          left: `calc(${value}% - 12px)`, 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          background: restricted ? '#E5E7EB' : 'var(--color-primary)', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: restricted ? 'not-allowed' : 'pointer'
        }}></div>
      </div>
      {restricted && (
        <p style={{ fontSize: '10px', color: 'var(--status-error)', fontWeight: 600, margin: 0 }}>Budget threshold guardrail: Individual bucket cannot drop below ₹30,000.</p>
      )}
    </div>
  );
}
