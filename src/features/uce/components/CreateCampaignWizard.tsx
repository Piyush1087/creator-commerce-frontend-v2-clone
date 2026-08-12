import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

import { Alert } from "../../../design-system/aurora";
import { Button } from "../../../design-system/aurora/components/Button";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  BrandUceWizardValidationError,
  createCampaignFromWizard,
} from "../api/brand-uce-client";
import { mapWizardToCanonicalPayload } from "../mappers/map-wizard-to-canonical-payload";
import type {
  AdvancePaymentPercentage,
  BrandSupportType,
  CampaignObjective,
  CampaignVisibility,
  CompensationModel,
  PayoutTerms,
  WizardData,
  WizardFieldErrors,
  WizardFieldKey,
} from "../types/campaign-wizard";
import {
  firstWizardErrorStep,
  firstWizardFieldError,
  flattenIssuesToFieldErrors,
  getFieldError,
  validateCampaignWizardStep,
  validateFullCampaignWizard,
  wizardStepForField,
} from "../utils/validate-campaign-wizard";
import { buildCampaignDetailPath } from "../utils/uce-format";
import "./CreateCampaignWizard.css";
import "../uce-responsive.css";

const STEP_LABELS = ["Campaign Strategy", "Creator Strategy", "Commercial Strategy"] as const;

const OBJECTIVES: Array<{ value: CampaignObjective; label: string; description: string }> = [
  { value: "PULSE", label: "Awareness & Reach", description: "Maximize unique reach and visibility." },
  { value: "PROOF", label: "Trust & Validation", description: "Build credibility through meaningful engagement." },
  { value: "PRODUCTION", label: "High-Quality Assets", description: "Generate reusable creator content." },
  { value: "PUSH", label: "Direct Action", description: "Drive measurable action through campaign links." },
];

const VISIBILITY: Array<{ value: CampaignVisibility; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "ELIGIBLE_CREATORS_ONLY", label: "Eligible creators only" },
  { value: "INVITE_ONLY", label: "Invite only" },
];

const ARCHETYPE_OPTIONS = [
  "Aesthetic",
  "Comedy",
  "Educational",
  "Lifestyle",
  "Fitness",
  "Beauty",
  "Tech",
] as const;

const ADVANCE_OPTIONS: AdvancePaymentPercentage[] = [0, 25, 50, 75, 100];
const PAYOUT_OPTIONS: Array<{ value: PayoutTerms; label: string }> = [
  { value: "NET_7", label: "Net 7" },
  { value: "NET_15", label: "Net 15" },
  { value: "NET_30", label: "Net 30" },
  { value: "NET_45", label: "Net 45" },
  { value: "NET_60", label: "Net 60" },
];
const BRAND_SUPPORT_OPTIONS: Array<{ value: BrandSupportType; label: string }> = [
  { value: "PRODUCT", label: "Product" },
  { value: "SERVICE", label: "Service" },
  { value: "EXPERIENCE", label: "Experience" },
  { value: "ACCESS_SUBSCRIPTION", label: "Access / subscription" },
  { value: "OTHER", label: "Other" },
];

const INITIAL_DATA: WizardData = {
  name: "",
  objective: "",
  publishingSchedule: "EVERGREEN",
  publishFrom: "",
  publishUntil: "",
  visibility: "PUBLIC",
  archetypes: [],
  minimumFollowers: 0,
  maximumFollowers: null,
  audienceAgeMin: 18,
  audienceAgeMax: 34,
  audienceGender: "ALL",
  affinityIds: [],
  geographyLabels: [],
  receivesBrandSupport: false,
  brandSupportType: null,
  brandSupportEstimatedValue: null,
  compensationModel: "FIXED",
  commercialOffer: 0,
  totalCampaignBudget: 0,
  advancePaymentPercentage: 0,
  payoutTerms: "NET_30",
};

