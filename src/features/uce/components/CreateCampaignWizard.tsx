import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  BrandUceWizardValidationError,
  createCampaignFromWizard,
} from "../api/brand-uce-client";
import { mapWizardToIntegratedPayload } from "../mappers/map-wizard-to-payload";
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
} from "../utils/validate-campaign-wizard";
import "./CreateCampaignWizard.css";
import "../uce-responsive.css";
import { AgeRangeSlider } from "./AgeRangeSlider";

const OBJECTIVES = ["Brand Awareness", "Traffic & Clicks", "Sales & Conversions"];
const INDUSTRIES = [
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "beauty", label: "Beauty & Cosmetics" },
  { value: "tech", label: "Tech & Consumer Electronics" },
  { value: "fitness", label: "Health & Fitness" },
  { value: "food", label: "Food & Beverage" },
];
const FOLLOWER_TIERS = [
  "Nano (1k-10k)",
  "Micro (10k-50k)",
  "Mid-Tier (50k-250k)",
  "Macro (250k+)",
];
const ARCHETYPE_OPTIONS = [
  "Aesthetic",
  "Comedy",
  "Tech",
  "Educational",
  "Lifestyle",
  "Fitness",
  "Beauty",
];
const PAYOUT_OPTIONS = [
  "Immediate (Upon Approval)",
  "Net 7",
  "Net 15",
  "Net 30",
];

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
  name: "",
  objective: "",
  timeline: "fixed",
  startDate: "",
  endDate: "",
  milestoneDays: "30",
  platforms: {
    instagram: { enabled: true, formats: ["Reel"] },
    tiktok: { enabled: false, formats: [] },
    youtube: { enabled: false, formats: [] },
  },
  industry: "",
  followerTiers: ["Micro (10k-50k)", "Mid-Tier (50k-250k)"],
  archetypes: ["Aesthetic", "Comedy"],
  targetLocations: ["United States", "United Kingdom"],
  disqualifyingKeywords: ["Gambling", "Controversial"],
  ageMin: 18,
  ageMax: 34,
  genderFocus: "Female-Skewing",
  compensationType: "fixed",
  flatRatePerCreator: 0,
  negotiableMinFee: 0,
  negotiableMaxFee: 0,
  budget: 0,
  advancePercent: 30,
  payoutTerms: "Immediate (Upon Approval)",
};

const PLATFORM_CONFIG = [
  {
    key: "instagram" as const,
    label: "Instagram",
    formats: ["Reel", "Story", "Static Post"],
  },
  {
    key: "tiktok" as const,
    label: "TikTok",
    formats: ["Video", "Story"],
  },
  {
    key: "youtube" as const,
    label: "YouTube",
    formats: ["Long-form Video", "Short"],
  },
];

