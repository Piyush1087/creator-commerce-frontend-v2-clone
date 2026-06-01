import { useState } from "react";
import { 
  X, 
  Plus, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Video, 
  Instagram, 
  Youtube, 
  Shield, 
  Zap, 
  Clock, 
  DollarSign, 
  Layout,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { Badge } from "../../../design-system/aurora/components/Badge";
import { TextField } from "../../../design-system/aurora/components/TextField";
import { SelectionCard } from "../../../design-system/aurora/components/SelectionCard";

type AddBriefDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddBriefDrawer({ isOpen, onClose }: AddBriefDrawerProps) {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Brief Strategy & Deliverables" : step === 2 ? "Set the Scene" : "Timelines & Terms"}
      subtitle={`Step ${step} of 3 • Campaign: Spring Glow 2024`}
      width="720px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <div style={{ display: 'flex', gap: 12 }}>
            {step > 1 && <Button variant="outline" onClick={prevStep}>Back</Button>}
            <Button variant="primary" onClick={nextStep}>
              {step === 3 ? "Finalize & Dispatch Brief" : "Continue"}
              {step < 3 && <ArrowRight size={18} />}
            </Button>
          </div>
        </div>
      }
    >
      <div className="brief-wizard-content">
        {step === 1 && <Step1Strategy />}
        {step === 2 && <Step2Creative />}
        {step === 3 && <Step3Logistics />}
      </div>
    </SideDrawer>
  );
}

function Step1Strategy() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <TextField label="Operational Brief Title" placeholder="e.g. Summer Skin Routine - 30s Reel" />
      
      <div className="field-group">
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Primary Content Channels</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <SelectionCard title="TikTok" icon={<Video size={18} />} selected />
          <SelectionCard title="Instagram" icon={<Instagram size={18} />} selected />
          <SelectionCard title="YouTube" icon={<Youtube size={18} />} />
        </div>
      </div>

      <div className="field-group">
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Audience Architecture</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {["Gen Z Skincare", "Minimalist Beauty", "Dermatology Focus", "Vegan Lifestyle"].map(tag => (
            <Badge key={tag} tone="neutral" style={{ cursor: 'pointer' }}>{tag}</Badge>
          ))}
          <Button variant="ghost" size="sm"><Plus size={14} /> Add Interest</Button>
        </div>
      </div>

      <Card title="AI Context Preview" eyebrow="Live Alignment" style={{ background: 'var(--surface-workflow)' }}>
        <p style={{ fontSize: 13, margin: 0 }}>This brief is <strong>94% aligned</strong> with your core objective: <strong>Brand Awareness</strong>.</p>
      </Card>
    </div>
  );
}

function Step2Creative() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Creative Guidelines</label>
        <div style={{ display: 'grid', gap: 16 }}>
          <TextField label="Core Content Theme" placeholder="e.g. Get Ready With Me (GRWM)" />
          <TextField label="Primary Hook Idea" placeholder="e.g. Stop buying skincare for the vibe..." />
        </div>
      </section>

      <section>
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Technical Specifications</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Audio Strategy" compact>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Badge tone="selected">Voiceover + Music</Badge>
              <Badge tone="neutral">Trending Audio Only</Badge>
            </div>
          </Card>
          <Card title="Lighting Vibe" compact>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Badge tone="selected">Natural Daylight</Badge>
              <Badge tone="neutral">Studio Ring Light</Badge>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Social Metadata</label>
        <div style={{ padding: 16, background: 'var(--surface-page)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            #skincaretips #morningroutine @thecreatorshop #ad
          </p>
        </div>
      </section>
    </div>
  );
}

function Step3Logistics() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Fulfillment & Logistics</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card compact>
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>DEADLINE</label>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>July 31, 2024</div>
          </Card>
          <Card compact>
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>SAMPLE REQ.</label>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>Physical Required</div>
          </Card>
        </div>
      </section>

      <section>
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Compensation Framework</label>
        <div style={{ padding: 24, background: '#000', color: 'white', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)' }}>TOKEN VALUE</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)' }}>ESCROW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <strong style={{ fontSize: 32 }}>$15,000.00</strong>
            <strong style={{ fontSize: 20 }}>30% ADVANCE</strong>
          </div>
        </div>
      </section>

      <section>
        <label className="aurora-label" style={{ marginBottom: 12, display: 'block' }}>Usage Rights & Legal</label>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <Check size={16} className="text-primary" />
            <span>90-Day Whitelisting Inclusion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <Check size={16} className="text-primary" />
            <span>Indefinite Reposting License</span>
          </div>
        </div>
      </section>
    </div>
  );
}
