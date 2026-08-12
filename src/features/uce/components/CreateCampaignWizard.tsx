import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

import { Alert } from "../../../design-system/aurora";
import { Button } from "../../../design-system/aurora/components/Button";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  autosaveCanonicalCampaignField,
  createCanonicalCampaignDraft,
  fetchCanonicalCampaignDraft,
  publishCanonicalCampaignDraft,
} from "../api/canonical-campaign-draft-client";
import {
  canonicalDraftPatchForField,
  mergeCanonicalDraftIntoWizardData,
} from "../mappers/canonical-campaign-draft";
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
  getFieldError,
  validateCampaignWizardStep,
  validateFullCampaignWizard,
  wizardStepForField,
} from "../utils/validate-campaign-wizard";
import { buildCampaignDetailPath } from "../utils/uce-format";
import { AudienceAffinityPicker } from "./AudienceAffinityPicker";
import { AudienceGeographyPicker } from "./AudienceGeographyPicker";
import "./CreateCampaignWizard.css";
import "../uce-responsive.css";

const DRAFT_STORAGE_KEY = "creator-shop:campaign:create:draft-id";
const STEP_LABELS = ["Campaign Strategy", "Creator Strategy", "Commercial Strategy"] as const;

const OBJECTIVES: Array<{
  value: CampaignObjective;
  label: string;
  description: string;
}> = [
  { value: "PULSE", label: "Awareness & Reach", description: "Maximize unique reach and visibility." },
  { value: "PROOF", label: "Trust & Validation", description: "Build credibility through meaningful engagement." },
  { value: "PRODUCTION", label: "High-Quality Assets", description: "Generate reusable creator content." },
  { value: "PUSH", label: "Direct Action", description: "Drive measurable action through Campaign links." },
];

const VISIBILITY: Array<{ value: CampaignVisibility; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "ELIGIBLE_CREATORS_ONLY", label: "Eligible creators only" },
  { value: "INVITE_ONLY", label: "Invite only" },
];