export function CreateCampaignWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const patchData = (patch: Partial<WizardData>, touched?: WizardFieldKey) => {
    setData((prev) => ({ ...prev, ...patch }));
    if (touched) {
      setFieldErrors((prev) => {
        if (!prev[touched]) return prev;
        const next = { ...prev };
        delete next[touched];
        return next;
      });
    }
    if (formError) setFormError(null);
  };

  const validateOnExit = (field: WizardFieldKey) => {
    const fieldStep = wizardStepForField(field);
    const result = validateCampaignWizardStep(fieldStep, data);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (result.success || !result.fieldErrors[field]) delete next[field];
      else next[field] = result.fieldErrors[field];
      return next;
    });
  };

  const applyValidationFailure = (errors: WizardFieldErrors, message: string) => {
    setFieldErrors(errors);
    setFormError(message);
    const errorStep = firstWizardErrorStep(errors);
    if (errorStep) setStep(errorStep);
  };

  const handleContinue = async () => {
    const current = validateCampaignWizardStep(step, data);
    if (!current.success) {
      applyValidationFailure(current.fieldErrors, current.formError);
      return;
    }

    if (step < 3) {
      setFieldErrors({});
      setFormError(null);
      setStep((step + 1) as 1 | 2 | 3);
      return;
    }

    const aggregate = validateFullCampaignWizard(data);
    if (!aggregate.success) {
      applyValidationFailure(aggregate.fieldErrors, aggregate.formError);
      return;
    }

    setIsPublishing(true);
    try {
      const shell = await createCampaignFromWizard(mapWizardToCanonicalPayload(data));
      navigate(buildCampaignDetailPath(shell.campaign_id));
    } catch (error) {
      if (error instanceof BrandUceWizardValidationError) {
        const errors = flattenIssuesToFieldErrors(error.issues);
        applyValidationFailure(errors, firstWizardFieldError(errors, error.message));
      } else {
        setFormError(error instanceof Error ? error.message : "Could not create Campaign.");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const objectiveLabel = useMemo(
    () => OBJECTIVES.find((item) => item.value === data.objective)?.label ?? "Not selected",
    [data.objective],
  );

  return (
    <div className="create-wizard">
      <div className="create-wizard-workspace">
        <section className="create-wizard-form">
          <div className="create-wizard-form-inner">
            {formError ? (
              <div className="create-wizard-form-alert">
                <Alert tone="error" title="Check Campaign details">
                  {formError}
                </Alert>
              </div>
            ) : null}

            {step === 1 ? (
              <StrategyStep data={data} patchData={patchData} errors={fieldErrors} validateOnExit={validateOnExit} />
            ) : null}
            {step === 2 ? (
              <CreatorStep data={data} patchData={patchData} errors={fieldErrors} validateOnExit={validateOnExit} />
            ) : null}
            {step === 3 ? (
              <CommercialStep data={data} patchData={patchData} errors={fieldErrors} validateOnExit={validateOnExit} />
            ) : null}
          </div>
        </section>

        <aside className="create-wizard-ledger">
          <div className="create-wizard-ledger-head">
            <span className="cw-label cw-label--section">Campaign context</span>
            <strong>{data.name.trim() || "Untitled Campaign"}</strong>
          </div>
          <div className="create-wizard-ledger-body">
            <LedgerRow label="Objective" value={objectiveLabel} />
            <LedgerRow label="Schedule" value={data.publishingSchedule === "EVERGREEN" ? "Evergreen" : "Scheduled"} />
            <LedgerRow label="Platform" value="Instagram" />
            <LedgerRow label="Visibility" value={VISIBILITY.find((item) => item.value === data.visibility)?.label ?? data.visibility} />
            <LedgerRow label="Archetypes" value={data.archetypes.length ? data.archetypes.join(", ") : "Not selected"} />
            <LedgerRow label="Commercial offer" value={data.commercialOffer > 0 ? data.commercialOffer.toLocaleString() : "Not set"} />
            <LedgerRow label="Total budget" value={data.totalCampaignBudget > 0 ? data.totalCampaignBudget.toLocaleString() : "Not set"} />
            <LedgerRow label="Currency" value="Derived from Brand country" />
          </div>
        </aside>
      </div>

      <footer className="create-wizard-footer">
        <div className="create-wizard-footer-hint">
          <Info size={18} className="text-primary" />
          <span>Step {step} of 3: {STEP_LABELS[step - 1]}</span>
        </div>
        <div className="create-wizard-footer-actions">
          <Button variant="ghost" onClick={() => navigate(AUTH_ROUTES.brandUceCampaigns)}>
            Cancel &amp; Exit
          </Button>
          {step > 1 ? (
            <Button variant="outline" onClick={() => { setFieldErrors({}); setFormError(null); setStep((step - 1) as 1 | 2 | 3); }}>
              <ArrowLeft size={18} /> Back
            </Button>
          ) : null}
          <Button variant="primary" disabled={isPublishing} onClick={() => void handleContinue()}>
            {step === 3 ? (isPublishing ? "Creating Campaign…" : "Create Campaign") : (
              <>Next: {STEP_LABELS[step]} <ArrowRight size={18} /></>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function StrategyStep({ data, patchData, errors, validateOnExit }: StepProps) {
  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Campaign Strategy</h1>
        <p>Define the Campaign objective, publishing window and marketplace visibility.</p>
      </header>
      <div className="create-wizard-fields">
        <WizardField label="Campaign Name" required error={getFieldError(errors, "name")}>
          <input className="cw-input" maxLength={60} value={data.name} placeholder="e.g., Summer Skin Reset" onChange={(e) => patchData({ name: e.target.value }, "name")} onBlur={() => validateOnExit("name")} />
        </WizardField>

        <WizardField label="Campaign Objective" required error={getFieldError(errors, "objective")}>
          <select className="cw-input cw-select" value={data.objective} onChange={(e) => patchData({ objective: e.target.value as CampaignObjective }, "objective")} onBlur={() => validateOnExit("objective")}>
            <option value="">Select an objective</option>
            {OBJECTIVES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          {data.objective ? <p className="cw-hint">{OBJECTIVES.find((item) => item.value === data.objective)?.description}</p> : null}
        </WizardField>

        <WizardField label="Publishing Schedule" required error={getFieldError(errors, "publishingSchedule")}>
          <div className="cw-timeline-panel">
            <div className="cw-radio-row">
              <label className="cw-radio"><input type="radio" checked={data.publishingSchedule === "EVERGREEN"} onChange={() => patchData({ publishingSchedule: "EVERGREEN", publishFrom: "", publishUntil: "" }, "publishingSchedule")} /> <span>Evergreen</span></label>
              <label className="cw-radio"><input type="radio" checked={data.publishingSchedule === "SCHEDULED"} onChange={() => patchData({ publishingSchedule: "SCHEDULED" }, "publishingSchedule")} /> <span>Scheduled</span></label>
            </div>
            {data.publishingSchedule === "SCHEDULED" ? (
              <div className="cw-date-row">
                <label className="cw-date-field"><span>Start date</span><input type="date" className="cw-input cw-input--sm" value={data.publishFrom} onChange={(e) => patchData({ publishFrom: e.target.value }, "publishFrom")} onBlur={() => validateOnExit("publishFrom")} /></label>
                <label className="cw-date-field"><span>End date</span><input type="date" className="cw-input cw-input--sm" value={data.publishUntil} onChange={(e) => patchData({ publishUntil: e.target.value }, "publishUntil")} onBlur={() => validateOnExit("publishUntil")} /></label>
              </div>
            ) : null}
          </div>
          {getFieldError(errors, "publishFrom") ? <p className="cw-field-error">{getFieldError(errors, "publishFrom")}</p> : null}
          {getFieldError(errors, "publishUntil") ? <p className="cw-field-error">{getFieldError(errors, "publishUntil")}</p> : null}
        </WizardField>

        <WizardField label="Platform">
          <div className="cw-timeline-panel"><strong>Instagram</strong><span className="cw-hint">Instagram is the supported MVP platform. Deliverables are defined inside Briefs, not Create Campaign.</span></div>
        </WizardField>

        <WizardField label="Campaign Visibility" required error={getFieldError(errors, "visibility")}>
          <select className="cw-input cw-select" value={data.visibility} onChange={(e) => patchData({ visibility: e.target.value as CampaignVisibility }, "visibility")} onBlur={() => validateOnExit("visibility")}>
            {VISIBILITY.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </WizardField>
      </div>
    </div>
  );
}

function CreatorStep({ data, patchData, errors, validateOnExit }: StepProps) {
  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Creator Strategy</h1>
        <p>Define the creators and creator-audience profile this Campaign should target.</p>
      </header>
      <div className="create-wizard-fields create-wizard-fields--grid">
        <WizardField label="Creator Archetypes" required className="cw-field--full" error={getFieldError(errors, "archetypes")}>
          <div className="cw-format-chips" style={{ paddingLeft: 0 }}>
            {ARCHETYPE_OPTIONS.map((item) => {
              const selected = data.archetypes.includes(item);
              return <button type="button" key={item} className={`cw-format-chip ${selected ? "cw-format-chip--active" : ""}`} onClick={() => patchData({ archetypes: selected ? data.archetypes.filter((value) => value !== item) : data.archetypes.length < 5 ? [...data.archetypes, item] : data.archetypes }, "archetypes")}>{item}</button>;
            })}
          </div>
          <p className="cw-hint">Select 1–5 archetypes.</p>
        </WizardField>

        <WizardField label="Minimum Followers" required error={getFieldError(errors, "minimumFollowers")}>
          <input type="number" min={0} className="cw-input" value={data.minimumFollowers} onChange={(e) => patchData({ minimumFollowers: Math.max(0, Number(e.target.value) || 0) }, "minimumFollowers")} onBlur={() => validateOnExit("minimumFollowers")} />
        </WizardField>
        <WizardField label="Maximum Followers" error={getFieldError(errors, "maximumFollowers")}>
          <input type="number" min={0} className="cw-input" value={data.maximumFollowers ?? ""} placeholder="No maximum" onChange={(e) => patchData({ maximumFollowers: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) }, "maximumFollowers")} onBlur={() => validateOnExit("maximumFollowers")} />
        </WizardField>

        <WizardField label="Audience Age — Min" required error={getFieldError(errors, "audienceAgeMin")}>
          <input type="number" min={13} max={65} className="cw-input" value={data.audienceAgeMin} onChange={(e) => patchData({ audienceAgeMin: Number(e.target.value) }, "audienceAgeMin")} onBlur={() => validateOnExit("audienceAgeMin")} />
        </WizardField>
        <WizardField label="Audience Age — Max" required error={getFieldError(errors, "audienceAgeMax")}>
          <input type="number" min={13} max={65} className="cw-input" value={data.audienceAgeMax} onChange={(e) => patchData({ audienceAgeMax: Number(e.target.value) }, "audienceAgeMax")} onBlur={() => validateOnExit("audienceAgeMax")} />
        </WizardField>

        <WizardField label="Audience Gender" required error={getFieldError(errors, "audienceGender")}>
          <select className="cw-input cw-select" value={data.audienceGender} onChange={(e) => patchData({ audienceGender: e.target.value as WizardData["audienceGender"] }, "audienceGender")}>
            <option value="ALL">All</option><option value="FEMALE">Female</option><option value="MALE">Male</option>
          </select>
        </WizardField>

        <WizardField label="Audience Affinity IDs" className="cw-field--full" error={getFieldError(errors, "affinityIds")}>
          <CommaListInput values={data.affinityIds} placeholder="Add canonical affinity IDs, comma separated (max 5)" maxItems={5} onChange={(values) => patchData({ affinityIds: values }, "affinityIds")} onBlur={() => validateOnExit("affinityIds")} />
          <p className="cw-hint">Temporary production input until the canonical affinity search picker is connected.</p>
        </WizardField>

        <WizardField label="Audience Geography" className="cw-field--full" error={getFieldError(errors, "geographyLabels")}>
          <CommaListInput values={data.geographyLabels} placeholder="Add city, region or country labels" onChange={(values) => patchData({ geographyLabels: values }, "geographyLabels")} onBlur={() => validateOnExit("geographyLabels")} />
          <p className="cw-hint">Google Maps Places normalization remains the required production provider boundary; these labels are not treated as normalized Places records.</p>
        </WizardField>
      </div>
    </div>
  );
}

function CommercialStep({ data, patchData, errors, validateOnExit }: StepProps) {
  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Commercial Strategy</h1>
        <p>Set Campaign-wide Brand support, creator offer, budget and payment terms.</p>
      </header>
      <div className="create-wizard-fields create-wizard-fields--grid">
        <WizardField label="Brand Support" className="cw-field--full">
          <div className="cw-radio-row">
            <label className="cw-radio"><input type="radio" checked={!data.receivesBrandSupport} onChange={() => patchData({ receivesBrandSupport: false, brandSupportType: null, brandSupportEstimatedValue: null }, "receivesBrandSupport")} /> <span>No non-cash Brand support</span></label>
            <label className="cw-radio"><input type="radio" checked={data.receivesBrandSupport} onChange={() => patchData({ receivesBrandSupport: true }, "receivesBrandSupport")} /> <span>Brand provides support</span></label>
          </div>
        </WizardField>

        {data.receivesBrandSupport ? <>
          <WizardField label="Support Type" required error={getFieldError(errors, "brandSupportType")}>
            <select className="cw-input cw-select" value={data.brandSupportType ?? ""} onChange={(e) => patchData({ brandSupportType: (e.target.value || null) as BrandSupportType | null }, "brandSupportType")} onBlur={() => validateOnExit("brandSupportType")}>
              <option value="">Select support</option>{BRAND_SUPPORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </WizardField>
          <WizardField label="Estimated Support Value" error={getFieldError(errors, "brandSupportEstimatedValue")}>
            <input type="number" min={0} className="cw-input" value={data.brandSupportEstimatedValue ?? ""} placeholder="Optional" onChange={(e) => patchData({ brandSupportEstimatedValue: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) }, "brandSupportEstimatedValue")} onBlur={() => validateOnExit("brandSupportEstimatedValue")} />
          </WizardField>
        </> : null}

        <WizardField label="Compensation Model" required error={getFieldError(errors, "compensationModel")}>
          <select className="cw-input cw-select" value={data.compensationModel} onChange={(e) => patchData({ compensationModel: e.target.value as CompensationModel }, "compensationModel")}>
            <option value="FIXED">Fixed</option><option value="NEGOTIABLE">Negotiable</option>
          </select>
        </WizardField>
        <WizardField label={data.compensationModel === "NEGOTIABLE" ? "Payout Starting From" : "Commercial Offer"} required error={getFieldError(errors, "commercialOffer")}>
          <input type="number" min={0} className="cw-input" value={data.commercialOffer} onChange={(e) => patchData({ commercialOffer: Math.max(0, Number(e.target.value) || 0) }, "commercialOffer")} onBlur={() => validateOnExit("commercialOffer")} />
        </WizardField>

        <WizardField label="Total Campaign Budget" required error={getFieldError(errors, "totalCampaignBudget")}>
          <input type="number" min={0} className="cw-input" value={data.totalCampaignBudget} onChange={(e) => patchData({ totalCampaignBudget: Math.max(0, Number(e.target.value) || 0) }, "totalCampaignBudget")} onBlur={() => validateOnExit("totalCampaignBudget")} />
        </WizardField>
        <WizardField label="Advance Payment" required error={getFieldError(errors, "advancePaymentPercentage")}>
          <select className="cw-input cw-select" value={data.advancePaymentPercentage} onChange={(e) => patchData({ advancePaymentPercentage: Number(e.target.value) as AdvancePaymentPercentage }, "advancePaymentPercentage")}>
            {ADVANCE_OPTIONS.map((value) => <option key={value} value={value}>{value}%</option>)}
          </select>
        </WizardField>

        <WizardField label="Payment Terms" required error={getFieldError(errors, "payoutTerms")}>
          <select className="cw-input cw-select" value={data.payoutTerms} onChange={(e) => patchData({ payoutTerms: e.target.value as PayoutTerms }, "payoutTerms")}>
            {PAYOUT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </WizardField>
        <WizardField label="Campaign Currency">
          <div className="cw-timeline-panel"><strong>System derived</strong><span className="cw-hint">India → INR; United States → USD; rest of world → USD. Currency is not user editable.</span></div>
        </WizardField>
      </div>
    </div>
  );
}

type StepProps = {
  data: WizardData;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  errors: WizardFieldErrors;
  validateOnExit: (field: WizardFieldKey) => void;
};

function WizardField({ label, error, required, className, children }: { label: string; error?: string; required?: boolean; className?: string; children: ReactNode }) {
  return <div className={`cw-field ${error ? "cw-field--error" : ""} ${className ?? ""}`}><span className="cw-label">{label}{required ? <span className="cw-required">Required</span> : null}</span>{children}{error ? <p className="cw-field-error" role="alert">{error}</p> : null}</div>;
}

function CommaListInput({ values, onChange, onBlur, placeholder, maxItems }: { values: string[]; onChange: (values: string[]) => void; onBlur?: () => void; placeholder: string; maxItems?: number }) {
  return <input className="cw-input" value={values.join(", ")} placeholder={placeholder} onBlur={onBlur} onChange={(e) => { const next = e.target.value.split(",").map((value) => value.trim()).filter(Boolean); onChange(maxItems ? next.slice(0, maxItems) : next); }} />;
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return <div className="cw-ledger-row"><span>{label}</span><strong>{value}</strong></div>;
}