export function CreateCampaignWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [archetypeInput, setArchetypeInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

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
    setData((prev) => ({ ...prev, ...patch }));
    if (touched) clearFieldError(touched);
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
      const shell = await createCampaignFromWizard(mapWizardToIntegratedPayload(data));
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

  const industryLabel =
    INDUSTRIES.find((i) => i.value === data.industry)?.label ?? "Not specified";

  const timelineLabel =
    data.timeline === "fixed"
      ? data.startDate && data.endDate
        ? `${data.startDate} – ${data.endDate}`
        : "Fixed Date Range"
      : `Milestone · ${data.milestoneDays} days`;

  const enabledPlatforms = useMemo(
    () =>
      PLATFORM_CONFIG.filter((p) => data.platforms[p.key].enabled).map((p) => ({
        label: p.label,
        formats: data.platforms[p.key].formats,
      })),
    [data.platforms],
  );

  return (
    <div className="create-wizard">
      <div className="create-wizard-workspace">
        <section className="create-wizard-form">
          <div className="create-wizard-form-inner">
            {formError ? (
              <div className="create-wizard-form-alert">
                <Alert tone="error" title="Check required fields">
                  {formError}
                </Alert>
              </div>
            ) : null}
            {step === 1 && (
              <Step1Strategy
                data={data}
                patchData={patchData}
                setData={setData}
                errors={fieldErrors}
                clearFieldError={clearFieldError}
              />
            )}
            {step === 2 && (
              <Step2Targeting
                data={data}
                patchData={patchData}
                setData={setData}
                errors={fieldErrors}
                clearFieldError={clearFieldError}
                archetypeInput={archetypeInput}
                setArchetypeInput={setArchetypeInput}
                keywordInput={keywordInput}
                setKeywordInput={setKeywordInput}
                locationInput={locationInput}
                setLocationInput={setLocationInput}
              />
            )}
            {step === 3 && (
              <Step3Commercials
                data={data}
                patchData={patchData}
                errors={fieldErrors}
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
            onClick={() => navigate(AUTH_ROUTES.brandUceCampaigns)}
          >
            Cancel &amp; Exit
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft size={18} />
              Back to Previous Step
            </Button>
          )}
          <Button variant="primary" onClick={() => void handleContinue()} disabled={isPublishing}>
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
  setData,
  patchData,
  errors,
  clearFieldError,
}: {
  data: WizardData;
  setData: Dispatch<SetStateAction<WizardData>>;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  errors: WizardFieldErrors;
  clearFieldError: (key: WizardFieldKey) => void;
}) {
  const togglePlatform = (key: keyof WizardData["platforms"], enabled: boolean) => {
    clearFieldError("platforms");
    setData((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [key]: {
          ...prev.platforms[key],
          enabled,
          formats: enabled && prev.platforms[key].formats.length === 0
            ? [PLATFORM_CONFIG.find((p) => p.key === key)!.formats[0]]
            : prev.platforms[key].formats,
        },
      },
    }));
  };

  const toggleFormat = (key: keyof WizardData["platforms"], format: string) => {
    clearFieldError("platforms");
    setData((prev) => {
      const current = prev.platforms[key].formats;
      const next = current.includes(format)
        ? current.filter((f) => f !== format)
        : [...current, format];
      return {
        ...prev,
        platforms: {
          ...prev.platforms,
          [key]: { ...prev.platforms[key], formats: next },
        },
      };
    });
  };

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
        <WizardField label="Campaign Name" error={getFieldError(errors, "name")}>
          <input
            type="text"
            className="cw-input"
            placeholder="e.g., Summer Launch 2026"
            value={data.name}
            onChange={(e) => patchData({ name: e.target.value }, "name")}
          />
        </WizardField>

        <WizardField label="Core Objective" error={getFieldError(errors, "objective")}>
          <select
            className="cw-input cw-select"
            value={data.objective}
            onChange={(e) => patchData({ objective: e.target.value }, "objective")}
          >
            <option value="">Select an objective</option>
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </WizardField>

        <WizardField label="Timeline Structure">
          <div
            className={`cw-timeline-panel ${getFieldError(errors, "startDate") || getFieldError(errors, "endDate") || getFieldError(errors, "milestoneDays") ? "cw-field--error-inline" : ""}`}
          >
            <div className="cw-radio-row">
              <label className="cw-radio">
                <input
                  type="radio"
                  name="timeline"
                  checked={data.timeline === "fixed"}
                  onChange={() => patchData({ timeline: "fixed" }, "startDate")}
                />
                <span>Fixed Date Range</span>
              </label>
              <label className="cw-radio">
                <input
                  type="radio"
                  name="timeline"
                  checked={data.timeline === "milestone"}
                  onChange={() => patchData({ timeline: "milestone" }, "milestoneDays")}
                />
                <span>Dynamic Milestone Track</span>
              </label>
            </div>
            {data.timeline === "fixed" ? (
              <div className="cw-date-row">
                <label className="cw-date-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    className="cw-input cw-input--sm"
                    value={data.startDate}
                    onChange={(e) => patchData({ startDate: e.target.value }, "startDate")}
                  />
                  {getFieldError(errors, "startDate") ? (
                    <p className="cw-field-error" role="alert">
                      {getFieldError(errors, "startDate")}
                    </p>
                  ) : null}
                </label>
                <label className="cw-date-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    className="cw-input cw-input--sm"
                    value={data.endDate}
                    onChange={(e) => patchData({ endDate: e.target.value }, "endDate")}
                  />
                  {getFieldError(errors, "endDate") ? (
                    <p className="cw-field-error" role="alert">
                      {getFieldError(errors, "endDate")}
                    </p>
                  ) : null}
                </label>
              </div>
            ) : (
              <label className="cw-date-field cw-date-field--narrow">
                <span>Days-to-Complete</span>
                <input
                  type="number"
                  className="cw-input cw-input--sm"
                  placeholder="30"
                  value={data.milestoneDays}
                  onChange={(e) =>
                    patchData({ milestoneDays: e.target.value }, "milestoneDays")
                  }
                />
                {getFieldError(errors, "milestoneDays") ? (
                  <p className="cw-field-error" role="alert">
                    {getFieldError(errors, "milestoneDays")}
                  </p>
                ) : null}
              </label>
            )}
          </div>
        </WizardField>

        <WizardField error={getFieldError(errors, "platforms")}>
          <span className="cw-label cw-label--section">Platform &amp; Format Matrix</span>
          <div className="cw-platform-matrix">
            {PLATFORM_CONFIG.map(({ key, label, formats }) => {
              const platform = data.platforms[key];
              return (
                <div key={key} className="cw-platform-block">
                  <label className="cw-platform-check">
                    <input
                      type="checkbox"
                      checked={platform.enabled}
                      onChange={(e) => togglePlatform(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                  {platform.enabled && (
                    <div className="cw-format-chips">
                      {formats.map((format) => (
                        <button
                          key={format}
                          type="button"
                          className={`cw-format-chip ${platform.formats.includes(format) ? "is-active" : ""}`}
                          onClick={() => toggleFormat(key, format)}
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
  setData,
  patchData,
  errors,
  clearFieldError,
  archetypeInput,
  setArchetypeInput,
  keywordInput,
  setKeywordInput,
  locationInput,
  setLocationInput,
}: {
  data: WizardData;
  setData: Dispatch<SetStateAction<WizardData>>;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  errors: WizardFieldErrors;
  clearFieldError: (key: WizardFieldKey) => void;
  archetypeInput: string;
  setArchetypeInput: (v: string) => void;
  keywordInput: string;
  setKeywordInput: (v: string) => void;
  locationInput: string;
  setLocationInput: (v: string) => void;
}) {
  const toggleTier = (tier: string) => {
    clearFieldError("followerTiers");
    setData((prev) => ({
      ...prev,
      followerTiers: prev.followerTiers.includes(tier)
        ? prev.followerTiers.filter((t) => t !== tier)
        : [...prev.followerTiers, tier],
    }));
  };

  const addArchetype = () => {
    const value = archetypeInput.trim();
    if (!value || data.archetypes.includes(value)) return;
    clearFieldError("archetypes");
    setData((prev) => ({ ...prev, archetypes: [...prev.archetypes, value] }));
    setArchetypeInput("");
  };

  const removeArchetype = (value: string) => {
    clearFieldError("archetypes");
    setData((prev) => ({
      ...prev,
      archetypes: prev.archetypes.filter((a) => a !== value),
    }));
  };

  const addLocation = () => {
    const value = locationInput.trim();
    if (!value || data.targetLocations.includes(value)) return;
    clearFieldError("targetLocations");
    setData((prev) => ({
      ...prev,
      targetLocations: [...prev.targetLocations, value],
    }));
    setLocationInput("");
  };

  const removeLocation = (value: string) => {
    clearFieldError("targetLocations");
    setData((prev) => ({
      ...prev,
      targetLocations: prev.targetLocations.filter((l) => l !== value),
    }));
  };

  const addKeyword = () => {
    const value = keywordInput.trim();
    if (!value || data.disqualifyingKeywords.includes(value)) return;
    setData((prev) => ({
      ...prev,
      disqualifyingKeywords: [...prev.disqualifyingKeywords, value],
    }));
    setKeywordInput("");
  };

  const removeKeyword = (value: string) => {
    setData((prev) => ({
      ...prev,
      disqualifyingKeywords: prev.disqualifyingKeywords.filter((k) => k !== value),
    }));
  };

  const patchAgeRange = (ageMin: number, ageMax: number) => {
    setData((prev) => ({ ...prev, ageMin, ageMax }));
    clearFieldError("ageMin");
    clearFieldError("ageMax");
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
        <WizardField label="Industry Vertical" error={getFieldError(errors, "industry")}>
          <select
            className="cw-input cw-select"
            value={data.industry}
            onChange={(e) => patchData({ industry: e.target.value }, "industry")}
          >
            <option value="">Select your brand&apos;s core industry...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </select>
        </WizardField>

        <WizardField label="Follower Tiers" error={getFieldError(errors, "followerTiers")}>
          <div className="cw-tier-chips">
            {FOLLOWER_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                className={`cw-tier-chip ${data.followerTiers.includes(tier) ? "is-active" : ""}`}
                onClick={() => toggleTier(tier)}
              >
                {tier}
              </button>
            ))}
          </div>
        </WizardField>

        <WizardField
          label="Creator Archetypes"
          error={getFieldError(errors, "archetypes")}
          className="cw-field--full"
        >
          <TokenInput
            tokens={data.archetypes}
            inputValue={archetypeInput}
            onInputChange={setArchetypeInput}
            onAdd={addArchetype}
            onRemove={removeArchetype}
            placeholder="Add archetype..."
          />
        </WizardField>

        <WizardField
          label="Target Locations"
          error={getFieldError(errors, "targetLocations")}
          className="cw-field--full"
        >
          <TokenInput
            tokens={data.targetLocations}
            inputValue={locationInput}
            onInputChange={setLocationInput}
            onAdd={addLocation}
            onRemove={removeLocation}
            placeholder="Add country or region..."
          />
          <p className="cw-hint">Press Enter to add a territory (e.g. United States).</p>
        </WizardField>

        <div className="cw-audience-panel cw-field--full">
          <h3>
            <Users size={20} />
            Target Audience
          </h3>
          <div className="cw-audience-grid">
            <WizardField
              label="Age Range"
              error={getFieldError(errors, "ageMin") ?? getFieldError(errors, "ageMax")}
            >
              <AgeRangeSlider
                min={data.ageMin}
                max={data.ageMax}
                onChange={patchAgeRange}
              />
            </WizardField>
            <WizardField label="Gender Focus" error={getFieldError(errors, "genderFocus")}>
              <div className="cw-segmented">
                {["All", "Female-Skewing", "Male-Skewing"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={data.genderFocus === g ? "is-active" : ""}
                    onClick={() => patchData({ genderFocus: g }, "genderFocus")}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </WizardField>
          </div>
        </div>

        <div className="cw-field cw-field--full">
          <span className="cw-label">Disqualifying Keywords</span>
          <TokenInput
            tokens={data.disqualifyingKeywords}
            inputValue={keywordInput}
            onInputChange={setKeywordInput}
            onAdd={addKeyword}
            onRemove={removeKeyword}
            placeholder="Add keyword to exclude..."
          />
          <p className="cw-hint">Press Enter to add a keyword token.</p>
        </div>
      </div>
    </div>
  );
}

function Step3Commercials({
  data,
  patchData,
  errors,
}: {
  data: WizardData;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  errors: WizardFieldErrors;
}) {
  const escrowMin = Math.round(data.budget * (data.advancePercent / 100));
  const isFixed = data.compensationType === "fixed";

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
        <WizardField label="Compensation Type" className="cw-field--full">
          <div className="cw-segmented cw-segmented--wide">
            <button
              type="button"
              className={isFixed ? "is-active" : ""}
              onClick={() => patchData({ compensationType: "fixed" }, "compensationType")}
            >
              Fixed Fee
            </button>
            <button
              type="button"
              className={!isFixed ? "is-active" : ""}
              onClick={() =>
                patchData({ compensationType: "negotiable" }, "compensationType")
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
            error={getFieldError(errors, "flatRatePerCreator")}
          >
            <div className="cw-currency-wrap">
              <span>$</span>
              <input
                type="number"
                className="cw-input"
                min={1}
                step="0.01"
                placeholder="0.00"
                value={data.flatRatePerCreator || ""}
                onChange={(e) =>
                  patchData(
                    { flatRatePerCreator: Number(e.target.value) || 0 },
                    "flatRatePerCreator",
                  )
                }
              />
            </div>
            <p className="cw-hint">
              Creators will see: &quot;Fixed Fee: $
              {data.flatRatePerCreator.toLocaleString()}&quot;
            </p>
          </WizardField>
        ) : (
          <>
            <WizardField
              label="Negotiable Minimum Fee"
              required
              error={getFieldError(errors, "negotiableMinFee")}
            >
              <div className="cw-currency-wrap">
                <span>$</span>
                <input
                  type="number"
                  className="cw-input"
                  min={1}
                  step="0.01"
                  placeholder="0.00"
                  value={data.negotiableMinFee || ""}
                  onChange={(e) =>
                    patchData(
                      { negotiableMinFee: Number(e.target.value) || 0 },
                      "negotiableMinFee",
                    )
                  }
                />
              </div>
            </WizardField>
            <WizardField
              label="Negotiable Maximum Fee"
              required
              error={getFieldError(errors, "negotiableMaxFee")}
            >
              <div className="cw-currency-wrap">
                <span>$</span>
                <input
                  type="number"
                  className="cw-input"
                  min={1}
                  step="0.01"
                  placeholder="0.00"
                  value={data.negotiableMaxFee || ""}
                  onChange={(e) =>
                    patchData(
                      { negotiableMaxFee: Number(e.target.value) || 0 },
                      "negotiableMaxFee",
                    )
                  }
                />
              </div>
            </WizardField>
          </>
        )}

        <WizardField error={getFieldError(errors, "budget")} className="cw-field--full">
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
              value={data.budget || ""}
              onChange={(e) =>
                patchData({ budget: Number(e.target.value) || 0 }, "budget")
              }
            />
          </div>
        </WizardField>

        <WizardField
          label="Advance Payment Percentage"
          error={getFieldError(errors, "advancePercent")}
        >
          <div className="cw-advance-row">
            <div className="cw-percent-wrap">
              <input
                type="number"
                className="cw-input"
                min={30}
                max={100}
                value={data.advancePercent}
                onChange={(e) =>
                  patchData(
                    {
                      advancePercent: Math.max(30, Number(e.target.value) || 30),
                    },
                    "advancePercent",
                  )
                }
              />
              <span>%</span>
            </div>
            <div className="cw-advance-warning">
              <Info size={16} />
              <span>30% minimum required</span>
            </div>
          </div>
          {data.budget > 0 && (
            <p className="cw-hint">
              Escrow hold: ${escrowMin.toLocaleString()} ({data.advancePercent}% of
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
            onChange={(e) => patchData({ payoutTerms: e.target.value }, "payoutTerms")}
          >
            {PAYOUT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
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
          <LedgerRow label="Name" value={data.name || "Not specified"} />
          <LedgerRow label="Objective" value={data.objective || "Not specified"} />
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
            value={`${data.ageMin} - ${data.ageMax} Years`}
          />
          <LedgerRow label="Gender" value={data.genderFocus} />
          <div className="cw-ledger-row">
            <span className="cw-ledger-key">Follower Tiers</span>
            <div className="cw-ledger-tags">
              {data.followerTiers.map((t) => (
                <span key={t} className="cw-ledger-tag cw-ledger-tag--primary">
                  {t.split(" ")[0]}
                </span>
              ))}
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
              data.compensationType === "fixed" ? "Fixed Fee" : "Negotiable Offer"
            }
          />
          <LedgerRow label="Advance" value={`${data.advancePercent}% Upfront`} />
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
            {data.budget > 0 && (
              <div>
                <span>Budget Pool</span>
                <strong>${data.budget.toLocaleString()}</strong>
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
