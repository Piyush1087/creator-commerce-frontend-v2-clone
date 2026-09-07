import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Info,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "../../../design-system/aurora/components/Button";
import type {
  CreateCampaignBriefBody,
  CreateCampaignBriefDeliverable,
  CreateCampaignBriefGuidance,
  DeliverableFormatType,
  UceBriefStrategyMode,
} from "../contracts/brand-uce.contracts";
import { UCE_BRIEF_WIZARD_HEADER_EVENT } from "../../../layouts/app-shell/use-app-shell-breadcrumbs";
import { EMPTY_FIELD } from "../utils/display-field";
import "./CreateCampaignWizard.css";
import "../uce-responsive.css";
import "./BriefingWizardDrawer.css";

export type BriefWizardProductOption = {
  id: string;
  name: string;
  sku: string | null;
};

export type BriefWizardLogisticsDefaults = {
  deadlineDescriptor: string;
  fixedCalendarTargetDate: string;
  baseEscrowPayout: number;
  commissionPercent: number;
  samplesRequired: boolean;
};

type BriefingWizardDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName?: string;
  initialProductId?: string | null;
  campaignProducts: BriefWizardProductOption[];
  archetypeOptions?: string[];
  logisticsDefaults?: BriefWizardLogisticsDefaults;
  onSubmitBrief: (body: CreateCampaignBriefBody) => Promise<void>;
  isSubmitting?: boolean;
};

type DeliverableDraft = CreateCampaignBriefDeliverable & { id: string };

type CreatorLedDraft = NonNullable<
  CreateCampaignBriefGuidance["creator_led_details"]
>;

type StoryboardDraft = NonNullable<
  CreateCampaignBriefGuidance["brand_led_storyboard"]
>[number];

type FieldErrors = Record<string, string>;

const STEP_LABELS = [
  "Brief Strategy",
  "Content Guidance",
  "Timelines & Terms",
] as const;

