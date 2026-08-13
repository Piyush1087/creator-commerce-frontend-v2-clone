import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  autosaveCanonicalCampaignField,
  BrandUceWizardValidationError,
  createCanonicalCampaignDraft,
  fetchCanonicalCampaignDraft,
  publishCanonicalCampaignDraft,
} from "../api/brand-uce-client";
import {
  mapWizardToIntegratedPayload,
  mapWizardToStep1Payload,
  mapWizardToStep2Payload,
  mapWizardToStep3Payload,
} from "../mappers/map-wizard-to-payload";
import { hydrateCanonicalCampaignDraft } from "../mappers/hydrate-canonical-campaign-draft";
import { buildCampaignDetailPath } from "../utils/uce-format";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Cloud,
  Eye,
  Info,
  Users,
  X,
} from "lucide-react";
import { Alert } from "../../../design-system/aurora";
import { Button } from "../../../design-system/aurora/components/Button";
import { AUTH_ROUTES } from "../../auth/constants";
import type {
  WizardData,
  WizardFieldErrors,
  WizardFieldKey,
} from "../types/campaign-wizard";
import {
  getFieldError,
  validateCampaignWizardStep,
  firstWizardErrorStep,
  firstWizardFieldError,
  flattenIssuesToFieldErrors,
  validateFullCampaignWizard,
  validateCampaignWizardField,
} from "../utils/validate-campaign-wizard";
import "./CreateCampaignWizard.css";
import "../uce-responsive.css";
import { AgeRangeSlider } from "./AgeRangeSlider";
import { CanonicalGeographyPicker } from "./CanonicalGeographyPicker";

const OBJECTIVES = [
  { value: "PULSE", label: "Brand Awareness" },
  { value: "PROOF", label: "Traffic & Clicks" },
  { value: "PRODUCTION", label: "Content Production" },
  { value: "PUSH", label: "Sales & Conversions" },
] as const;
const INDUSTRIES = [
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "beauty", label: "Beauty & Cosmetics" },
  { value: "tech", label: "Tech & Consumer Electronics" },
  { value: "fitness", label: "Health & Fitness" },
  { value: "food", label: "Food & Beverage" },
];
const ARCHETYPE_OPTIONS = [
  { value: "AESTHETIC_MINIMALIST", label: "Aesthetic" },
  { value: "ENTERTAINER", label: "Comedy" },
  { value: "INDUSTRY_EXPERT", label: "Tech" },
  { value: "EDUCATOR", label: "Educational" },
  { value: "LIFESTYLE_INTEGRATOR", label: "Lifestyle" },
  { value: "COACH", label: "Fitness" },
  { value: "PRODUCT_REVIEWER", label: "Beauty" },
] as const;
const PAYOUT_OPTIONS = ["NET_7", "NET_15", "NET_30", "NET_45", "NET_60"] as const;

const STEP_LABELS = [
  "Core Strategy",
  "Creator Targeting",
  "Commercial Terms",
] as const;

type LedgerSection = "strategy" | "targeting" | "commercials";

const LEDGER_SECTION_STEP: Record<LedgerSection, number> = {
  strategy: 1,
  targeting: 2,
  commercials: 3,
};

const INITIAL_DATA: WizardData = {
  campaignName: "",
  coreObjective: "",
  publishingSchedule: "SCHEDULED",
  publishFrom: "",
  publishUntil: "",
  platforms: ["INSTAGRAM"],
  platformFormats: ["Reel"],
  campaignVisibility: "PUBLIC",
  creatorArchetypes: [],
  minimumFollowers: 10_000,
  maximumFollowers: 250_000,
  audienceAffinityIds: [],
  audienceGeographies: [],
  audienceAgeMin: 18,
  audienceAgeMax: 34,
  audienceGender: "FEMALE",
  receivesBrandSupport: false,
  brandSupportType: null,
  brandSupportEstimatedValue: null,
  compensationModel: "FIXED",
  commercialOffer: 0,
  totalCampaignBudget: 0,
  advancePaymentPercentage: 25,
  payoutTerms: "NET_7",
};

const PLATFORM_CONFIG = [
  {
    key: "instagram" as const,
    label: "Instagram",
    formats: ["Reel", "Story", "Static Post"],
  },
];

