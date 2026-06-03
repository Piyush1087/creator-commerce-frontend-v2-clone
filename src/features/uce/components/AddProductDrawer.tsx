import { useState } from "react";
import { Package, Plus, CheckCircle2, Shield, Info, ExternalLink } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { Badge } from "../../../design-system/aurora/components/Badge";

type AddProductDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddProductDrawer({ isOpen, onClose }: AddProductDrawerProps) {
  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Link Product Portfolio"
      subtitle="Connect SKUs and logistical data to this campaign."
      width="640px"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled>Link Selection to Campaign</Button>
        </>
      }
    >
      <div className="drawer-stack" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="alert-banner" style={{ background: 'var(--surface-workflow)', padding: 16, borderRadius: 8, border: '1px solid var(--color-primary)', display: 'flex', gap: 12 }}>
          <Info size={20} className="text-primary" />
          <p style={{ fontSize: 13, margin: 0 }}><strong>Dynamic Context Active:</strong> UI optimized for Beauty & Cosmetics industry logic.</p>
        </div>

        <section className="drawer-section">
          <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Active Portfolio</label>
          <div className="portfolio-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[1, 2].map(i => (
              <Card key={i} className={`product-card ${i === 1 ? 'selected' : ''}`} style={{ border: i === 1 ? '2px solid var(--color-primary)' : '1px solid var(--border-default)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: 40, height: 40, background: 'var(--disabled-bg)', borderRadius: 4 }}></div>
                  {i === 1 && <CheckCircle2 size={16} className="text-primary" />}
                </div>
                <strong style={{ display: 'block', marginTop: 12 }}>{i === 1 ? 'Hydration Boost Serum' : 'Glow Recovery Cream'}</strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SKU: BH-2024-00{i}</span>
              </Card>
            ))}
            <Card className="add-new-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-default)', background: 'transparent' }}>
              <Plus size={20} className="text-muted" />
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>New Entry</span>
            </Card>
          </div>
        </section>

        <section className="drawer-section">
          <Card title="Product Guardrails" compact>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">Safety Level</span>
                <Badge tone="success">STRICT</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">Portfolio Weight</span>
                <strong>40% of Cap</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">Claims Approved</span>
                <strong>6 Verified</strong>
              </div>
            </div>
          </Card>
        </section>

        <section className="drawer-section">
          <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Asset Repository</label>
          <Card compact>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: 'var(--disabled-bg)', borderRadius: 4 }}></div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13 }}>Clinical Study - Q1 2024</strong>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>PDF • 2.4MB • Approved for AI generation</p>
              </div>
              <ExternalLink size={14} className="text-muted" />
            </div>
          </Card>
        </section>
      </div>
    </SideDrawer>
  );
}