const FORMAT_OPTIONS: Array<{ value: DeliverableFormatType; label: string }> = [
  { value: "REEL_VIDEO", label: "Reel / Video" },
  { value: "STORY", label: "Story" },
  { value: "PHOTOSHOOT", label: "Photoshoot" },
  { value: "CAROUSEL_BANNER", label: "Banner / Carousel" },
];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `deliv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultCreatorLed(theme: string): CreatorLedDraft {
  return {
    content_theme: theme || "Product storytelling",
    description:
      "Show the product in a natural routine, highlight key benefits, and close with a clear CTA.",
    hook_ideas: ["Quick before/after", "Morning routine reveal"],
    recommended_b_rolls: "Close-ups of product texture, application, lifestyle B-roll.",
    creator_dos: ["Natural light", "Product centered"],
    creator_donts: ["Competitor mentions"],
    audio_strategy: "DIRECT_VOICEOVER",
    lighting_requirements: "NATURAL_DAYLIGHT",
    background_setting: "Clean lifestyle space",
    tone_of_voice: "RELATABLE_CASUAL",
    post_caption: "Sharing my honest take — link in bio.",
    hashtags_and_mentions: ["#ad", "@brand"],
  };
}

function defaultStoryboard(): StoryboardDraft[] {
  return [
    {
      sequence_index_id: 0,
      segment_type: "HOOK_OPENER",
      visual_direction: "Open on product hero shot with bold text overlay.",
      audio_teleprompter_script: "If your skin needs a reset, start here.",
      target_screen_time_seconds: 3,
      reference_frame_asset_url: null,
    },
    {
      sequence_index_id: 1,
      segment_type: "ACTIVE_TECH_REVIEW",
      visual_direction: "Demonstrate application and texture close-up.",
      audio_teleprompter_script: "Two drops, press in, no sticky finish.",
      target_screen_time_seconds: 8,
      reference_frame_asset_url: null,
    },
    {
      sequence_index_id: 2,
      segment_type: "CONVERSION_CTA",
      visual_direction: "Hold product to camera and point to link in bio.",
      audio_teleprompter_script: "Shop it via my link in bio.",
      target_screen_time_seconds: 4,
      reference_frame_asset_url: null,
    },
  ];
}

function BriefField({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`bw-field${error ? " bw-field--error" : ""}`}>
      {label ? <label className="bw-label">{label}</label> : null}
      {children}
      {error ? (
        <p className="bw-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BriefingWizardDrawer({
  isOpen,
  onClose,
  campaignId,
  campaignName = "Campaign",
  initialProductId = null,
  campaignProducts,
  archetypeOptions = [],
  logisticsDefaults,
  onSubmitBrief,
  isSubmitting = false,
}: BriefingWizardDrawerProps) {
  const [step, setStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [briefName, setBriefName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [objective, setObjective] = useState("");
  const [archetype, setArchetype] = useState("");
  const [briefType, setBriefType] = useState<UceBriefStrategyMode>("CREATOR_LED");
  const [mandatoryRequirements, setMandatoryRequirements] = useState("");
  const [deliverables, setDeliverables] = useState<DeliverableDraft[]>([]);
  const [creatorGuidance, setCreatorGuidance] = useState<
    Record<string, CreatorLedDraft>
  >({});
  const [storyboards, setStoryboards] = useState<Record<string, StoryboardDraft[]>>(
    {},
  );
  const [deadlineDescriptor, setDeadlineDescriptor] = useState("Fixed campaign end date");
  const [fixedDate, setFixedDate] = useState("");
  const [samplesRequired, setSamplesRequired] = useState(true);
  const [basePayout, setBasePayout] = useState("0");
  const [commissionPercent, setCommissionPercent] = useState("0");
  const [bioDays, setBioDays] = useState("30");
  const [adsDays, setAdsDays] = useState("90");
  const [repostDays, setRepostDays] = useState("365");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const selectedProduct = campaignProducts.find((p) => p.id === selectedProductId);
  const archetypes =
    archetypeOptions.length > 0
      ? archetypeOptions
      : ["Aesthetic", "Educational", "Comedy"];

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedProductId(initialProductId ?? "");
    setBriefName("");
    setPurpose("");
    setObjective("");
    setArchetype(
      (archetypeOptions.length > 0 ? archetypeOptions : ["Aesthetic"])[0] ?? "",
    );
    setBriefType("CREATOR_LED");
    setMandatoryRequirements("Must disclose #ad and follow brand do-not-say list.");
    setDeliverables([]);
    setCreatorGuidance({});
    setStoryboards({});
    setDeadlineDescriptor(
      logisticsDefaults?.deadlineDescriptor ?? "Fixed campaign end date",
    );
    setFixedDate(
      logisticsDefaults?.fixedCalendarTargetDate ??
        new Date(Date.now() + 14 * 86400000).toISOString(),
    );
    setSamplesRequired(logisticsDefaults?.samplesRequired ?? true);
    setBasePayout(String(logisticsDefaults?.baseEscrowPayout ?? 0));
    setCommissionPercent(String(logisticsDefaults?.commissionPercent ?? 0));
    setBioDays("30");
    setAdsDays("90");
    setRepostDays("365");
    setSubmitError(null);
    setFieldErrors({});
    // Reset only when the overlay opens / parent product changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-gated reset
  }, [isOpen, initialProductId]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(UCE_BRIEF_WIZARD_HEADER_EVENT, {
        detail: { open: isOpen },
      }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent(UCE_BRIEF_WIZARD_HEADER_EVENT, {
          detail: { open: false },
        }),
      );
    };
  }, [isOpen]);

  const previewKpis = useMemo(() => ["Reach", "Impressions"], []);

  const validateStep1 = (): boolean => {
    const next: FieldErrors = {};
    if (!selectedProductId) {
      next.productId = "Select a parent product for this brief.";
    }
    if (briefName.trim().length < 2) {
      next.briefName = "Brief name needs at least 2 characters.";
    }
    if (purpose.trim().length < 5) {
      next.purpose = "Purpose needs at least 5 characters.";
    }
    if (objective.trim().length < 5) {
      next.objective = "Objective needs at least 5 characters.";
    }
    if (!archetype.trim()) {
      next.archetype = "Pick a target influencer archetype.";
    }
    if (mandatoryRequirements.trim().length < 1) {
      next.mandatory = "Mandatory creator requirements are required.";
    }
    if (deliverables.length < 1) {
      next.deliverables = "Add at least one content deliverable.";
    }
    for (const d of deliverables) {
      if (d.format_type === "REEL_VIDEO") {
        if (!d.video_aspect_ratio || !d.video_duration_range) {
          next[`deliverable:${d.id}`] =
            "Reel/Video needs aspect ratio and duration.";
        }
      }
      if (d.format_type === "PHOTOSHOOT" && !d.photoshoot_quantity_allocation) {
        next[`deliverable:${d.id}`] = "Photoshoot needs a quantity allocation.";
      }
      if (d.format_type === "CAROUSEL_BANNER") {
        if (!d.carousel_aspect_ratio || !d.carousel_max_slide_count) {
          next[`deliverable:${d.id}`] =
            "Carousel needs aspect ratio and slide count.";
        }
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const hydrateGuidanceForStep2 = () => {
    setCreatorGuidance((prev) => {
      const next = { ...prev };
      for (const d of deliverables) {
        if (!next[d.id]) {
          next[d.id] = defaultCreatorLed(briefName || selectedProduct?.name || "Theme");
        }
      }
      return next;
    });
    setStoryboards((prev) => {
      const next = { ...prev };
      for (const d of deliverables) {
        if (!next[d.id]) next[d.id] = defaultStoryboard();
      }
      return next;
    });
  };

  const validateStep2 = (): boolean => {
    const next: FieldErrors = {};
    for (const d of deliverables) {
      const label =
        FORMAT_OPTIONS.find((f) => f.value === d.format_type)?.label ??
        "deliverable";
      if (briefType === "CREATOR_LED" && !d.is_reel_amplification) {
        const g = creatorGuidance[d.id];
        if (
          !g ||
          !g.content_theme.trim() ||
          !g.description.trim() ||
          g.hook_ideas.length < 1 ||
          !g.recommended_b_rolls.trim() ||
          g.creator_dos.length < 1 ||
          g.creator_donts.length < 1 ||
          !g.background_setting.trim() ||
          !g.post_caption.trim()
        ) {
          next[`guidance:${d.id}`] = `Complete Creator-Led guidance for ${label}.`;
        }
      }
      if (briefType === "BRAND_LED") {
        const board = storyboards[d.id] ?? [];
        if (board.length < 1) {
          next[`guidance:${d.id}`] =
            "Brand-Led briefs require at least one storyboard scene.";
        }
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const scrollToFirstFieldError = () => {
    requestAnimationFrame(() => {
      document
        .querySelector(".uce-brief-wizard .bw-field-error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleAdvance = () => {
    if (step === 1) {
      if (!validateStep1()) {
        scrollToFirstFieldError();
        return;
      }
      hydrateGuidanceForStep2();
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) {
        scrollToFirstFieldError();
        return;
      }
      setStep(3);
    }
  };

  const handleFinalize = async () => {
    setSubmitError(null);
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    const inventory = deliverables.map(
      ({ id, ...rest }): CreateCampaignBriefDeliverable => {
        if (!id) {
          throw new Error("deliverable draft is missing a client id");
        }
        return rest;
      },
    );
    const matrix: CreateCampaignBriefGuidance[] = deliverables.map((d) => {
      const base: CreateCampaignBriefGuidance = {
        deliverable_id: d.id,
        format_type: d.format_type,
        is_reel_amplification: Boolean(d.is_reel_amplification),
      };
      if (briefType === "CREATOR_LED" && !d.is_reel_amplification) {
        base.creator_led_details = creatorGuidance[d.id];
      }
      if (briefType === "BRAND_LED") {
        base.brand_led_storyboard = storyboards[d.id] ?? defaultStoryboard();
      }
      if (d.format_type === "STORY" && d.is_reel_amplification) {
        base.creator_led_details = creatorGuidance[d.id];
      }
      return base;
    });

    const body: CreateCampaignBriefBody = {
      campaign_id: campaignId,
      product_id: selectedProductId,
      brief_name: briefName.trim(),
      purpose: purpose.trim(),
      objective: objective.trim(),
      target_influencer_archetype: archetype.trim(),
      brief_type: briefType,
      mandatory_creator_requirements: mandatoryRequirements.trim(),
      deliverables_inventory: inventory,
      content_guidance_matrix: matrix,
      parent_planner_logistics_snapshot: {
        campaign_fulfillment_deadline_descriptor: deadlineDescriptor.trim(),
        fixed_calendar_target_date: new Date(fixedDate).toISOString(),
        is_physical_product_gifting_required: samplesRequired,
        base_escrow_compensation_payout_float: Number(basePayout) || 0,
        commission_incentive_percentage_float: Number(commissionPercent) || 0,
        link_in_bio_duration_days: Number.parseInt(bioDays, 10) || 0,
        paid_ads_boosting_whitelist_duration_days: Number.parseInt(adsDays, 10) || 0,
        organic_reposting_license_duration_days: Number.parseInt(repostDays, 10) || 0,
      },
    };

    try {
      await onSubmitBrief(body);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create brief.");
    }
  };

  const addDeliverable = () => {
    clearFieldError("deliverables");
    setDeliverables((prev) => [
      ...prev,
      {
        id: newId(),
        format_type: "REEL_VIDEO",
        video_aspect_ratio: "9_16_VERTICAL",
        video_duration_range: "15_45S",
        is_reel_amplification: false,
      },
    ]);
  };

  const updateDeliverable = (id: string, patch: Partial<DeliverableDraft>) => {
    clearFieldError(`deliverable:${id}`);
    clearFieldError("deliverables");
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  };

  if (!isOpen) return null;

  return (
    <div className="uce-brief-wizard create-wizard">
      <div className="create-wizard-workspace">
        <section className="create-wizard-form">
          <div className="create-wizard-form-inner">
            {submitError ? (
              <div className="create-wizard-form-alert">
                <p className="bw-field-error" role="alert">
                  {submitError}
                </p>
              </div>
            ) : null}

            <BriefField
              label="Parent Product Portfolio"
              error={fieldErrors.productId}
            >
              <select
                className="bw-select"
                value={selectedProductId}
                onChange={(e) => {
                  clearFieldError("productId");
                  setSelectedProductId(e.target.value);
                }}
              >
                <option value="">Select product to attach this brief…</option>
                {campaignProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` (${product.sku})` : ""}
                  </option>
                ))}
              </select>
            </BriefField>

            <div style={{ height: 32 }} />

            {step === 1 ? (
              <Step1
                briefName={briefName}
                setBriefName={(v) => {
                  clearFieldError("briefName");
                  setBriefName(v);
                }}
                purpose={purpose}
                setPurpose={(v) => {
                  clearFieldError("purpose");
                  setPurpose(v);
                }}
                objective={objective}
                setObjective={(v) => {
                  clearFieldError("objective");
                  setObjective(v);
                }}
                archetype={archetype}
                setArchetype={(v) => {
                  clearFieldError("archetype");
                  setArchetype(v);
                }}
                archetypes={archetypes}
                briefType={briefType}
                setBriefType={setBriefType}
                mandatoryRequirements={mandatoryRequirements}
                setMandatoryRequirements={(v) => {
                  clearFieldError("mandatory");
                  setMandatoryRequirements(v);
                }}
                deliverables={deliverables}
                addDeliverable={addDeliverable}
                updateDeliverable={updateDeliverable}
                removeDeliverable={(id) => {
                  clearFieldError("deliverables");
                  setDeliverables((prev) => prev.filter((d) => d.id !== id));
                }}
                fieldErrors={fieldErrors}
              />
            ) : null}

            {step === 2 ? (
              <Step2
                briefType={briefType}
                deliverables={deliverables}
                creatorGuidance={creatorGuidance}
                setCreatorGuidance={setCreatorGuidance}
                storyboards={storyboards}
                setStoryboards={setStoryboards}
                fieldErrors={fieldErrors}
                clearFieldError={clearFieldError}
              />
            ) : null}

            {step === 3 ? (
              <Step3
                deadlineDescriptor={deadlineDescriptor}
                setDeadlineDescriptor={setDeadlineDescriptor}
                fixedDate={fixedDate}
                setFixedDate={setFixedDate}
                samplesRequired={samplesRequired}
                setSamplesRequired={setSamplesRequired}
                basePayout={basePayout}
                setBasePayout={setBasePayout}
                commissionPercent={commissionPercent}
                setCommissionPercent={setCommissionPercent}
                bioDays={bioDays}
                setBioDays={setBioDays}
                adsDays={adsDays}
                setAdsDays={setAdsDays}
                repostDays={repostDays}
                setRepostDays={setRepostDays}
                briefType={briefType}
                deliverables={deliverables}
                creatorGuidance={creatorGuidance}
              />
            ) : null}
          </div>
        </section>

        <aside className="create-wizard-ledger">
          <div className="create-wizard-ledger-head">
            <BarChart2 size={14} />
            <h2>Live context ledger</h2>
          </div>
          <div className="bw-ledger-card">
            <div className="bw-ledger-meta">
              <p>Campaign name</p>
              <strong>{campaignName}</strong>
            </div>
            <div className="bw-ledger-meta">
              <p>Brief type</p>
              <strong>
                {briefType === "CREATOR_LED" ? "Creator-Led" : "Brand-Led"}
              </strong>
            </div>
            <div className="bw-ledger-meta">
              <p>KPI focus</p>
              <div className="bw-kpi-row">
                {previewKpis.map((kpi) => (
                  <span key={kpi} className="bw-kpi">
                    {kpi}
                  </span>
                ))}
              </div>
            </div>
            <div className="bw-ledger-meta">
              <p>Linked product</p>
              {selectedProduct ? (
                <div className="bw-product-link">
                  <div className="bw-product-icon">
                    <Package size={16} />
                  </div>
                  <div>
                    <strong style={{ display: "block" }}>
                      {selectedProduct.name}
                    </strong>
                    <span className="bw-product-sku">
                      SKU: {selectedProduct.sku || EMPTY_FIELD}
                    </span>
                  </div>
                </div>
              ) : (
                <strong>Select a parent product</strong>
              )}
            </div>
          </div>
          <div className="create-wizard-ledger-foot">
            <div className="cw-ledger-saved">
              <Info size={14} />
              Draft stays local until you finalize.
            </div>
          </div>
        </aside>
      </div>

      <footer className="create-wizard-footer">
        <div className="create-wizard-footer-hint">
          <Info size={18} className="text-primary" />
          <span>
            Step {step} of 3: {STEP_LABELS[step - 1]}
          </span>
        </div>
        <div className="create-wizard-footer-actions">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel &amp; Exit
          </Button>
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => {
                setFieldErrors({});
                setStep((s) => s - 1);
              }}
            >
              <ArrowLeft size={18} />
              Back to Previous Step
            </Button>
          ) : null}
          {step < 3 ? (
            <Button variant="primary" onClick={handleAdvance}>
              {step === 1
                ? "Next Step: Content Guidance"
                : "Next Step: Timelines & Terms"}
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={() => void handleFinalize()}
            >
              {isSubmitting ? "Saving…" : "Finalize & Dispatch Brief"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}


function Step1({
  briefName,
  setBriefName,
  purpose,
  setPurpose,
  objective,
  setObjective,
  archetype,
  setArchetype,
  archetypes,
  briefType,
  setBriefType,
  mandatoryRequirements,
  setMandatoryRequirements,
  deliverables,
  addDeliverable,
  updateDeliverable,
  removeDeliverable,
  fieldErrors,
}: {
  briefName: string;
  setBriefName: (v: string) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  objective: string;
  setObjective: (v: string) => void;
  archetype: string;
  setArchetype: (v: string) => void;
  archetypes: string[];
  briefType: UceBriefStrategyMode;
  setBriefType: (v: UceBriefStrategyMode) => void;
  mandatoryRequirements: string;
  setMandatoryRequirements: (v: string) => void;
  deliverables: DeliverableDraft[];
  addDeliverable: () => void;
  updateDeliverable: (id: string, patch: Partial<DeliverableDraft>) => void;
  removeDeliverable: (id: string) => void;
  fieldErrors: FieldErrors;
}) {
  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Brief Strategy</h1>
        <p>Set the tone of the deliverables before detailing them out.</p>
      </header>

      <div className="create-wizard-fields">
        <BriefField label="Brief Name" error={fieldErrors.briefName}>
          <input
            className="bw-input"
            value={briefName}
            onChange={(e) => setBriefName(e.target.value)}
            placeholder="e.g. Summer Skin Routine — 30s Reel"
          />
        </BriefField>

        <div className="bw-grid-2">
          <BriefField label="Purpose" error={fieldErrors.purpose}>
            <input
              className="bw-input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., To establish brand credibility…"
            />
          </BriefField>
          <BriefField label="Objective" error={fieldErrors.objective}>
            <input
              className="bw-input"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g., Establish product as the Professional’s Choice…"
            />
          </BriefField>
        </div>

        <BriefField
          label="Target Influencer Archetype"
         
          error={fieldErrors.archetype}
        >
          <select
            className="bw-select"
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
          >
            {archetypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </BriefField>

        <BriefField label="Brief Type">
          <div className="bw-type-row">
            <button
              type="button"
              className={`bw-type-card${briefType === "CREATOR_LED" ? " is-selected" : ""}`}
              onClick={() => setBriefType("CREATOR_LED")}
            >
              <input type="radio" checked={briefType === "CREATOR_LED"} readOnly />
              <div>
                <strong>Creator-Led (Recommended)</strong>
                <span>Maximize authenticity and reach</span>
              </div>
            </button>
            <button
              type="button"
              className={`bw-type-card${briefType === "BRAND_LED" ? " is-selected" : ""}`}
              onClick={() => setBriefType("BRAND_LED")}
            >
              <input type="radio" checked={briefType === "BRAND_LED"} readOnly />
              <div>
                <strong>Brand-Led</strong>
                <span>Strict adherence to scripted content</span>
              </div>
            </button>
          </div>
        </BriefField>

        <div>
          <div className="bw-section-head">
            <div>
              <h2>1. Content Deliverables</h2>
              <p>Specify the exact format and requirements for creator outputs.</p>
            </div>
            <Button variant="primary" onClick={addDeliverable}>
              <Plus size={16} />
              Add Deliverable
            </Button>
          </div>
          <BriefField error={fieldErrors.deliverables}>
            <div className="bw-deliverables">
              {deliverables.length === 0 ? (
                <div className="bw-empty">No deliverables added yet.</div>
              ) : (
                deliverables.map((d, index) => (
                  <div key={d.id} className="bw-deliverable">
                    <div className="bw-deliverable-top">
                      <strong style={{ fontSize: 13 }}>
                        Deliverable {index + 1}
                      </strong>
                      <button
                        type="button"
                        className="bw-icon-btn"
                        onClick={() => removeDeliverable(d.id)}
                        aria-label="Remove deliverable"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <BriefField
                      label="Format"
                      error={fieldErrors[`deliverable:${d.id}`]}
                    >
                      <select
                        className="bw-select"
                        value={d.format_type}
                        onChange={(e) => {
                          const format = e.target.value as DeliverableFormatType;
                          const patch: Partial<DeliverableDraft> = {
                            format_type: format,
                            is_reel_amplification: false,
                          };
                          if (format === "REEL_VIDEO") {
                            patch.video_aspect_ratio = "9_16_VERTICAL";
                            patch.video_duration_range = "15_45S";
                          }
                          if (format === "PHOTOSHOOT") {
                            patch.photoshoot_quantity_allocation = 5;
                          }
                          if (format === "CAROUSEL_BANNER") {
                            patch.carousel_aspect_ratio = "4_5_PORTRAIT";
                            patch.carousel_max_slide_count = 5;
                          }
                          updateDeliverable(d.id, patch);
                        }}
                      >
                        {FORMAT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </BriefField>

                    {d.format_type === "REEL_VIDEO" ? (
                      <div className="bw-grid-2">
                        <ChipGroup
                          label="Dimension"
                          value={d.video_aspect_ratio ?? ""}
                          options={[
                            { value: "9_16_VERTICAL", label: "9:16" },
                            { value: "4_5_PORTRAIT", label: "4:5" },
                          ]}
                          onChange={(value) =>
                            updateDeliverable(d.id, {
                              video_aspect_ratio:
                                value as DeliverableDraft["video_aspect_ratio"],
                            })
                          }
                        />
                        <ChipGroup
                          label="Duration"
                          value={d.video_duration_range ?? ""}
                          options={[
                            { value: "UNDER_15S", label: "<15s" },
                            { value: "15_45S", label: "15-45s" },
                            { value: "OVER_45S", label: ">45s" },
                          ]}
                          onChange={(value) =>
                            updateDeliverable(d.id, {
                              video_duration_range:
                                value as DeliverableDraft["video_duration_range"],
                            })
                          }
                        />
                      </div>
                    ) : null}

                    {d.format_type === "STORY" ? (
                      <ChipGroup
                        label="Story intent"
                        value={d.is_reel_amplification ? "amplify" : "custom"}
                        options={[
                          { value: "amplify", label: "Amplify the Reel" },
                          { value: "custom", label: "Custom Content" },
                        ]}
                        onChange={(value) =>
                          updateDeliverable(d.id, {
                            is_reel_amplification: value === "amplify",
                          })
                        }
                      />
                    ) : null}

                    {d.format_type === "PHOTOSHOOT" ? (
                      <BriefField label="Quantity allocation">
                        <input
                          className="bw-input"
                          type="number"
                          min={1}
                          value={d.photoshoot_quantity_allocation ?? 1}
                          onChange={(e) =>
                            updateDeliverable(d.id, {
                              photoshoot_quantity_allocation:
                                Number.parseInt(e.target.value, 10) || 1,
                            })
                          }
                        />
                      </BriefField>
                    ) : null}

                    {d.format_type === "CAROUSEL_BANNER" ? (
                      <div className="bw-grid-2">
                        <ChipGroup
                          label="Dimensions"
                          value={d.carousel_aspect_ratio ?? ""}
                          options={[
                            { value: "4_5_PORTRAIT", label: "4:5" },
                            { value: "1_1_SQUARE", label: "1:1" },
                          ]}
                          onChange={(value) =>
                            updateDeliverable(d.id, {
                              carousel_aspect_ratio:
                                value as DeliverableDraft["carousel_aspect_ratio"],
                            })
                          }
                        />
                        <BriefField label="Max slides">
                          <input
                            className="bw-input"
                            type="number"
                            min={1}
                            max={10}
                            value={d.carousel_max_slide_count ?? 5}
                            onChange={(e) =>
                              updateDeliverable(d.id, {
                                carousel_max_slide_count:
                                  Number.parseInt(e.target.value, 10) || 1,
                              })
                            }
                          />
                        </BriefField>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </BriefField>
        </div>

        <BriefField
          label="Mandatory Creator Requirements"
         
          error={fieldErrors.mandatory}
        >
          <textarea
            className="bw-textarea"
            value={mandatoryRequirements}
            onChange={(e) => setMandatoryRequirements(e.target.value)}
            placeholder='e.g., "Must visit the clinic…"'
          />
        </BriefField>
      </div>
    </div>
  );
}

function Step2({
  briefType,
  deliverables,
  creatorGuidance,
  setCreatorGuidance,
  storyboards,
  setStoryboards,
  fieldErrors,
  clearFieldError,
}: {
  briefType: UceBriefStrategyMode;
  deliverables: DeliverableDraft[];
  creatorGuidance: Record<string, CreatorLedDraft>;
  setCreatorGuidance: Dispatch<SetStateAction<Record<string, CreatorLedDraft>>>;
  storyboards: Record<string, StoryboardDraft[]>;
  setStoryboards: Dispatch<SetStateAction<Record<string, StoryboardDraft[]>>>;
  fieldErrors: FieldErrors;
  clearFieldError: (key: string) => void;
}) {
  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Content Guidance</h1>
        <p>
          Define precise operational guardrails and creative hooks for each
          deliverable asset.
        </p>
      </header>

      <div className="create-wizard-fields">
        {deliverables.map((d, index) => {
          const label =
            FORMAT_OPTIONS.find((f) => f.value === d.format_type)?.label ??
            d.format_type;
          const guidance = creatorGuidance[d.id] ?? defaultCreatorLed(label);
          const board = storyboards[d.id] ?? defaultStoryboard();
          const guidanceKey = `guidance:${d.id}`;

          const patchGuidance = (patch: Partial<CreatorLedDraft>) => {
            clearFieldError(guidanceKey);
            setCreatorGuidance((prev) => ({
              ...prev,
              [d.id]: { ...guidance, ...patch },
            }));
          };

          return (
            <section key={d.id} className="bw-deliverable">
              <strong style={{ fontSize: 14 }}>
                Deliverable {index + 1}: {label}
              </strong>
              {fieldErrors[guidanceKey] ? (
                <p className="bw-field-error" role="alert">
                  {fieldErrors[guidanceKey]}
                </p>
              ) : null}

              {briefType === "BRAND_LED" ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {board.map((scene, sceneIndex) => (
                    <div key={`${d.id}-${scene.sequence_index_id}`} className="bw-storyboard">
                      <BriefField label={`Scene ${sceneIndex + 1} type`}>
                        <select
                          className="bw-select"
                          value={scene.segment_type}
                          onChange={(e) => {
                            clearFieldError(guidanceKey);
                            const segment_type = e.target
                              .value as StoryboardDraft["segment_type"];
                            setStoryboards((prev) => ({
                              ...prev,
                              [d.id]: board.map((s, i) =>
                                i === sceneIndex ? { ...s, segment_type } : s,
                              ),
                            }));
                          }}
                        >
                          <option value="HOOK_OPENER">Hook opener</option>
                          <option value="PROBLEM_PITCH">Problem pitch</option>
                          <option value="ACTIVE_TECH_REVIEW">Active tech review</option>
                          <option value="CONVERSION_CTA">Conversion CTA</option>
                        </select>
                      </BriefField>
                      <BriefField label="Visual direction">
                        <textarea
                          className="bw-textarea"
                          value={scene.visual_direction}
                          onChange={(e) => {
                            clearFieldError(guidanceKey);
                            setStoryboards((prev) => ({
                              ...prev,
                              [d.id]: board.map((s, i) =>
                                i === sceneIndex
                                  ? { ...s, visual_direction: e.target.value }
                                  : s,
                              ),
                            }));
                          }}
                        />
                      </BriefField>
                      <BriefField label="Teleprompter script">
                        <textarea
                          className="bw-textarea"
                          value={scene.audio_teleprompter_script}
                          onChange={(e) => {
                            clearFieldError(guidanceKey);
                            setStoryboards((prev) => ({
                              ...prev,
                              [d.id]: board.map((s, i) =>
                                i === sceneIndex
                                  ? {
                                      ...s,
                                      audio_teleprompter_script: e.target.value,
                                    }
                                  : s,
                              ),
                            }));
                          }}
                        />
                      </BriefField>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="bw-grid-2">
                    <BriefField label="Content theme">
                      <input
                        className="bw-input"
                        value={guidance.content_theme}
                        onChange={(e) =>
                          patchGuidance({ content_theme: e.target.value })
                        }
                      />
                    </BriefField>
                    <BriefField label="Tone of voice">
                      <select
                        className="bw-select"
                        value={guidance.tone_of_voice}
                        onChange={(e) =>
                          patchGuidance({
                            tone_of_voice: e.target
                              .value as CreatorLedDraft["tone_of_voice"],
                          })
                        }
                      >
                        <option value="RELATABLE_CASUAL">Relatable casual</option>
                        <option value="HIGH_ENERGY">High energy</option>
                        <option value="AUTHORITATIVE_EXPERT">Authoritative expert</option>
                        <option value="CALMING_ASMR">Calming ASMR</option>
                      </select>
                    </BriefField>
                  </div>
                  <BriefField label="Description">
                    <textarea
                      className="bw-textarea"
                      value={guidance.description}
                      onChange={(e) =>
                        patchGuidance({ description: e.target.value })
                      }
                    />
                  </BriefField>
                  <TagEditor
                    label="Hook ideas"
                    values={guidance.hook_ideas}
                    onChange={(hook_ideas) => patchGuidance({ hook_ideas })}
                  />
                  <TagEditor
                    label="Creator do's"
                    values={guidance.creator_dos}
                    onChange={(creator_dos) => patchGuidance({ creator_dos })}
                  />
                  <TagEditor
                    label="Creator don'ts"
                    values={guidance.creator_donts}
                    onChange={(creator_donts) => patchGuidance({ creator_donts })}
                    danger
                  />
                  <BriefField label="Recommended B-roll">
                    <textarea
                      className="bw-textarea"
                      value={guidance.recommended_b_rolls}
                      onChange={(e) =>
                        patchGuidance({ recommended_b_rolls: e.target.value })
                      }
                    />
                  </BriefField>
                  <div className="bw-grid-2">
                    <BriefField label="Audio strategy">
                      <select
                        className="bw-select"
                        value={guidance.audio_strategy}
                        onChange={(e) =>
                          patchGuidance({
                            audio_strategy: e.target
                              .value as CreatorLedDraft["audio_strategy"],
                          })
                        }
                      >
                        <option value="DIRECT_VOICEOVER">Direct voiceover</option>
                        <option value="TRENDING_MUSIC_BACKGROUND">
                          Trending music background
                        </option>
                        <option value="LOFI_FOCUS_BEATS">Lo-fi focus beats</option>
                        <option value="ORIGINAL_AUDIO">Original audio</option>
                      </select>
                    </BriefField>
                    <BriefField label="Lighting">
                      <select
                        className="bw-select"
                        value={guidance.lighting_requirements}
                        onChange={(e) =>
                          patchGuidance({
                            lighting_requirements: e.target
                              .value as CreatorLedDraft["lighting_requirements"],
                          })
                        }
                      >
                        <option value="NATURAL_DAYLIGHT">Natural daylight</option>
                        <option value="BRIGHT_CLINICAL">Bright clinical</option>
                        <option value="WARM_MOODY">Warm moody</option>
                        <option value="STUDIO_RING_LIGHT">Studio ring light</option>
                      </select>
                    </BriefField>
                  </div>
                  <BriefField label="Background setting">
                    <input
                      className="bw-input"
                      value={guidance.background_setting}
                      onChange={(e) =>
                        patchGuidance({ background_setting: e.target.value })
                      }
                    />
                  </BriefField>
                  <BriefField label="Post caption">
                    <textarea
                      className="bw-textarea"
                      value={guidance.post_caption}
                      onChange={(e) =>
                        patchGuidance({ post_caption: e.target.value })
                      }
                    />
                  </BriefField>
                  <TagEditor
                    label="Hashtags & mentions"
                    values={guidance.hashtags_and_mentions}
                    onChange={(hashtags_and_mentions) =>
                      patchGuidance({ hashtags_and_mentions })
                    }
                    placeholder="#ad or @handle"
                  />
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Step3({
  deadlineDescriptor,
  setDeadlineDescriptor,
  fixedDate,
  setFixedDate,
  samplesRequired,
  setSamplesRequired,
  basePayout,
  setBasePayout,
  commissionPercent,
  setCommissionPercent,
  bioDays,
  setBioDays,
  adsDays,
  setAdsDays,
  repostDays,
  setRepostDays,
  briefType,
  deliverables,
  creatorGuidance,
}: {
  deadlineDescriptor: string;
  setDeadlineDescriptor: (v: string) => void;
  fixedDate: string;
  setFixedDate: (v: string) => void;
  samplesRequired: boolean;
  setSamplesRequired: (v: boolean) => void;
  basePayout: string;
  setBasePayout: (v: string) => void;
  commissionPercent: string;
  setCommissionPercent: (v: string) => void;
  bioDays: string;
  setBioDays: (v: string) => void;
  adsDays: string;
  setAdsDays: (v: string) => void;
  repostDays: string;
  setRepostDays: (v: string) => void;
  briefType: UceBriefStrategyMode;
  deliverables: DeliverableDraft[];
  creatorGuidance: Record<string, CreatorLedDraft>;
}) {
  const dateInputValue = (() => {
    const d = new Date(fixedDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="create-wizard-step">
      <header className="create-wizard-step-head">
        <h1>Timelines & Terms</h1>
        <p>Review the final compiled configuration before dispatching the brief.</p>
      </header>

      <div className="create-wizard-fields">
        <div>
          <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800 }}>
            Logistics Grid
          </h2>
          <div className="bw-logistics-grid">
            <div className="bw-logistics-row">
              <span>Campaign fulfillment deadline</span>
              <input
                className="bw-input"
                value={deadlineDescriptor}
                onChange={(e) => setDeadlineDescriptor(e.target.value)}
              />
            </div>
            <div className="bw-logistics-row">
              <span>Fixed calendar target date</span>
              <input
                className="bw-input"
                type="date"
                value={dateInputValue}
                onChange={(e) =>
                  setFixedDate(
                    new Date(`${e.target.value}T12:00:00.000Z`).toISOString(),
                  )
                }
              />
            </div>
            <div className="bw-logistics-row">
              <span>Physical product samples shipped</span>
              <select
                className="bw-select"
                value={samplesRequired ? "yes" : "no"}
                onChange={(e) => setSamplesRequired(e.target.value === "yes")}
              >
                <option value="yes">YES</option>
                <option value="no">NO</option>
              </select>
            </div>
            <div className="bw-logistics-row">
              <span>Base escrow compensation</span>
              <input
                className="bw-input"
                type="number"
                min={0}
                value={basePayout}
                onChange={(e) => setBasePayout(e.target.value)}
              />
            </div>
            <div className="bw-logistics-row">
              <span>Commission incentive %</span>
              <input
                className="bw-input"
                type="number"
                min={0}
                max={100}
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
              />
            </div>
            <div className="bw-logistics-row">
              <span>Bio-link / ads / repost days</span>
              <div className="bw-grid-2">
                <input
                  className="bw-input"
                  value={bioDays}
                  onChange={(e) => setBioDays(e.target.value)}
                  placeholder="Bio days"
                />
                <input
                  className="bw-input"
                  value={adsDays}
                  onChange={(e) => setAdsDays(e.target.value)}
                  placeholder="Ads days"
                />
                <input
                  className="bw-input"
                  value={repostDays}
                  onChange={(e) => setRepostDays(e.target.value)}
                  placeholder="Repost days"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800 }}>
            Deliverable review
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {deliverables.map((d, index) => (
              <div key={d.id} className="bw-deliverable">
                <strong style={{ fontSize: 13 }}>
                  Deliverable {index + 1}:{" "}
                  {FORMAT_OPTIONS.find((f) => f.value === d.format_type)?.label} ·{" "}
                  {briefType === "CREATOR_LED" ? "CREATOR-LED" : "BRAND-LED"}
                </strong>
                <p className="bw-review-note">
                  {creatorGuidance[d.id]?.content_theme ||
                    creatorGuidance[d.id]?.description ||
                    "Configured in Content Guidance."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <BriefField label={label}>
      <div className="bw-chip-row">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`bw-chip${value === opt.value ? " is-selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </BriefField>
  );
}

function TagEditor({
  label,
  values,
  onChange,
  placeholder = "Add item…",
  danger = false,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  danger?: boolean;
}) {
  const [draft, setDraft] = useState("");
  return (
    <BriefField label={label}>
      <div
        className="bw-tag-box"
        style={danger ? { borderColor: "#fecaca" } : undefined}
      >
        {values.map((tag) => (
          <span
            key={tag}
            className="bw-tag"
            style={
              danger
                ? { background: "#fef2f2", color: "#b91c1c" }
                : undefined
            }
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== tag))}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="bw-tag-input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              const next = draft.trim();
              if (!next || values.includes(next)) return;
              onChange([...values, next]);
              setDraft("");
            }
          }}
        />
      </div>
    </BriefField>
  );
}