export function CreateCampaignWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [archetypeInput, setArchetypeInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<WizardFieldKey>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const pendingAutosaveRef = useRef<Set<WizardFieldKey>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        const existingId = new URLSearchParams(window.location.search).get("draft");
        const created = existingId ? null : await createCanonicalCampaignDraft();
        const draft = await fetchCanonicalCampaignDraft(existingId ?? created!.campaignId);
        if (cancelled) return;
        setDraftId(draft.campaignId);
        if (!existingId) {
          const url = new URL(window.location.href);
          url.searchParams.set("draft", draft.campaignId);
          window.history.replaceState({}, "", url);
        }
        setData((current) => hydrateCanonicalCampaignDraft(draft, current));
      } catch (error) {
        if (!cancelled) setDraftError(error instanceof Error ? error.message : "Could not initialize draft.");
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, []);

  const saveSection = async (section: "strategy" | "targeting" | "commercials") => {
    if (!draftId) throw new Error("Campaign draft is still initializing.");
    const values = section === "strategy"
      ? mapWizardToStep1Payload(data)
      : section === "targeting"
        ? mapWizardToStep2Payload(data)
        : mapWizardToStep3Payload(data);
    for (const [field, value] of Object.entries(values)) {
      // Platforms are validated at publish; the backend draft patch contract does
      // not expose a strategy.platforms field path.
      if (section === "strategy" && field === "platforms") continue;
      await autosaveCanonicalCampaignField(draftId, `${section}.${field}`, value);
    }
  };

  const autosaveFields = async (fields: WizardFieldKey[], state: WizardData) => {
    if (!draftId) return;
    const paths: Partial<Record<WizardFieldKey, ["strategy" | "targeting" | "commercials", string]>> = {
      campaignName: ["strategy", "campaign_name"], coreObjective: ["strategy", "core_objective"], publishingSchedule: ["strategy", "publishing_schedule"],
      publishFrom: ["strategy", "publish_from"], publishUntil: ["strategy", "publish_until"], campaignVisibility: ["strategy", "campaign_visibility"],
      creatorArchetypes: ["targeting", "creator_archetypes"], minimumFollowers: ["targeting", "minimum_followers"], maximumFollowers: ["targeting", "maximum_followers"],
      audienceAgeMin: ["targeting", "audience_age_min"], audienceAgeMax: ["targeting", "audience_age_max"], audienceGender: ["targeting", "audience_gender"],
      audienceAffinityIds: ["targeting", "audience_affinity_ids"], audienceGeographies: ["targeting", "audience_geographies"],
      receivesBrandSupport: ["commercials", "receives_brand_support"], brandSupportType: ["commercials", "brand_support_type"], brandSupportEstimatedValue: ["commercials", "brand_support_estimated_value"],
      compensationModel: ["commercials", "compensation_model"], commercialOffer: ["commercials", "commercial_offer"], totalCampaignBudget: ["commercials", "total_campaign_budget"],
      advancePaymentPercentage: ["commercials", "advance_payment_percentage"], payoutTerms: ["commercials", "payout_terms"],
    };
    const payload = mapWizardToIntegratedPayload(state);
    for (const key of fields) {
      const target = paths[key];
      if (!target || validateCampaignWizardField(key, state)) continue;
      const [section, field] = target;
      await autosaveCanonicalCampaignField(draftId, `${section}.${field}`, payload[section][field as keyof typeof payload[typeof section]]);
      pendingAutosaveRef.current.delete(key);
    }
  };

  useEffect(() => {
    if (!draftId || pendingAutosaveRef.current.size === 0) return;
    const timer = window.setTimeout(() => {
      void autosaveFields([...pendingAutosaveRef.current], data)
        .then(() => setDraftError(null))
        .catch((error: unknown) => setDraftError(error instanceof Error ? error.message : "Could not autosave Campaign draft."));
    }, 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, draftId]);

  const clearFieldError = (key: WizardFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (formError) setFormError(null);
  };

  const patchData = (patch: Partial<WizardData>, touched?: WizardFieldKey) => {
    if (touched) pendingAutosaveRef.current.add(touched);
    setData((prev) => {
      const next = { ...prev, ...patch };
      if (touched && touchedFields.has(touched)) {
        const message = validateCampaignWizardField(touched, next);
        setFieldErrors((errors) => ({ ...errors, [touched]: message }));
      }
      const dependent: Partial<Record<WizardFieldKey, WizardFieldKey>> = {
        publishFrom: "publishUntil", publishUntil: "publishFrom",
        commercialOffer: "totalCampaignBudget", totalCampaignBudget: "commercialOffer",
        minimumFollowers: "maximumFollowers", maximumFollowers: "minimumFollowers",
      };
      const other = touched ? dependent[touched] : undefined;
      if (other && touchedFields.has(other)) {
        setFieldErrors((errors) => ({ ...errors, [other]: validateCampaignWizardField(other, next) }));
      }
      return next;
    });
  };

  const cancelAndExit = async () => {
    if (draftId && pendingAutosaveRef.current.size) {
      try { await autosaveFields([...pendingAutosaveRef.current], data); }
      catch (error) { setDraftError(error instanceof Error ? error.message : "Could not save Campaign draft."); return; }
    }
    navigate(AUTH_ROUTES.brandUceCampaigns);
  };

  const touchField = (key: WizardFieldKey) => {
    setTouchedFields((current) => new Set(current).add(key));
    const message = validateCampaignWizardField(key, data);
    setFieldErrors((errors) => ({ ...errors, [key]: message }));
  };

  const prevStep = () => {
    setFieldErrors({});
    setFormError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const applyValidationFailure = (
    fieldErrors: WizardFieldErrors,
    formError: string,
  ) => {
    setFieldErrors(fieldErrors);
    setFormError(formError);
    const errorStep = firstWizardErrorStep(fieldErrors);
    if (errorStep !== null && errorStep !== step) {
      setStep(errorStep);
    }
  };

  const handleContinue = async () => {
    if (step < 3) {
      const result = validateCampaignWizardStep(step as 1 | 2 | 3, data);
      if (!result.success) {
        applyValidationFailure(result.fieldErrors, result.formError);
        return;
      }
      setFieldErrors({});
      setFormError(null);
      try {
        await saveSection(step === 1 ? "strategy" : "targeting");
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Could not autosave campaign draft.");
        return;
      }
      setStep((s) => s + 1);
      return;
    }

    const result = validateFullCampaignWizard(data);
    if (!result.success) {
      applyValidationFailure(result.fieldErrors, result.formError);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setIsPublishing(true);
    try {
      if (!draftId) throw new Error("Campaign draft is still initializing.");
      await saveSection("commercials");
      const shell = await publishCanonicalCampaignDraft(
        draftId,
        mapWizardToIntegratedPayload(data),
      );
      navigate(buildCampaignDetailPath(shell.campaign_id));
    } catch (err) {
      if (err instanceof BrandUceWizardValidationError) {
        const fieldErrors = flattenIssuesToFieldErrors(err.issues);
        applyValidationFailure(
          fieldErrors,
          firstWizardFieldError(fieldErrors, err.message),
        );
        return;
      }
      setFormError(
        err instanceof Error ? err.message : "Could not create campaign.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const industryLabel = INDUSTRIES.find((i) =>
    data.audienceAffinityIds.includes(i.value.toUpperCase()),
  )?.label ?? "Not specified";

  const timelineLabel =
    data.publishingSchedule === "SCHEDULED"
      ? data.publishFrom && data.publishUntil
        ? `${data.publishFrom} – ${data.publishUntil}`
        : "Fixed Date Range"
      : "Evergreen";

  const enabledPlatforms = useMemo(
    () =>
      PLATFORM_CONFIG.map((p) => ({
        label: p.label,
        formats: data.platformFormats,
      })),
    [data.platformFormats],
  );

  return (
    <div className="create-wizard">
      <div className="create-wizard-workspace">
        <section className="create-wizard-form">
          <div className="create-wizard-form-inner">
            {formError || draftError ? (
              <div className="create-wizard-form-alert">
                <Alert tone="error" title="Check required fields">
                  {formError ?? draftError}
                </Alert>
              </div>
            ) : null}
            {step === 1 && (
              <Step1Strategy
                data={data}
                patchData={patchData}
                errors={fieldErrors}
                clearFieldError={clearFieldError}
                touchField={touchField}
              />
            )}
            {step === 2 && (
              <Step2Targeting
                data={data}
                patchData={patchData}
                errors={fieldErrors}
                clearFieldError={clearFieldError}
                archetypeInput={archetypeInput}
                setArchetypeInput={setArchetypeInput}
                touchField={touchField}
              />
            )}
            {step === 3 && (
              <Step3Commercials
                data={data}
                patchData={patchData}
                errors={fieldErrors}
                touchField={touchField}
              />
            )}
          </div>
        </section>

        <ContextLedger
          step={step}
          data={data}
          industryLabel={industryLabel}
          timelineLabel={timelineLabel}
          enabledPlatforms={enabledPlatforms}
        />
      </div>

      <footer className="create-wizard-footer">
        <div className="create-wizard-footer-hint">
          <Info size={18} className="text-primary" />
          <span>
            Step {step} of 3: {STEP_LABELS[step - 1]}
          </span>
        </div>
        <div className="create-wizard-footer-actions">
          <Button
            variant="ghost"
            onClick={() => void cancelAndExit()}
          >
            Cancel &amp; Exit
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft size={18} />
              Back to Previous Step
            </Button>
          )}
          <Button variant="primary" onClick={() => void handleContinue()} disabled={isPublishing || !draftId}>
            {step === 3 ? (
              isPublishing ? "Creating campaign…" : "Save & Publish Campaign"
            ) : (
              <>
                {step === 1 ? "Next Step: Creator Targeting" : "Next Step: Commercial Terms"}
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function WizardField({
  label,
  error,
  className,
  required,
  children,
}: {
  label?: string;
  error?: string;
  className?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`cw-field ${error ? "cw-field--error" : ""} ${className ?? ""}`}>
      {label ? (
        <span className="cw-label">
          {label}
          {required ? <span className="cw-required">Required</span> : null}
        </span>
      ) : null}
      {children}
      {error ? (
        <p className="cw-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Step1Strategy({
  data,
  patchData,
  errors,
  touchField,
}: {
  data: WizardData;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  errors: WizardFieldErrors;
  clearFieldError: (key: WizardFieldKey) => void;
  touchField: (key: WizardFieldKey) => void;
}) {
  const today = new Date().toLocaleDateString("en-CA");
  const toggleFormat = (format: string) => patchData({
    platformFormats: data.platformFormats.includes(format)
      ? data.platformFormats.filter((value) => value !== format)
      : [...data.platformFormats, format],
  }, "platforms");

  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Campaign Strategy</h1>
        <p>
          Establish the core metadata, timeline, and primary objectives for your
          activation.
        </p>
      </header>

      <div className="create-wizard-fields">
        <WizardField label="Campaign Name" error={getFieldError(errors, "campaignName")}>
          <input
            type="text"
            className="cw-input"
            placeholder="e.g., Summer Launch 2026"
            value={data.campaignName}
            onChange={(e) => patchData({ campaignName: e.target.value }, "campaignName")}
            onBlur={() => touchField("campaignName")}
          />
        </WizardField>

        <WizardField label="Core Objective" error={getFieldError(errors, "coreObjective")}>
          <select
            className="cw-input cw-select"
            value={data.coreObjective}
            onChange={(e) => patchData({ coreObjective: e.target.value as WizardData["coreObjective"] }, "coreObjective")}
            onBlur={() => touchField("coreObjective")}
          >
            <option value="">Select an objective</option>
            {OBJECTIVES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </WizardField>

        <WizardField label="Timeline Structure">
          <div
            className={`cw-timeline-panel ${getFieldError(errors, "publishFrom") || getFieldError(errors, "publishUntil") ? "cw-field--error-inline" : ""}`}
          >
            <div className="cw-radio-row">
              <label className="cw-radio">
                <input
                  type="radio"
                  name="timeline"
                  checked={data.publishingSchedule === "SCHEDULED"}
                  onChange={() => patchData({ publishingSchedule: "SCHEDULED" }, "publishingSchedule")}
                />
                <span>Fixed Date Range</span>
              </label>
              <label className="cw-radio">
                <input
                  type="radio"
                  name="timeline"
                  checked={data.publishingSchedule === "EVERGREEN"}
                  onChange={() => patchData({ publishingSchedule: "EVERGREEN", publishFrom: "", publishUntil: "" }, "publishingSchedule")}
                />
                <span>Evergreen</span>
              </label>
            </div>
            {data.publishingSchedule === "SCHEDULED" ? (
              <div className="cw-date-row">
                <label className="cw-date-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    className="cw-input cw-input--sm"
                    min={today}
                    max={data.publishUntil || undefined}
                    value={data.publishFrom}
                    onChange={(e) => patchData({ publishFrom: e.target.value }, "publishFrom")}
                    onBlur={() => touchField("publishFrom")}
                  />
                  {getFieldError(errors, "publishFrom") ? (
                    <p className="cw-field-error" role="alert">
                      {getFieldError(errors, "publishFrom")}
                    </p>
                  ) : null}
                </label>
                <label className="cw-date-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    className="cw-input cw-input--sm"
                    min={data.publishFrom || today}
                    value={data.publishUntil}
                    onChange={(e) => patchData({ publishUntil: e.target.value }, "publishUntil")}
                    onBlur={() => touchField("publishUntil")}
                  />
                  {getFieldError(errors, "publishUntil") ? (
                    <p className="cw-field-error" role="alert">
                      {getFieldError(errors, "publishUntil")}
                    </p>
                  ) : null}
                </label>
              </div>
            ) : <p className="cw-hint">The Campaign remains available until its lifecycle is completed or archived.</p>}
          </div>
        </WizardField>

        <WizardField error={getFieldError(errors, "platforms")}>
          <span className="cw-label cw-label--section">Platform &amp; Format Matrix</span>
          <div className="cw-platform-matrix">
            {PLATFORM_CONFIG.map(({ key, label, formats }) => {
              return (
                <div key={key} className="cw-platform-block">
                  <label className="cw-platform-check">
                    <input
                      type="checkbox"
                      checked={data.platforms.includes("INSTAGRAM")}
                      disabled
                    />
                    <span>{label}</span>
                  </label>
                  {data.platforms.includes("INSTAGRAM") && (
                    <div className="cw-format-chips">
                      {formats.map((format) => (
                        <button
                          key={format}
                          type="button"
                          className={`cw-format-chip ${data.platformFormats.includes(format) ? "is-active" : ""}`}
                          onClick={() => toggleFormat(format)}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </WizardField>
      </div>
    </div>
  );
}

function Step2Targeting({
  data,
  patchData,
  errors,
  clearFieldError,
  archetypeInput,
  setArchetypeInput,
  touchField,
}: {
  data: WizardData;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  errors: WizardFieldErrors;
  clearFieldError: (key: WizardFieldKey) => void;
  archetypeInput: string;
  setArchetypeInput: (v: string) => void;
  touchField: (key: WizardFieldKey) => void;
}) {
  const addArchetype = () => {
    const typed = archetypeInput.trim();
    const value = ARCHETYPE_OPTIONS.find((option) => option.label.toLowerCase() === typed.toLowerCase() || option.value === typed)?.value;
    if (!value || data.creatorArchetypes.includes(value)) return;
    clearFieldError("creatorArchetypes");
    patchData({ creatorArchetypes: [...data.creatorArchetypes, value] }, "creatorArchetypes");
    setArchetypeInput("");
  };

  const removeArchetype = (value: string) => {
    clearFieldError("creatorArchetypes");
    patchData({ creatorArchetypes: data.creatorArchetypes.filter((a) => a !== value) }, "creatorArchetypes");
  };


  const patchAgeRange = (ageMin: number, ageMax: number) => {
    patchData({ audienceAgeMin: ageMin, audienceAgeMax: ageMax }, "audienceAgeMin");
    patchData({ audienceAgeMin: ageMin, audienceAgeMax: ageMax }, "audienceAgeMax");
    clearFieldError("audienceAgeMin");
    clearFieldError("audienceAgeMax");
  };

  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Creator Targeting</h1>
        <p>
          Define the exact persona, audience demographics, and geographic reach you
          need.
        </p>
      </header>

      <div className="create-wizard-fields create-wizard-fields--grid">
        <WizardField label="Industry Vertical" error={getFieldError(errors, "audienceAffinityIds")}>
          <select
            className="cw-input cw-select"
            value={data.audienceAffinityIds[0] ?? ""}
            onChange={(e) => patchData({ audienceAffinityIds: e.target.value ? [e.target.value] : [] }, "audienceAffinityIds")}
          >
            <option value="">Select your brand&apos;s core industry...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind.value} value={ind.value.toUpperCase()}>
                {ind.label}
              </option>
            ))}
          </select>
        </WizardField>

        <WizardField label="Follower Range" error={getFieldError(errors, "minimumFollowers") ?? getFieldError(errors, "maximumFollowers")}>
          <div className="cw-date-row">
            <input type="number" className="cw-input" min={0} aria-label="Minimum Followers" value={data.minimumFollowers} onChange={(e) => patchData({ minimumFollowers: Number(e.target.value) || 0 }, "minimumFollowers")} onBlur={() => touchField("minimumFollowers")} />
            <input type="number" className="cw-input" min={data.minimumFollowers} aria-label="Maximum Followers" placeholder="No maximum" value={data.maximumFollowers ?? ""} onChange={(e) => patchData({ maximumFollowers: e.target.value ? Number(e.target.value) : null }, "maximumFollowers")} onBlur={() => touchField("maximumFollowers")} />
          </div>
        </WizardField>

        <WizardField
          label="Creator Archetypes"
          error={getFieldError(errors, "creatorArchetypes")}
          className="cw-field--full"
        >
          <TokenInput
            tokens={data.creatorArchetypes}
            inputValue={archetypeInput}
            onInputChange={setArchetypeInput}
            onAdd={addArchetype}
            onRemove={removeArchetype}
            placeholder="Add archetype..."
          />
        </WizardField>

        <WizardField
          label="Target Locations"
          error={getFieldError(errors, "audienceGeographies")}
          className="cw-field--full"
        >
          <CanonicalGeographyPicker value={data.audienceGeographies} onChange={(audienceGeographies) => patchData({ audienceGeographies }, "audienceGeographies")} onBlur={() => touchField("audienceGeographies")} />
          <p className="cw-hint">Select a structured suggestion. Free text is not saved as geography authority.</p>
        </WizardField>

        <div className="cw-audience-panel cw-field--full">
          <h3>
            <Users size={20} />
            Target Audience
          </h3>
          <div className="cw-audience-grid">
            <WizardField
              label="Age Range"
              error={getFieldError(errors, "audienceAgeMin") ?? getFieldError(errors, "audienceAgeMax")}
            >
              <AgeRangeSlider
                min={data.audienceAgeMin}
                max={data.audienceAgeMax}
                onChange={patchAgeRange}
              />
            </WizardField>
            <WizardField label="Gender Focus" error={getFieldError(errors, "audienceGender")}>
              <div className="cw-segmented">
                {(["ALL", "FEMALE", "MALE"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={data.audienceGender === g ? "is-active" : ""}
                    onClick={() => patchData({ audienceGender: g }, "audienceGender")}
                  >
                    {g === "ALL" ? "All" : g === "FEMALE" ? "Female-Skewing" : "Male-Skewing"}
                  </button>
                ))}
              </div>
            </WizardField>
          </div>
        </div>

      </div>
    </div>
  );
}

function Step3Commercials({
  data,
  patchData,
  errors,
  touchField,
}: {
  data: WizardData;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  errors: WizardFieldErrors;
  touchField: (key: WizardFieldKey) => void;
}) {
  const escrowMin = Math.round(data.totalCampaignBudget * (data.advancePaymentPercentage / 100));
  const isFixed = data.compensationModel === "FIXED";

  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Commercial Terms</h1>
        <p>
          Set the baseline compensation limits, escrow advances, and payout
          structures.
        </p>
      </header>

      <div className="create-wizard-fields create-wizard-fields--grid">
        <WizardField label="Brand Provisioning / Support" className="cw-field--full">
          <div className="cw-segmented cw-segmented--wide">
            <button type="button" className={!data.receivesBrandSupport ? "is-active" : ""} onClick={() => patchData({ receivesBrandSupport: false, brandSupportType: null, brandSupportEstimatedValue: null }, "receivesBrandSupport")}>No support provided</button>
            <button type="button" className={data.receivesBrandSupport ? "is-active" : ""} onClick={() => patchData({ receivesBrandSupport: true, brandSupportType: data.brandSupportType ?? "PRODUCT" }, "receivesBrandSupport")}>Support provided</button>
          </div>
        </WizardField>
        {data.receivesBrandSupport ? <>
          <WizardField label="Support Type" error={getFieldError(errors, "brandSupportType")}>
            <select className="cw-input cw-select" value={data.brandSupportType ?? ""} onChange={(event) => patchData({ brandSupportType: event.target.value as WizardData["brandSupportType"] }, "brandSupportType")} onBlur={() => touchField("brandSupportType")}>
              <option value="">Select support</option>{["PRODUCT", "SERVICE", "EXPERIENCE", "ACCESS_SUBSCRIPTION", "OTHER"].map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
            </select>
          </WizardField>
          <WizardField label="Estimated Support Value" error={getFieldError(errors, "brandSupportEstimatedValue")}>
            <div className="cw-currency-wrap"><span>$</span><input type="number" className="cw-input" min={0} value={data.brandSupportEstimatedValue ?? ""} onChange={(event) => patchData({ brandSupportEstimatedValue: event.target.value ? Number(event.target.value) : null }, "brandSupportEstimatedValue")} onBlur={() => touchField("brandSupportEstimatedValue")} /></div>
          </WizardField>
        </> : null}
        <WizardField label="Compensation Type" className="cw-field--full">
          <div className="cw-segmented cw-segmented--wide">
            <button
              type="button"
              className={isFixed ? "is-active" : ""}
              onClick={() => patchData({ compensationModel: "FIXED" }, "compensationModel")}
            >
              Fixed Fee
            </button>
            <button
              type="button"
              className={!isFixed ? "is-active" : ""}
              onClick={() =>
                patchData({ compensationModel: "NEGOTIABLE" }, "compensationModel")
              }
            >
              Negotiable Offer
            </button>
          </div>
        </WizardField>

        {isFixed ? (
          <WizardField
            label="Flat Rate Per Creator"
            required
            error={getFieldError(errors, "commercialOffer")}
          >
            <div className="cw-currency-wrap">
              <span>$</span>
              <input
                type="number"
                className="cw-input"
                min={1}
                step="0.01"
                placeholder="0.00"
                value={data.commercialOffer || ""}
                onChange={(e) =>
                  patchData(
                    { commercialOffer: Number(e.target.value) || 0 },
                    "commercialOffer",
                  )
                }
                onBlur={() => touchField("commercialOffer")}
              />
            </div>
            <p className="cw-hint">
              Creators will see: &quot;Fixed Fee: $
              {data.commercialOffer.toLocaleString()}&quot;
            </p>
          </WizardField>
        ) : (
          <WizardField
              label="Payout Starting From"
              required
              error={getFieldError(errors, "commercialOffer")}
            >
              <div className="cw-currency-wrap">
                <span>$</span>
                <input
                  type="number"
                  className="cw-input"
                  min={1}
                  step="0.01"
                  placeholder="0.00"
                  value={data.commercialOffer || ""}
                  onChange={(e) =>
                    patchData(
                      { commercialOffer: Number(e.target.value) || 0 },
                      "commercialOffer",
                    )
                  }
                  onBlur={() => touchField("commercialOffer")}
                />
              </div>
            </WizardField>
        )}

        <WizardField error={getFieldError(errors, "totalCampaignBudget")} className="cw-field--full">
          <span className="cw-label cw-label--with-icon">
            Total Campaign Budget Pool
            <span className="cw-required">Required</span>
            <Info
              size={16}
              aria-label="Maximum total spend authorized for this campaign across all creators"
            />
          </span>
          <div className="cw-currency-wrap cw-currency-wrap--narrow">
            <span>$</span>
            <input
              type="number"
              className="cw-input"
              min={1}
              step="1"
              placeholder="0"
              value={data.totalCampaignBudget || ""}
              onChange={(e) =>
                patchData({ totalCampaignBudget: Number(e.target.value) || 0 }, "totalCampaignBudget")
              }
              onBlur={() => touchField("totalCampaignBudget")}
            />
          </div>
        </WizardField>

        <WizardField
          label="Advance Payment Percentage"
          error={getFieldError(errors, "advancePaymentPercentage")}
        >
          <div className="cw-advance-row">
            <div className="cw-percent-wrap">
              <input
                type="number"
                className="cw-input"
                min={0}
                step={25}
                max={100}
                value={data.advancePaymentPercentage}
                onChange={(e) =>
                  patchData(
                    {
                      advancePaymentPercentage: Math.min(100, Math.max(0, Math.round((Number(e.target.value) || 0) / 25) * 25)) as WizardData["advancePaymentPercentage"],
                    },
                    "advancePaymentPercentage",
                  )
                }
              />
              <span>%</span>
            </div>
            <div className="cw-advance-warning">
              <Info size={16} />
              <span>Canonical increments: 0%, 25%, 50%, 75%, or 100%</span>
            </div>
          </div>
          {data.totalCampaignBudget > 0 && (
            <p className="cw-hint">
              Escrow hold: ${escrowMin.toLocaleString()} ({data.advancePaymentPercentage}% of
              pool)
            </p>
          )}
        </WizardField>

        <WizardField
          label="Final Balance Due Date"
          error={getFieldError(errors, "payoutTerms")}
        >
          <select
            className="cw-input cw-select"
            value={data.payoutTerms}
            onChange={(e) => patchData({ payoutTerms: e.target.value as WizardData["payoutTerms"] }, "payoutTerms")}
          >
            {PAYOUT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace("_", " ")}
              </option>
            ))}
          </select>
        </WizardField>
      </div>
    </div>
  );
}

function TokenInput({
  tokens,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  tokens: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (token: string) => void;
  placeholder: string;
}) {
  return (
    <div className="cw-token-input">
      {tokens.map((token) => (
        <span key={token} className="cw-token">
          {token}
          <button type="button" onClick={() => onRemove(token)} aria-label={`Remove ${token}`}>
            <X size={14} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
      />
    </div>
  );
}

function ContextLedger({
  step,
  data,
  industryLabel,
  timelineLabel,
  enabledPlatforms,
}: {
  step: number;
  data: WizardData;
  industryLabel: string;
  timelineLabel: string;
  enabledPlatforms: { label: string; formats: string[] }[];
}) {
  const [expandedSections, setExpandedSections] = useState<Set<LedgerSection>>(
    () => new Set(["strategy"]),
  );

  useEffect(() => {
    const current: LedgerSection =
      step === 1 ? "strategy" : step === 2 ? "targeting" : "commercials";
    setExpandedSections(new Set([current]));
  }, [step]);

  const toggleSection = (section: LedgerSection) => {
    if (step < LEDGER_SECTION_STEP[section]) {
      return;
    }
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <aside className="create-wizard-ledger">
      <div className="create-wizard-ledger-head">
        <Eye size={20} className="text-primary" />
        <h2>Live Context Ledger</h2>
      </div>

      <div className="cw-ledger-accordions">
        <LedgerAccordion
          title="Strategy"
          isCurrentStep={step === 1}
          isExpanded={expandedSections.has("strategy")}
          isLocked={false}
          onToggle={() => toggleSection("strategy")}
        >
          <LedgerRow label="Name" value={data.campaignName || "Not specified"} />
          <LedgerRow label="Objective" value={OBJECTIVES.find((item) => item.value === data.coreObjective)?.label || "Not specified"} />
          <LedgerRow label="Timeline" value={timelineLabel} />
          <div className="cw-ledger-row">
            <span className="cw-ledger-key">Platform/Format</span>
            <div className="cw-ledger-tags">
              {enabledPlatforms.length === 0 ? (
                <span className="cw-ledger-tag">None selected</span>
              ) : (
                enabledPlatforms.map((p) => (
                  <span key={p.label}>
                    <span className="cw-ledger-tag cw-ledger-tag--primary">
                      {p.label}
                    </span>
                    {p.formats.map((f) => (
                      <span key={f} className="cw-ledger-tag">
                        {f}
                      </span>
                    ))}
                  </span>
                ))
              )}
            </div>
          </div>
        </LedgerAccordion>

        <LedgerAccordion
          title="Targeting"
          isCurrentStep={step === 2}
          isExpanded={expandedSections.has("targeting")}
          isLocked={step < 2}
          onToggle={() => toggleSection("targeting")}
        >
          <LedgerRow label="Vertical" value={industryLabel} />
          <LedgerRow
            label="Audience"
            value={`${data.audienceAgeMin} - ${data.audienceAgeMax} Years`}
          />
          <LedgerRow label="Gender" value={data.audienceGender} />
          <div className="cw-ledger-row">
            <span className="cw-ledger-key">Follower Tiers</span>
            <div className="cw-ledger-tags">
              <span className="cw-ledger-tag cw-ledger-tag--primary">{data.minimumFollowers.toLocaleString()}–{data.maximumFollowers?.toLocaleString() ?? "No max"}</span>
            </div>
          </div>
        </LedgerAccordion>

        <LedgerAccordion
          title="Commercials"
          isCurrentStep={step === 3}
          isExpanded={expandedSections.has("commercials")}
          isLocked={step < 3}
          onToggle={() => toggleSection("commercials")}
        >
          <LedgerRow
            label="Offer Type"
            value={
              data.compensationModel === "FIXED" ? "Fixed Fee" : "Negotiable Offer"
            }
          />
          <LedgerRow label="Advance" value={`${data.advancePaymentPercentage}% Upfront`} />
          <LedgerRow label="Terms" value={data.payoutTerms} />
        </LedgerAccordion>
      </div>

      <div className="create-wizard-ledger-foot">
        <div className="cw-ledger-saved">
          <Cloud size={14} />
          <span>Last auto-saved: just now</span>
        </div>
        <div className="cw-ledger-snapshot">
          <p>Campaign Snapshot</p>
          <div className="cw-ledger-snapshot-rows">
            <div>
              <span>Target Creators</span>
              <strong>24 Active Picks</strong>
            </div>
            <div>
              <span>Estimated Reach</span>
              <strong>2.4M - 4.1M</strong>
            </div>
            {data.totalCampaignBudget > 0 && (
              <div>
                <span>Budget Pool</span>
                <strong>${data.totalCampaignBudget.toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function LedgerAccordion({
  title,
  isCurrentStep,
  isExpanded,
  isLocked,
  onToggle,
  children,
}: {
  title: string;
  isCurrentStep: boolean;
  isExpanded: boolean;
  isLocked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "cw-ledger-accordion",
        isCurrentStep ? "is-current" : "",
        isExpanded ? "is-expanded" : "",
        isLocked ? "is-locked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="cw-ledger-accordion-trigger"
        onClick={onToggle}
        disabled={isLocked}
        aria-expanded={isExpanded}
        aria-current={isCurrentStep ? "step" : undefined}
      >
        <span>{title}</span>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      {isExpanded ? (
        <div className="cw-ledger-accordion-body">{children}</div>
      ) : null}
    </div>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="cw-ledger-row">
      <span className="cw-ledger-key">{label}:</span>
      <span className="cw-ledger-val">{value}</span>
    </div>
  );
}