const ARCHETYPE_OPTIONS = [
  ["TRENDSETTER", "Trendsetter"],
  ["ENTERTAINER", "Entertainer"],
  ["VIRAL_CREATOR", "Viral Creator"],
  ["CHALLENGER", "Challenger"],
  ["LIFESTYLE_INTEGRATOR", "Lifestyle Integrator"],
  ["STORYTELLER", "Storyteller"],
  ["EDUCATOR", "Educator"],
  ["INDUSTRY_EXPERT", "Industry Expert"],
  ["DEEP_DIVER", "Deep Diver"],
  ["MYTH_BUSTER", "Myth Buster"],
  ["RELATABLE_PEER", "Relatable Peer"],
  ["COMMUNITY_BUILDER", "Community Builder"],
  ["LOCAL_GUIDE", "Local Guide"],
  ["CONVERSATION_STARTER", "Conversation Starter"],
  ["ADVOCATE", "Advocate"],
  ["PROBLEM_SOLVER", "Problem Solver"],
  ["PRODUCT_REVIEWER", "Product Reviewer"],
  ["DEAL_HUNTER", "Deal Hunter"],
  ["COMPARISON_CREATOR", "Comparison Creator"],
  ["CURATED_COLLECTOR", "Curated Collector"],
  ["VISUAL_ARTIST", "Visual Artist"],
  ["UGC_CREATOR", "UGC Creator"],
  ["CINEMATIC_CREATOR", "Cinematic Creator"],
  ["CREATIVE_DIRECTOR", "Creative Director"],
  ["AESTHETIC_MINIMALIST", "Aesthetic Minimalist"],
  ["FOUNDER_VOICE", "Founder Voice"],
  ["COACH", "Coach"],
  ["RESEARCHER", "Researcher"],
  ["THOUGHT_LEADER", "Thought Leader"],
  ["DEMONSTRATOR", "Demonstrator"],
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

const STEP_FIELDS: Record<1 | 2 | 3, WizardFieldKey[]> = {
  1: ["name", "objective", "publishingSchedule", "publishFrom", "publishUntil", "visibility"],
  2: ["archetypes", "minimumFollowers", "maximumFollowers", "audienceAgeMin", "audienceAgeMax", "audienceGender", "affinityIds", "audienceGeographies"],
  3: ["receivesBrandSupport", "brandSupportType", "brandSupportEstimatedValue", "compensationModel", "commercialOffer", "totalCampaignBudget", "advancePaymentPercentage", "payoutTerms"],
};

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
  audienceGeographies: [],
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
  const initStarted = useRef(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState("Preparing draft…");
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    void (async () => {
      const storedId = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (storedId) {
        try {
          const existing = await fetchCanonicalCampaignDraft(storedId);
          setData((current) => mergeCanonicalDraftIntoWizardData(current, existing.draft));
          setDraftId(existing.campaignId);
          setDraftStatus("Draft resumed");
          return;
        } catch {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }

      try {
        const created = await createCanonicalCampaignDraft();
        window.localStorage.setItem(DRAFT_STORAGE_KEY, created.campaignId);
        setDraftId(created.campaignId);
        setDraftStatus("Draft created");
      } catch (error) {
        setDraftStatus("Draft unavailable");
        setFormError(error instanceof Error ? error.message : "Could not create Campaign draft.");
      }
    })();
  }, []);

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

  const saveField = async (field: WizardFieldKey, snapshot: WizardData = data) => {
    if (!draftId) return;
    const patch = canonicalDraftPatchForField(field, snapshot);
    if (!patch) return;
    setDraftStatus("Saving…");
    await autosaveCanonicalCampaignField(draftId, patch.path, patch.value);
    setDraftStatus("Draft saved");
  };

  const validateOnExit = async (field: WizardFieldKey) => {
    const fieldStep = wizardStepForField(field);
    const result = validateCampaignWizardStep(fieldStep, data);
    const fieldError = result.success ? undefined : result.fieldErrors[field];

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (!fieldError) delete next[field];
      else next[field] = fieldError;
      return next;
    });

    if (!fieldError) {
      try {
        await saveField(field);
      } catch (error) {
        setDraftStatus("Save failed");
        setFormError(error instanceof Error ? error.message : "Could not autosave Campaign draft.");
      }
    }
  };

  const saveCurrentStep = async () => {
    if (!draftId) throw new Error("Campaign draft is not ready yet.");
    setDraftStatus("Saving…");
    for (const field of STEP_FIELDS[step]) {
      const patch = canonicalDraftPatchForField(field, data);
      if (patch) await autosaveCanonicalCampaignField(draftId, patch.path, patch.value);
    }
    setDraftStatus("Draft saved");
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

    try {
      await saveCurrentStep();
    } catch (error) {
      setDraftStatus("Save failed");
      setFormError(error instanceof Error ? error.message : "Could not save Campaign draft.");
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
    if (!draftId) {
      setFormError("Campaign draft is not ready yet.");
      return;
    }

    setIsPublishing(true);
    try {
      const shell = await publishCanonicalCampaignDraft(
        draftId,
        mapWizardToCanonicalPayload(data),
      );
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      navigate(buildCampaignDetailPath(shell.campaign_id));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not publish Campaign.");
    } finally {
      setIsPublishing(false);
    }
  };

  const objectiveLabel = useMemo(
    () => OBJECTIVES.find((item) => item.value === data.objective)?.label ?? "Not selected",
    [data.objective],
  );
  const archetypeLabel = (id: string) =>
    ARCHETYPE_OPTIONS.find(([value]) => value === id)?.[1] ?? id;

  const stepProps: StepProps = { data, patchData, errors: fieldErrors, validateOnExit };

  return (
    <div className="create-wizard">
      <div className="create-wizard-workspace">
        <section className="create-wizard-form">
          <div className="create-wizard-form-inner">
            {formError ? (
              <div className="create-wizard-form-alert">
                <Alert tone="error" title="Check Campaign details">{formError}</Alert>
              </div>
            ) : null}

            {step === 1 ? <StrategyStep {...stepProps} /> : null}
            {step === 2 ? <CreatorStep {...stepProps} /> : null}
            {step === 3 ? <CommercialStep {...stepProps} /> : null}
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
            <LedgerRow label="Archetypes" value={data.archetypes.length ? data.archetypes.map(archetypeLabel).join(", ") : "Not selected"} />
            <LedgerRow label="Affinities" value={data.affinityIds.length ? `${data.affinityIds.length} selected` : "Optional"} />
            <LedgerRow label="Geography" value={data.audienceGeographies.length ? data.audienceGeographies.map((item) => item.label).join(", ") : "Not selected"} />
            <LedgerRow label="Commercial offer" value={data.commercialOffer > 0 ? data.commercialOffer.toLocaleString() : "Not set"} />
            <LedgerRow label="Total budget" value={data.totalCampaignBudget > 0 ? data.totalCampaignBudget.toLocaleString() : "Not set"} />
            <LedgerRow label="Currency" value="Derived from Brand country" />
            <LedgerRow label="Draft" value={draftStatus} />
          </div>
        </aside>
      </div>

      <footer className="create-wizard-footer">
        <div className="create-wizard-footer-hint">
          <Info size={18} className="text-primary" />
          <span>Step {step} of 3: {STEP_LABELS[step - 1]} · {draftStatus}</span>
        </div>
        <div className="create-wizard-footer-actions">
          <Button variant="ghost" onClick={() => navigate(AUTH_ROUTES.brandUceCampaigns)}>Cancel &amp; Exit</Button>
          {step > 1 ? (
            <Button variant="outline" onClick={() => { setFieldErrors({}); setFormError(null); setStep((step - 1) as 1 | 2 | 3); }}>
              <ArrowLeft size={18} /> Back
            </Button>
          ) : null}
          <Button variant="primary" disabled={isPublishing || !draftId} onClick={() => void handleContinue()}>
            {step === 3 ? (isPublishing ? "Publishing Campaign…" : "Save & Publish Campaign") : (
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
          <input className="cw-input" maxLength={60} value={data.name} placeholder="e.g., Summer Skin Reset" onChange={(e) => patchData({ name: e.target.value }, "name")} onBlur={() => void validateOnExit("name")} />
        </WizardField>

        <WizardField label="Campaign Objective" required error={getFieldError(errors, "objective")}>
          <select className="cw-input cw-select" value={data.objective} onChange={(e) => patchData({ objective: e.target.value as CampaignObjective }, "objective")} onBlur={() => void validateOnExit("objective")}>
            <option value="">Select an objective</option>
            {OBJECTIVES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          {data.objective ? <p className="cw-hint">{OBJECTIVES.find((item) => item.value === data.objective)?.description}</p> : null}
        </WizardField>

        <WizardField label="Publishing Schedule" required error={getFieldError(errors, "publishingSchedule")}>
          <div className="cw-timeline-panel">
            <div className="cw-radio-row">
              <label className="cw-radio"><input type="radio" checked={data.publishingSchedule === "EVERGREEN"} onChange={() => patchData({ publishingSchedule: "EVERGREEN", publishFrom: "", publishUntil: "" }, "publishingSchedule")} onBlur={() => void validateOnExit("publishingSchedule")} /> <span>Evergreen</span></label>
              <label className="cw-radio"><input type="radio" checked={data.publishingSchedule === "SCHEDULED"} onChange={() => patchData({ publishingSchedule: "SCHEDULED" }, "publishingSchedule")} onBlur={() => void validateOnExit("publishingSchedule")} /> <span>Scheduled</span></label>
            </div>
            {data.publishingSchedule === "SCHEDULED" ? (
              <div className="cw-date-row">
                <label className="cw-date-field"><span>Start date</span><input type="date" className="cw-input cw-input--sm" value={data.publishFrom} onChange={(e) => patchData({ publishFrom: e.target.value }, "publishFrom")} onBlur={() => void validateOnExit("publishFrom")} /></label>
                <label className="cw-date-field"><span>End date</span><input type="date" className="cw-input cw-input--sm" value={data.publishUntil} onChange={(e) => patchData({ publishUntil: e.target.value }, "publishUntil")} onBlur={() => void validateOnExit("publishUntil")} /></label>
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
          <select className="cw-input cw-select" value={data.visibility} onChange={(e) => patchData({ visibility: e.target.value as CampaignVisibility }, "visibility")} onBlur={() => void validateOnExit("visibility")}>
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
            {ARCHETYPE_OPTIONS.map(([id, label]) => {
              const selected = data.archetypes.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  className={`cw-format-chip ${selected ? "is-active" : ""}`}
                  onClick={() => patchData({ archetypes: selected ? data.archetypes.filter((value) => value !== id) : data.archetypes.length < 5 ? [...data.archetypes, id] : data.archetypes }, "archetypes")}
                  onBlur={() => void validateOnExit("archetypes")}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="cw-hint">Select 1–5 canonical Creator Shop archetypes.</p>
        </WizardField>

        <WizardField label="Minimum Followers" required error={getFieldError(errors, "minimumFollowers")}>
          <input type="number" min={0} className="cw-input" value={data.minimumFollowers} onChange={(e) => patchData({ minimumFollowers: Math.max(0, Number(e.target.value) || 0) }, "minimumFollowers")} onBlur={() => void validateOnExit("minimumFollowers")} />
        </WizardField>
        <WizardField label="Maximum Followers" error={getFieldError(errors, "maximumFollowers")}>
          <input type="number" min={0} className="cw-input" value={data.maximumFollowers ?? ""} placeholder="No maximum" onChange={(e) => patchData({ maximumFollowers: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) }, "maximumFollowers")} onBlur={() => void validateOnExit("maximumFollowers")} />
        </WizardField>

        <WizardField label="Audience Age — Min" required error={getFieldError(errors, "audienceAgeMin")}>
          <input type="number" min={13} max={65} className="cw-input" value={data.audienceAgeMin} onChange={(e) => patchData({ audienceAgeMin: Number(e.target.value) }, "audienceAgeMin")} onBlur={() => void validateOnExit("audienceAgeMin")} />
        </WizardField>
        <WizardField label="Audience Age — Max" required error={getFieldError(errors, "audienceAgeMax")}>
          <input type="number" min={13} max={65} className="cw-input" value={data.audienceAgeMax} onChange={(e) => patchData({ audienceAgeMax: Number(e.target.value) }, "audienceAgeMax")} onBlur={() => void validateOnExit("audienceAgeMax")} />
        </WizardField>

        <WizardField label="Audience Gender" required error={getFieldError(errors, "audienceGender")}>
          <select className="cw-input cw-select" value={data.audienceGender} onChange={(e) => patchData({ audienceGender: e.target.value as WizardData["audienceGender"] }, "audienceGender")} onBlur={() => void validateOnExit("audienceGender")}>
            <option value="ALL">All</option><option value="FEMALE">Female</option><option value="MALE">Male</option>
          </select>
        </WizardField>

        <WizardField label="Audience Affinities" className="cw-field--full" error={getFieldError(errors, "affinityIds")}>
          <AudienceAffinityPicker
            value={data.affinityIds}
            onChange={(value) => patchData({ affinityIds: value }, "affinityIds")}
            onBlur={() => void validateOnExit("affinityIds")}
          />
          <p className="cw-hint">Optional. Search by canonical label or alias; only canonical IDs are saved.</p>
        </WizardField>

        <WizardField label="Audience Geography" required className="cw-field--full" error={getFieldError(errors, "audienceGeographies")}>
          <AudienceGeographyPicker
            value={data.audienceGeographies}
            onChange={(value) => patchData({ audienceGeographies: value }, "audienceGeographies")}
            onBlur={() => void validateOnExit("audienceGeographies")}
          />
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
            <label className="cw-radio"><input type="radio" checked={!data.receivesBrandSupport} onChange={() => patchData({ receivesBrandSupport: false, brandSupportType: null, brandSupportEstimatedValue: null }, "receivesBrandSupport")} onBlur={() => void validateOnExit("receivesBrandSupport")} /> <span>No non-cash Brand support</span></label>
            <label className="cw-radio"><input type="radio" checked={data.receivesBrandSupport} onChange={() => patchData({ receivesBrandSupport: true }, "receivesBrandSupport")} onBlur={() => void validateOnExit("receivesBrandSupport")} /> <span>Brand provides support</span></label>
          </div>
        </WizardField>

        {data.receivesBrandSupport ? <>
          <WizardField label="Support Type" required error={getFieldError(errors, "brandSupportType")}>
            <select className="cw-input cw-select" value={data.brandSupportType ?? ""} onChange={(e) => patchData({ brandSupportType: (e.target.value || null) as BrandSupportType | null }, "brandSupportType")} onBlur={() => void validateOnExit("brandSupportType")}>
              <option value="">Select support</option>{BRAND_SUPPORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </WizardField>
          <WizardField label="Estimated Support Value" error={getFieldError(errors, "brandSupportEstimatedValue")}>
            <input type="number" min={0} className="cw-input" value={data.brandSupportEstimatedValue ?? ""} placeholder="Optional" onChange={(e) => patchData({ brandSupportEstimatedValue: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) }, "brandSupportEstimatedValue")} onBlur={() => void validateOnExit("brandSupportEstimatedValue")} />
          </WizardField>
        </> : null}

        <WizardField label="Compensation Model" required error={getFieldError(errors, "compensationModel")}>
          <select className="cw-input cw-select" value={data.compensationModel} onChange={(e) => patchData({ compensationModel: e.target.value as CompensationModel }, "compensationModel")} onBlur={() => void validateOnExit("compensationModel")}>
            <option value="FIXED">Fixed</option><option value="NEGOTIABLE">Negotiable</option>
          </select>
        </WizardField>
        <WizardField label={data.compensationModel === "NEGOTIABLE" ? "Payout Starting From" : "Commercial Offer"} required error={getFieldError(errors, "commercialOffer")}>
          <input type="number" min={0} className="cw-input" value={data.commercialOffer} onChange={(e) => patchData({ commercialOffer: Math.max(0, Number(e.target.value) || 0) }, "commercialOffer")} onBlur={() => void validateOnExit("commercialOffer")} />
        </WizardField>

        <WizardField label="Total Campaign Budget" required error={getFieldError(errors, "totalCampaignBudget")}>
          <input type="number" min={0} className="cw-input" value={data.totalCampaignBudget} onChange={(e) => patchData({ totalCampaignBudget: Math.max(0, Number(e.target.value) || 0) }, "totalCampaignBudget")} onBlur={() => void validateOnExit("totalCampaignBudget")} />
        </WizardField>
        <WizardField label="Advance Payment" required error={getFieldError(errors, "advancePaymentPercentage")}>
          <select className="cw-input cw-select" value={data.advancePaymentPercentage} onChange={(e) => patchData({ advancePaymentPercentage: Number(e.target.value) as AdvancePaymentPercentage }, "advancePaymentPercentage")} onBlur={() => void validateOnExit("advancePaymentPercentage")}>
            {ADVANCE_OPTIONS.map((value) => <option key={value} value={value}>{value}%</option>)}
          </select>
        </WizardField>

        <WizardField label="Payment Terms" required error={getFieldError(errors, "payoutTerms")}>
          <select className="cw-input cw-select" value={data.payoutTerms} onChange={(e) => patchData({ payoutTerms: e.target.value as PayoutTerms }, "payoutTerms")} onBlur={() => void validateOnExit("payoutTerms")}>
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
  validateOnExit: (field: WizardFieldKey) => Promise<void>;
};

function WizardField({ label, error, required, className, children }: { label: string; error?: string; required?: boolean; className?: string; children: ReactNode }) {
  return <div className={`cw-field ${error ? "cw-field--error" : ""} ${className ?? ""}`}><span className="cw-label">{label}{required ? <span className="cw-required">Required</span> : null}</span>{children}{error ? <p className="cw-field-error" role="alert">{error}</p> : null}</div>;
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return <div className="cw-ledger-row"><span>{label}</span><strong>{value}</strong></div>;
}
