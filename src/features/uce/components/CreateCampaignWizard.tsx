import { useState } from "react";
import { 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  Instagram,
  Video,
  Youtube,
  CheckCircle2,
  Users,
  Target,
  DollarSign,
  AlertCircle,
  Clock,
  Layers,
  Search,
  Check,
  TrendingUp,
  Globe,
  Smile,
  Megaphone,
  X,
  Zap,
  FileText
} from "lucide-react";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { Badge } from "../../../design-system/aurora/components/Badge";
import { TextField } from "../../../design-system/aurora/components/TextField";
import { SelectionCard } from "../../../design-system/aurora/components/SelectionCard";
import "./CreateCampaignWizard.css";
import "../uce-responsive.css";

export function CreateCampaignWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: "Spring Glow 2024 Launch",
    objective: "Brand Awareness",
    timeline: "Fixed Date Range",
    platforms: ["Instagram", "TikTok"],
    industries: ["Beauty & Cosmetics"],
    archetype: "Aesthetic",
    budget: 25000,
    payoutTerms: "Net 15"
  });

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  return (
    <div className="create-wizard-layout">
      <main className="wizard-main">
        <header className="wizard-header">
          <div className="wizard-progress-track">
            <div className={`step-unit ${step >= 1 ? 'active' : ''}`}>
              <span className="step-num">{step > 1 ? <Check size={14} /> : 1}</span>
              <span className="step-label">Strategy</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-unit ${step >= 2 ? 'active' : ''}`}>
              <span className="step-num">{step > 2 ? <Check size={14} /> : 2}</span>
              <span className="step-label">Targeting</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-unit ${step >= 3 ? 'active' : ''}`}>
              <span className="step-num">3</span>
              <span className="step-label">Commercials</span>
            </div>
          </div>
        </header>

        <div className="wizard-content">
          {step === 1 && <Step1Strategy data={data} setData={setData} />}
          {step === 2 && <Step2Targeting data={data} setData={setData} />}
          {step === 3 && <Step3Commercials data={data} setData={setData} />}
        </div>

        <footer className="wizard-footer">
          <Button variant="ghost" onClick={() => {}}>Cancel & Exit</Button>
          <div className="footer-actions">
            {step > 1 && <Button variant="outline" onClick={prevStep}><ArrowLeft size={18} /> Back</Button>}
            <Button variant="primary" onClick={nextStep}>
              {step === 3 ? "Save & Publish Campaign" : `Next Step: ${step === 1 ? "Creator Targeting" : "Commercials & Terms"}`}
              {step < 3 && <ArrowRight size={18} />}
            </Button>
          </div>
        </footer>
      </main>

      <aside className="wizard-ledger">
        <div className="ledger-sticky">
          <h3 className="ledger-title">Campaign Snapshot</h3>
          
          <div className="ledger-section">
            <label>Current Progress</label>
            <div className="ledger-row">
              <strong>{data.name}</strong>
              <Badge tone="success">Draft</Badge>
            </div>
            <div className="ledger-row">
              <span className="text-muted">Vertical:</span>
              <span>{data.industries.join(", ")}</span>
            </div>
          </div>

          <div className="ledger-section">
            <label>Audience Architecture</label>
            <div className="ledger-row">
              <Users size={14} />
              <span>10k - 250k (Micro/Mid)</span>
            </div>
            <div className="ledger-row">
              <Globe size={14} />
              <span>US, UK, Western Europe</span>
            </div>
          </div>

          <div className="ledger-section">
            <label>Real-time Reach Est.</label>
            <div className="ledger-row">
              <TrendingUp size={14} className="text-primary" />
              <strong>2.4M - 4.1M Reach</strong>
            </div>
            <div className="ledger-row">
              <Target size={14} className="text-primary" />
              <strong>4.2% Match Index</strong>
            </div>
          </div>

          <div className="ledger-footer">
            <div className="budget-stack">
              <span>Planned Allocation</span>
              <strong>${data.budget.toLocaleString()}</strong>
            </div>
            <div className="escrow-note">
              <AlertCircle size={12} />
              <span>30% Advance Escrow Required</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Step1Strategy({ data, setData }: any) {
  return (
    <div className="step-view">
      <h1 className="step-title">Campaign Strategy</h1>
      <p className="step-desc">Establish core metadata, timelines, and primary objectives for this activation.</p>

      <div className="form-grid">
        <TextField 
          label="Operational Campaign Name" 
          value={data.name} 
          onChange={(e) => setData({ ...data, name: e.target.value })} 
          placeholder="e.g. Summer Skincare Routine"
        />

        <div className="field-group">
          <label className="aurora-label">Core Objectives</label>
          <div className="selection-grid-3">
            {["Brand Awareness", "Traffic & Clicks", "Sales & Conversions"].map(obj => (
              <SelectionCard
                key={obj}
                title={obj}
                selected={data.objective === obj}
                onClick={() => setData({ ...data, objective: obj })}
                icon={obj === "Brand Awareness" ? <Eye size={18} /> : obj === "Traffic" ? <TrendingUp size={18} /> : <Target size={18} />}
              />
            ))}
          </div>
        </div>

        <div className="field-group">
          <label className="aurora-label">Timeline Structure</label>
          <div className="selection-grid-2">
            <SelectionCard
              title="Fixed Date Range"
              description="Specific start/end dates for launches."
              selected={data.timeline === "Fixed Date Range"}
              onClick={() => setData({ ...data, timeline: "Fixed Date Range" })}
              icon={<Clock size={18} />}
            />
            <SelectionCard
              title="Dynamic Milestone Track"
              description="Evergreen flow based on duration."
              selected={data.timeline === "Dynamic Milestone Track"}
              onClick={() => setData({ ...data, timeline: "Dynamic Milestone Track" })}
              icon={<Layers size={18} />}
            />
          </div>
        </div>

        <div className="field-group">
          <label className="aurora-label">Platform Matrix</label>
          <div className="platform-matrix">
            <div className="platform-item active">
              <Instagram size={20} color="#E1306C" />
              <span>Instagram</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge tone="success">Reels</Badge>
                <Badge tone="success">Stories</Badge>
              </div>
            </div>
            <div className="platform-item active">
              <Video size={20} color="#000" />
              <span>TikTok</span>
              <Badge tone="success">Videos</Badge>
            </div>
            <div className="platform-item">
              <Youtube size={20} color="#FF0000" />
              <span>YouTube</span>
              <Badge tone="neutral">Shorts</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Targeting({ data, setData }: any) {
  return (
    <div className="step-view">
      <h1 className="step-title">Creator Targeting</h1>
      <p className="step-desc">Define the creator persona and demographic reach for the matching engine.</p>

      <div className="form-grid">
        <div className="field-group">
          <label className="aurora-label">Industry Verticals</label>
          <div className="chip-cloud">
            {["Fashion", "Beauty & Cosmetics", "Tech", "Fitness", "Lifestyle"].map(ind => (
              <Badge 
                key={ind} 
                tone={data.industries.includes(ind) ? "selected" : "neutral"}
                onClick={() => {
                  const current = data.industries;
                  setData({ ...data, industries: current.includes(ind) ? current.filter((i: string) => i !== ind) : [...current, ind] });
                }}
                style={{ cursor: 'pointer' }}
              >
                {ind}
              </Badge>
            ))}
          </div>
        </div>

        <div className="field-group">
          <label className="aurora-label">Creator Archetype</label>
          <div className="selection-grid-3">
            {["Aesthetic", "Comedy", "Educational"].map(arch => (
              <SelectionCard
                key={arch}
                title={arch}
                selected={data.archetype === arch}
                onClick={() => setData({ ...data, archetype: arch })}
                icon={arch === "Aesthetic" ? <Smile size={18} /> : arch === "Comedy" ? <Zap size={18} /> : <FileText size={18} />}
              />
            ))}
          </div>
        </div>

        <div className="field-group">
          <label className="aurora-label">Disqualifying Keywords</label>
          <div className="keyword-input-wrap">
            <div className="keyword-chips">
              <Badge tone="error">Gambling <X size={10} /></Badge>
              <Badge tone="error">Controversial <X size={10} /></Badge>
            </div>
            <input type="text" placeholder="Add keywords to exclude..." />
          </div>
        </div>

        <div className="demo-grid-hardened">
          <Card title="Age Range" compact>
            <div className="age-track">
              <div className="age-fill"></div>
              <span>18 - 34 Years</span>
            </div>
          </Card>
          <Card title="Gender Focus" compact>
            <div className="gender-split">
              <strong>82% Female</strong>
              <div className="split-bar"><div style={{ width: '82%' }}></div></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Step3Commercials({ data, setData }: any) {
  return (
    <div className="step-view">
      <h1 className="step-title">Commercial Terms</h1>
      <p className="step-desc">Configure compensation frameworks and payout schedules.</p>

      <div className="form-grid">
        <div className="field-group">
          <label className="aurora-label">Compensation Model</label>
          <div className="selection-grid-2">
            <SelectionCard
              title="Fixed Fee"
              description="A set flat rate for every creator."
              selected={true}
              icon={<DollarSign size={18} />}
            />
            <SelectionCard
              title="Negotiable Offers"
              description="Propose ranges and negotiate individually."
              selected={false}
              icon={<Megaphone size={18} />}
            />
          </div>
        </div>

        <div className="budget-input-card">
          <label>TOTAL CAMPAIGN CEILING</label>
          <div className="currency-field">
            <span>$</span>
            <input 
              type="number" 
              value={data.budget} 
              onChange={(e) => setData({ ...data, budget: parseInt(e.target.value) })}
            />
          </div>
          <p className="budget-helper">Min. 30% Advance Escrow: ${(data.budget * 0.3).toLocaleString()}</p>
        </div>

        <div className="field-group">
          <label className="aurora-label">Balance Payout Terms</label>
          <div className="selection-grid-4">
            {["Immediate", "Net 7", "Net 15", "Net 30"].map(term => (
              <button 
                key={term}
                className={`term-btn ${data.payoutTerms === term ? 'active' : ''}`}
                onClick={() => setData({ ...data, payoutTerms: term })}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <Card title="Usage Rights Summary" compact>
          <div className="usage-grid-hd">
            <div className="u-item"><label>BIO-LINK</label><span>30 Days</span></div>
            <div className="u-item"><label>WHITELISTING</label><span>90 Days</span></div>
            <div className="u-item"><label>REPOSTING</label><span>Indefinite</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
