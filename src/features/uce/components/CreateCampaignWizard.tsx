import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../../design-system/aurora";

import { AUTH_ROUTES } from "../../auth/constants";
import {
  autosaveCanonicalCampaignField,
  createCanonicalCampaignDraft,
  fetchCanonicalCampaignDraft,
  fetchCanonicalCampaignReadiness,
  publishCanonicalCampaignDraft,
} from "../api/canonical-campaign-draft-client";
import { CanonicalCampaignAutosaveController } from "../autosave/canonical-campaign-autosave-controller";
import {
  canonicalDraftPatchForField,
  mergeCanonicalDraftIntoWizardData,
} from "../mappers/canonical-campaign-draft";
import { mapWizardToCanonicalPayload } from "../mappers/map-wizard-to-canonical-payload";
import { CanonicalCampaignReadinessController } from "../readiness/canonical-campaign-readiness-controller";
import type {
  AdvancePaymentPercentage,
  BrandSupportType,
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
import { CampaignStrategyStep } from "./campaign-strategy/CampaignStrategyStep";
import { campaignStrategyNavigationBlocked, campaignStrategySummary, CAMPAIGN_OBJECTIVES } from "./campaign-strategy/campaign-strategy-model";
import { CreatorStrategyStep } from "./creator-strategy/CreatorStrategyStep";
import { archetypeLabel, creatorStrategyCanContinue, creatorStrategySummary } from "./creator-strategy/creator-strategy-model";
import { CommercialStrategyStep } from "./commercial-strategy/CommercialStrategyStep";
import { commercialStrategyCanPublish, commercialStrategySummary } from "./commercial-strategy/commercial-strategy-model";
import {
  CampaignAutosaveStatus,
  CampaignInitialization,
  CampaignSummary,
  CampaignWizardActions,
  CampaignWizardFrame,
} from "./create-campaign-frame/CreateCampaignFrame";
import {
  CAMPAIGNS_ROUTE,
  getAutosavePresentation,
  retryFailedAutosaves,
  retryInitialization,
  shouldShowValidationSummary,
  validationScrollBehavior,
  type WizardInitializationState,
} from "./create-campaign-frame/create-campaign-frame-model";
import "./CreateCampaignWizard.css";
import "../uce-responsive.css";

const DRAFT_STORAGE_KEY = "creator-shop:campaign:create:draft-id";
const VISIBILITY: Array<{ value: CampaignVisibility; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "ELIGIBLE_CREATORS_ONLY", label: "Eligible creators only" },
  { value: "INVITE_ONLY", label: "Invite only" },
];

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
  const hydrated = useRef(false);
  const draftIdRef = useRef<string | null>(null);
  const autosaveRef = useRef<CanonicalCampaignAutosaveController<WizardData> | null>(null);
  const readinessRef = useRef<CanonicalCampaignReadinessController | null>(null);
  const [, setAutosaveVersion] = useState(0);
  const [, setReadinessVersion] = useState(0);
  // Retained during the transition so the legacy unreachable branch remains type-safe.
  const saveTimers = useRef<Partial<Record<WizardFieldKey, number>>>({});
  const revisions = useRef<Partial<Record<WizardFieldKey, number>>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [lastSavedData, setLastSavedData] = useState<WizardData>(INITIAL_DATA);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [initialization, setInitialization] = useState<WizardInitializationState>("loading");
  const [initializationAttempt, setInitializationAttempt] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [validationAttemptedStep, setValidationAttemptedStep] = useState<1 | 2 | 3 | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!readinessRef.current) {
    readinessRef.current = new CanonicalCampaignReadinessController(
      fetchCanonicalCampaignReadiness,
      () => setReadinessVersion((version) => version + 1),
    );
  }

  if (!autosaveRef.current) {
    autosaveRef.current = new CanonicalCampaignAutosaveController<WizardData>(
      async (field, snapshot) => {
        const canonicalPatch = canonicalDraftPatchForField(field as WizardFieldKey, snapshot);
        if (!draftIdRef.current || !canonicalPatch) return;
        await autosaveCanonicalCampaignField(draftIdRef.current, canonicalPatch.path, canonicalPatch.value);
      },
      350,
      () => setAutosaveVersion((version) => version + 1),
      (field, snapshot) => {
        if (field in snapshot) {
          setLastSavedData((previous) => ({ ...previous, [field]: snapshot[field as keyof WizardData] }));
        }
        if (field !== "objective" || !draftIdRef.current || !snapshot.objective) return;
        readinessRef.current?.objectiveAccepted(draftIdRef.current, snapshot.objective);
      },
    );
  }

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => () => {
    autosaveRef.current?.dispose();
    readinessRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    setInitialization("loading");
    hydrated.current = false;
    void (async () => {
      const storedId = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (storedId) {
        try {
          const existing = await fetchCanonicalCampaignDraft(storedId);
          const merged = mergeCanonicalDraftIntoWizardData(INITIAL_DATA, existing.draft);
          setData(merged);
          setLastSavedData(merged);
          setDraftId(existing.campaignId);
          draftIdRef.current = existing.campaignId;
          readinessRef.current?.hydrate(existing.campaignId, merged.objective || null);
          hydrated.current = true;
          setInitialization("ready");
          return;
        } catch {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }

      try {
        const created = await createCanonicalCampaignDraft();
        window.localStorage.setItem(DRAFT_STORAGE_KEY, created.campaignId);
        setDraftId(created.campaignId);
        setLastSavedData(INITIAL_DATA);
        draftIdRef.current = created.campaignId;
        readinessRef.current?.hydrate(created.campaignId, null);
        hydrated.current = true;
        setInitialization("ready");
      } catch {
        setInitialization("failed");
      }
    })();
  }, [initializationAttempt]);

  const scheduleSave = (field: WizardFieldKey, snapshot: WizardData) => {
    if (!hydrated.current || !draftId || !draftIdRef.current) return;
    const typed = ["name", "minimumFollowers", "maximumFollowers", "audienceAgeMin", "audienceAgeMax", "brandSupportEstimatedValue", "commercialOffer", "totalCampaignBudget"].includes(field);
    autosaveRef.current?.schedule(field, snapshot, !typed);
    return;
    /* Legacy implementation retained temporarily during migration.
    const revision = (revisions.current[field] ?? 0) + 1;
    revisions.current[field] = revision;
    const existing = saveTimers.current[field];
    if (existing) window.clearTimeout(existing);
    const delay = field === "name" || field === "minimumFollowers" || field === "maximumFollowers" || field === "audienceAgeMin" || field === "audienceAgeMax" || field === "brandSupportEstimatedValue" || field === "commercialOffer" || field === "totalCampaignBudget" ? 350 : 0;
    saveTimers.current[field] = window.setTimeout(() => {
      void (async () => {
        const canonicalPatch = canonicalDraftPatchForField(field, snapshot);
        if (!canonicalPatch) return;
        setDraftStatus("Saving…");
        try {
          await autosaveCanonicalCampaignField(draftId!, canonicalPatch.path, canonicalPatch.value);
          if (revisions.current[field] === revision) setDraftStatus("Draft saved");
        } catch {
          if (revisions.current[field] === revision) {
            setDraftStatus("Save failed");
            setFormError("Could not autosave Campaign draft. Retry the changed field.");
          }
        }
      })();
    }, delay); */
  };

  const patchData = (patch: Partial<WizardData>, touched?: WizardFieldKey) => {
    const supersede = (field: WizardFieldKey) => {
      revisions.current[field] = (revisions.current[field] ?? 0) + 1;
      const timer = saveTimers.current[field];
      if (timer) window.clearTimeout(timer);
    };
    if (patch.publishingSchedule === "EVERGREEN") {
      autosaveRef.current?.forget("publishFrom");
      autosaveRef.current?.forget("publishUntil");
      supersede("publishFrom");
      supersede("publishUntil");
    }
    if (patch.receivesBrandSupport === false) {
      autosaveRef.current?.forget("brandSupportType");
      autosaveRef.current?.forget("brandSupportEstimatedValue");
      supersede("brandSupportType");
      supersede("brandSupportEstimatedValue");
    }
    if (patch.objective !== undefined && draftIdRef.current) {
      readinessRef.current?.objectiveChanged(draftIdRef.current, patch.objective || null);
    }
    setData((prev) => {
      const next = { ...prev, ...patch };

if (touched) {
  const local = validateCampaignWizardStep(wizardStepForField(touched), next);

  if (local.success) {
    scheduleSave(touched, next);
  } else if (!local.fieldErrors[touched]) {
    scheduleSave(touched, next);
  }
}

return next;
    });
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

    // Changes are persisted by patchData; blur validates only and never issues a duplicate PATCH.
  };

  const saveCurrentStep = async () => {
    if (!draftId) throw new Error("Campaign draft is not ready yet.");
    const persisted = await autosaveRef.current?.flush(STEP_FIELDS[step]);
    if (!persisted) throw new Error("Could not save all changed Campaign fields. Retry the failed field before continuing.");
    return;
    /* Legacy full-step loop intentionally disabled: flush owns persistence.
    setDraftStatus("Saving…");
    for (const field of STEP_FIELDS[step]) {
      const patch = canonicalDraftPatchForField(field, data);
      if (patch) await autosaveCanonicalCampaignField(draftId!, patch!.path, patch!.value);
    }
    setDraftStatus("Draft saved"); */
  };

  const allAutosaveFields = [...STEP_FIELDS[1], ...STEP_FIELDS[2], ...STEP_FIELDS[3]];
  const autosaveStatuses = allAutosaveFields.map((field) => autosaveRef.current?.status(field) ?? "idle");
  const autosavePresentation = getAutosavePresentation(autosaveStatuses);
  const retryFailedSaves = () => retryFailedAutosaves(
    allAutosaveFields,
    (field) => autosaveRef.current?.status(field) ?? "idle",
    (field) => autosaveRef.current?.retry(field),
  );

  const applyValidationFailure = (errors: WizardFieldErrors, message: string) => {
    setFieldErrors(errors);
    setFormError(message);
    const errorStep = firstWizardErrorStep(errors);
    const targetStep = errorStep ?? step;
    setValidationAttemptedStep(targetStep);
    if (errorStep) setStep(errorStep);
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>(
        ".cw-field--error input, .cw-field--error select, .cw-field--error button, .cw-field--error [tabindex]",
      );
      firstInvalid?.focus();
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      firstInvalid?.scrollIntoView({ block: "center", behavior: validationScrollBehavior(prefersReducedMotion) });
    });
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
      setFormError(error instanceof Error ? error.message : "Could not save Campaign draft.");
      return;
    }

    if (step === 1 && !readinessRef.current?.canContinue(true)) {
      setFormError("Campaign KPI readiness must resolve before continuing.");
      return;
    }

    if (step === 3 && readinessRef.current?.state().status !== "ready") {
      setFormError("Campaign readiness must resolve before publishing.");
      return;
    }

    if (step < 3) {
      setFieldErrors({});
      setFormError(null);
      setValidationAttemptedStep(null);
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
    } catch {
      setFormError("We couldn't publish this Campaign. Your saved details are still here. Try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const objectiveLabel = useMemo(
    () => {
      const objective = CAMPAIGN_OBJECTIVES.find((item) => item.value === data.objective);
      return objective ? `${objective.name} — ${objective.outcome}` : "Not selected";
    },
    [data.objective],
  );
  const stepProps: StepProps = { data, patchData, errors: fieldErrors, validateOnExit };

  if (initialization !== "ready") {
    return <CampaignInitialization state={initialization} onRetry={() => retryInitialization(() => {
      initStarted.current = false;
      setInitializationAttempt((attempt) => attempt + 1);
    })} onBack={() => navigate(CAMPAIGNS_ROUTE)} />;
  }

  const summaryData = step === 1 ? STEP_FIELDS[1].reduce((snapshot, field) => {
    const status = autosaveRef.current?.status(field);
    if ((status === "dirty" || status === "saving" || status === "failed-retryable") && field in lastSavedData) {
      return { ...snapshot, [field]: lastSavedData[field as keyof WizardData] };
    }
    return snapshot;
  }, data) : data;
  const readinessState = readinessRef.current.state();
  const summaryRows = step === 1
    ? campaignStrategySummary(summaryData)
    : step === 2
      ? creatorStrategySummary(data)
      : readinessState.status === "ready"
        ? commercialStrategySummary(data, readinessState.currency)
        : null;
  const summary = (
    <CampaignSummary>
      <div className="create-wizard-ledger-body">
        {summaryRows ? summaryRows.map((row) => <LedgerRow key={row.label} label={row.label} value={row.value} />) : <>
          {data.name.trim() ? <LedgerRow label="Campaign" value={data.name.trim()} /> : null}
          {data.objective ? <LedgerRow label="Objective" value={objectiveLabel} /> : null}
          <LedgerRow label="Schedule" value={data.publishingSchedule === "EVERGREEN" ? "Evergreen" : "Scheduled"} />
          <LedgerRow label="Platform" value="Instagram" />
          <LedgerRow label="Visibility" value={VISIBILITY.find((item) => item.value === data.visibility)?.label ?? data.visibility} />
          {data.archetypes.length ? <LedgerRow label="Archetypes" value={data.archetypes.map(archetypeLabel).join(", ")} /> : null}
          {data.affinityIds.length ? <LedgerRow label="Affinities" value={`${data.affinityIds.length} selected`} /> : null}
          {data.audienceGeographies.length ? <LedgerRow label="Geography" value={data.audienceGeographies.map((item) => item.label).join(", ")} /> : null}
          {data.commercialOffer > 0 ? <LedgerRow label="Commercial offer" value={data.commercialOffer.toLocaleString()} /> : null}
          {data.totalCampaignBudget > 0 ? <LedgerRow label="Total budget" value={data.totalCampaignBudget.toLocaleString()} /> : null}
        </>}
      </div>
    </CampaignSummary>
  );

  const primaryBlocked = !draftId || (step === 1 && (
    !readinessRef.current?.canContinue(true) ||
    campaignStrategyNavigationBlocked(readinessRef.current.state(), autosavePresentation.state === "failed") ||
    (validationAttemptedStep === 1 && Object.keys(fieldErrors).length > 0)
  )) || (step === 2 && validationAttemptedStep === 2 && !creatorStrategyCanContinue(data)) || (step === 3 && (readinessState.status !== "ready" || isPublishing || validationAttemptedStep === 3 && !commercialStrategyCanPublish(data)));
  return (
    <CampaignWizardFrame
      step={step}
      autosave={<CampaignAutosaveStatus label={autosavePresentation.label} canRetry={autosavePresentation.canRetry} onRetry={retryFailedSaves} />}
      validationSummary={shouldShowValidationSummary(validationAttemptedStep, step)}
      summary={summary}
      actions={<CampaignWizardActions step={step} busy={isPublishing} blocked={primaryBlocked} onSecondary={() => {
        setFieldErrors({});
        setFormError(null);
        setValidationAttemptedStep(null);
        if (step === 1) navigate(AUTH_ROUTES.brandUceCampaigns);
        else setStep((step - 1) as 1 | 2 | 3);
      }} onPrimary={() => void handleContinue()} />}
    >
      {formError && validationAttemptedStep !== step ? <div className="create-wizard-form-alert"><Alert tone="error" title="Check Campaign details">{formError}</Alert></div> : null}
      {step === 1 ? <CampaignStrategyStep {...stepProps} readiness={readinessRef.current.state()} retryReadiness={() => readinessRef.current?.retry()} /> : null}
      {step === 2 ? <CreatorStep {...stepProps} /> : null}
      {step === 3 && readinessState.status === "ready" ? <CommercialStep {...stepProps} currency={readinessState.currency} /> : null}
    </CampaignWizardFrame>
  );
}

function CreatorStep({ data, patchData, errors, validateOnExit }: StepProps) {
  return <CreatorStrategyStep data={data} patchData={patchData} errors={errors} validateOnExit={validateOnExit} />;
  /* return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h2>Creator Strategy</h2>
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
  ); */
}

function CommercialStep({ data, patchData, errors, validateOnExit, currency }: StepProps & { currency: "INR" | "USD" }) {
  const useCommercialStrategyExperience: boolean = true;
  if (useCommercialStrategyExperience) return <CommercialStrategyStep data={data} currency={currency} patchData={patchData} errors={errors} validateOnExit={validateOnExit} />;
  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h2>Commercial Strategy</h2>
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
