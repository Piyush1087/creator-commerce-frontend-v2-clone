import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pencil, Plus, Upload, X } from "lucide-react";

import { Alert, Button, Card, Chip, TextField } from "../../../design-system/aurora";

import {
  getBrandAuditExport,
  getBrandProfile,
  getIntelligenceStatus,
  patchBrandProfile,
  uploadBrandLogo,
} from "../api/brand-client";
import { uploadErrorMessage } from "../api/http-api-error";
import { BrandImageAvatar } from "./brand-image-avatar";
import type {
  BrandDnaSnapshot,
  BrandIntelligenceStage,
  BrandProfileResponseBody,
  IntelligenceStatusResponse,
  UniversalFieldWrapper,
} from "../contracts/brand.contracts";
import { INDUSTRY_VERTICALS } from "../contracts/discovery.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import { EMPTY_BRAND_DNA } from "../constants/empty-brand-dna";
import { buildPatchFromDna, mapProfileToBrandDna } from "../mappers/map-brand-profile";
import {
  brandDnaFormSchema,
  dnaAestheticTagSchema,
  dnaAgeRangeSchema,
  dnaBrandNameSchema,
  dnaColorSchema,
  dnaDescriptionSchema,
  dnaPersonaNameSchema,
  dnaTaglineSchema,
  dnaToneTagSchema,
  dnaTraitTagSchema,
  zodFirstError,
} from "../schemas/brand-dna-schema";
import { loadBrandOnboardingSession } from "../session/onboarding-session";
import type { BrandDnaState } from "../types";
import { downloadBrandAuditPdf } from "../utils/brand-audit-pdf";
import { fileToBase64 } from "../utils/image-upload";

const INDUSTRY_EDIT_OPTIONS = INDUSTRY_VERTICALS.filter(
  (value) =>
    value !== "GAMBLING" && value !== "ADULT" && value !== "FRAUDULENT_HIGH_RISK",
);

const PIPELINE_IN_PROGRESS: BrandIntelligenceStage[] = [
  "CORE_IDENTITY_APPROVED",
  "STAGE_1B_COMPLETE",
  "STAGE_2_BRAND_DNA_COMPLETE",
];

const PIPELINE_FAILED: BrandIntelligenceStage[] = [
  "STAGE_1B_FAILED",
  "STAGE_2_BRAND_DNA_FAILED",
  "STAGE_2_NEEDS_REVIEW",
];

function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "-";
}

function wrapDisplay(wrapper: UniversalFieldWrapper<unknown> | null | undefined): string {
  if (!wrapper) {
    return "-";
  }
  const value = wrapper.value;
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    return displayOrDash(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(", ") : "-";
  }
  return String(value);
}

function stageProgressLabel(stage: BrandIntelligenceStage | null): string {
  switch (stage) {
    case "CORE_IDENTITY_APPROVED":
      return "Acquiring brand pages…";
    case "STAGE_1B_COMPLETE":
      return "Extracting Brand DNA…";
    case "STAGE_2_BRAND_DNA_COMPLETE":
      return "Validating Brand DNA…";
    default:
      return "Building brand DNA…";
  }
}

type EditableTarget =
  | { field: "brandName"; label: string; value: string; multiline?: false; kind: "text" }
  | { field: "tagline"; label: string; value: string; multiline?: false; kind: "text" }
  | { field: "description"; label: string; value: string; multiline: true; kind: "text" }
  | { field: "personaName"; label: string; value: string; multiline?: false; kind: "text" }
  | { field: "ageRange"; label: string; value: string; multiline?: false; kind: "text" }
  | { field: "industry"; label: string; value: string; multiline?: false; kind: "industry" }
  | { field: "color"; label: string; value: string; multiline?: false; kind: "color" }
  | { field: "tone"; label: string; value: string; multiline?: false; kind: "text" }
  | { field: "aesthetic"; label: string; value: string; multiline?: false; kind: "text" }
  | { field: "trait"; label: string; value: string; multiline?: false; kind: "text" };

function formatTypography(heading: string, body: string): string | null {
  const h = heading.trim();
  const b = body.trim();
  const unknown = (value: string) => value.toLowerCase() === "unknown";
  if ((!h || unknown(h)) && (!b || unknown(b))) {
    return null;
  }
  const displayH = h && !unknown(h) ? h : "—";
  const displayB = b && !unknown(b) ? b : "—";
  return `Typography: ${displayH} / ${displayB}`;
}
export function BrandDnaView() {
  const navigate = useNavigate();
  const location = useLocation();
  const seedUrl =
    typeof location.state === "object" &&
    location.state !== null &&
    "url" in location.state &&
    typeof (location.state as { url?: unknown }).url === "string"
      ? (location.state as { url: string }).url
      : undefined;
  const scanMode =
    typeof location.state === "object" &&
    location.state !== null &&
    "scanMode" in location.state &&
    ((location.state as { scanMode?: unknown }).scanMode === "http" ||
      (location.state as { scanMode?: unknown }).scanMode === "cached")
      ? (location.state as { scanMode: "http" | "cached" }).scanMode
      : undefined;

  const [baseline, setBaseline] = useState<BrandProfileResponseBody | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [intelStatus, setIntelStatus] = useState<IntelligenceStatusResponse | null>(
    null,
  );
  const [intelBuilding, setIntelBuilding] = useState(false);
  const [intelNotice, setIntelNotice] = useState<string | null>(() => {
    if (
      typeof location.state === "object" &&
      location.state !== null &&
      "intelNotice" in location.state &&
      typeof (location.state as { intelNotice?: unknown }).intelNotice === "string"
    ) {
      return (location.state as { intelNotice: string }).intelNotice;
    }
    if (
      typeof location.state === "object" &&
      location.state !== null &&
      "intelligenceFailure" in location.state &&
      (location.state as { intelligenceFailure?: unknown }).intelligenceFailure === true
    ) {
      return "Deeper brand analysis unavailable — you can edit manually.";
    }
    return null;
  });
  const [brandDnaExtra, setBrandDnaExtra] = useState<BrandDnaSnapshot | null>(null);

  const [data, setData] = useState<BrandDnaState>(EMPTY_BRAND_DNA);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditableTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const typographyLabel = useMemo(
    () => formatTypography(data.typography.heading, data.typography.body),
    [data.typography.body, data.typography.heading],
  );

  const leadIdFromState =
    typeof location.state === "object" &&
    location.state !== null &&
    "leadId" in location.state &&
    typeof (location.state as { leadId?: unknown }).leadId === "string"
      ? (location.state as { leadId: string }).leadId
      : undefined;
  const confirmedFromState =
    typeof location.state === "object" &&
    location.state !== null &&
    "coreIdentityConfirmed" in location.state &&
    (location.state as { coreIdentityConfirmed?: unknown }).coreIdentityConfirmed ===
      true;

  useEffect(() => {
    const fromState =
      typeof location.state === "object" &&
      location.state !== null &&
      "brandProfileId" in location.state &&
      typeof (location.state as { brandProfileId?: unknown }).brandProfileId === "string"
        ? (location.state as { brandProfileId: string }).brandProfileId
        : undefined;
    const session = loadBrandOnboardingSession();
    const id = fromState ?? session?.brandProfileId;
    const leadId = leadIdFromState ?? session?.leadId;
    if (!id) {
      setLoadError("Missing brand profile. Run a scan from the landing page first.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const loadProfile = async () => {
      const profile = await getBrandProfile(id);
      if (cancelled) return;
      setBaseline(profile);
      setData(mapProfileToBrandDna(profile));
      setLoadError(null);
    };

    const applyIntel = async (status: IntelligenceStatusResponse) => {
      if (cancelled) return;
      setIntelStatus(status);
      if (status.brandDna) {
        setBrandDnaExtra(status.brandDna);
      }
      if (status.currentStage && PIPELINE_IN_PROGRESS.includes(status.currentStage)) {
        setIntelBuilding(true);
        setIntelNotice(null);
        return "poll" as const;
      }
      if (status.currentStage === "STAGE_2_BRAND_DNA_ARCHIVED") {
        setIntelBuilding(false);
        setIntelNotice(null);
        await loadProfile();
        return "done" as const;
      }
      if (status.currentStage && PIPELINE_FAILED.includes(status.currentStage)) {
        setIntelBuilding(false);
        setIntelNotice(
          "Deeper brand analysis unavailable — you can edit manually.",
        );
        return "done" as const;
      }
      setIntelBuilding(false);
      return "done" as const;
    };

    const start = async () => {
      setIsLoading(true);
      try {
        await loadProfile();
        if (!leadId) {
          return;
        }
        // Resume flow (no confirmation) — only poll if a scan row already exists.
        const status = await getIntelligenceStatus(leadId);
        if (cancelled) return;
        if (!status.currentStage && !confirmedFromState) {
          return;
        }
        const mode = await applyIntel(status);
        if (mode === "poll") {
          pollTimer = setInterval(() => {
            void getIntelligenceStatus(leadId)
              .then(async (next) => {
                const result = await applyIntel(next);
                if (result === "done" && pollTimer) {
                  clearInterval(pollTimer);
                  pollTimer = null;
                }
              })
              .catch(() => {
                /* keep polling silently */
              });
          }, 2500);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to load brand profile.";
        setLoadError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [confirmedFromState, leadIdFromState, location.state]);

  const subtitle = useMemo(() => {
    if (loadError) {
      return loadError;
    }
    if (isLoading) {
      return "Loading your latest scan results…";
    }
    if (intelBuilding) {
      return stageProgressLabel(intelStatus?.currentStage ?? null);
    }
    if (!seedUrl) {
      return "Brand DNA loaded from your profile.";
    }
    return `Seeded from ${seedUrl}${scanMode ? ` • scan: ${scanMode}` : ""}`;
  }, [intelBuilding, intelStatus?.currentStage, isLoading, loadError, scanMode, seedUrl]);

  const handleLooksGood = async () => {
    if (!baseline) {
      setError("Still loading your profile. Try again in a moment.");
      return;
    }
    const missingGroups: string[] = [];
    if (data.industry.length === 0) missingGroups.push("industry");
    if (data.tones.length === 0) missingGroups.push("tone of voice");
    if (data.aesthetics.length === 0) missingGroups.push("visual aesthetic");
    if (missingGroups.length > 0) {
      const missingMessageByKey: Record<string, string> = {
        industry: "Select at least 1 industry.",
        "tone of voice": "Select at least 1 tone of voice.",
        "visual aesthetic": "Select at least 1 visual aesthetic.",
      };
      const messages = missingGroups
        .map((k) => missingMessageByKey[k])
        .filter((m): m is string => Boolean(m));
      setError(messages.join(" "));
      return;
    }

    // Coerce legacy `0`/missing affluence to 3 so older scans can proceed.
    const affluence =
      data.persona.affluence && data.persona.affluence >= 1
        ? data.persona.affluence
        : 3;

    const parsed = brandDnaFormSchema.safeParse({
      brandName: data.brandName,
      tagline: data.tagline,
      description: data.description,
      personaName: data.persona.name || undefined,
      affluence,
      industry: data.industry,
      colors: data.colors,
      tones: data.tones,
      aesthetics: data.aesthetics,
      traits: data.persona.traits,
    });
    if (!parsed.success) {
      setError(zodFirstError(parsed.error));
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await patchBrandProfile(baseline.id, buildPatchFromDna(data, baseline));
      setSuccess("Brand DNA saved.");
      navigate(ONBOARDING_ROUTES.catalogue);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save brand DNA. Please try again.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeLater = () => {
    setError(null);
    navigate(ONBOARDING_ROUTES.catalogue);
  };

  const openEdit = (target: EditableTarget) => {
    setDraft(target.value);
    setEditTarget(target);
    setEditError(null);
    setError(null);
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditError(null);
  };

  const saveEdit = () => {
    if (!editTarget) {
      return;
    }
    const trimmed = draft.trim();
    const optionalWhenEmpty: EditableTarget["field"][] = [
      "tagline",
      "description",
    ];
    if (
      trimmed.length === 0 &&
      !optionalWhenEmpty.includes(editTarget.field)
    ) {
      setEditError(`${editTarget.label} can’t be empty.`);
      return;
    }

    if (editTarget.field === "industry") {
      if (!INDUSTRY_EDIT_OPTIONS.some((option) => option === trimmed)) {
        setEditError("Choose a valid industry from the list.");
        return;
      }
      setData((prev) => ({ ...prev, industry: [trimmed] }));
      setSuccess("Updated industry successfully.");
      closeEdit();
      return;
    }

    if (editTarget.field === "brandName") {
      const parsed = dnaBrandNameSchema.safeParse(trimmed);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => ({ ...prev, brandName: parsed.data }));
    } else if (editTarget.field === "tagline") {
      const parsed = dnaTaglineSchema.safeParse(draft);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => ({ ...prev, tagline: parsed.data }));
    } else if (editTarget.field === "description") {
      const parsed = dnaDescriptionSchema.safeParse(draft);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => ({ ...prev, description: parsed.data }));
    } else if (editTarget.field === "personaName") {
      const parsed = dnaPersonaNameSchema.safeParse(trimmed);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => ({
        ...prev,
        persona: { ...prev.persona, name: parsed.data },
      }));
    } else if (editTarget.field === "ageRange") {
      const parsed = dnaAgeRangeSchema.safeParse(trimmed);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => ({
        ...prev,
        persona: { ...prev.persona, ageRange: parsed.data },
      }));
    } else if (editTarget.field === "color") {
      const normalized = (draft.startsWith("#") ? draft : `#${draft}`).trim();
      const parsed = dnaColorSchema.safeParse(normalized);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      if (!editTarget.value && data.colors.length >= 8) {
        setEditError("You can keep at most 8 brand colors.");
        return;
      }
      setData((prev) => {
        if (editTarget.value) {
          return {
            ...prev,
            colors: prev.colors.map((color) =>
              color === editTarget.value ? parsed.data : color,
            ),
          };
        }
        return {
          ...prev,
          colors: prev.colors.includes(parsed.data)
            ? prev.colors
            : [...prev.colors, parsed.data],
        };
      });
    } else if (editTarget.field === "tone") {
      const parsed = dnaToneTagSchema.safeParse(trimmed);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => {
        if (editTarget.value) {
          return {
            ...prev,
            tones: prev.tones.map((tone) =>
              tone === editTarget.value ? parsed.data : tone,
            ),
          };
        }
        return { ...prev, tones: [...prev.tones, parsed.data] };
      });
    } else if (editTarget.field === "aesthetic") {
      const parsed = dnaAestheticTagSchema.safeParse(trimmed);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => {
        if (editTarget.value) {
          return {
            ...prev,
            aesthetics: prev.aesthetics.map((item) =>
              item === editTarget.value ? parsed.data : item,
            ),
          };
        }
        return { ...prev, aesthetics: [...prev.aesthetics, parsed.data] };
      });
    } else if (editTarget.field === "trait") {
      const parsed = dnaTraitTagSchema.safeParse(trimmed);
      if (!parsed.success) {
        setEditError(zodFirstError(parsed.error));
        return;
      }
      setData((prev) => {
        if (editTarget.value) {
          return {
            ...prev,
            persona: {
              ...prev.persona,
              traits: prev.persona.traits.map((trait) =>
                trait === editTarget.value ? parsed.data : trait,
              ),
            },
          };
        }
        return {
          ...prev,
          persona: {
            ...prev.persona,
            traits: [...prev.persona.traits, parsed.data],
          },
        };
      });
    }

    setEditError(null);
    setSuccess(`Updated ${editTarget.label.toLowerCase()} successfully.`);
    closeEdit();
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!baseline || !file) {
      return;
    }
    setIsUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const base64 = await fileToBase64(file);
      const uploaded = await uploadBrandLogo(baseline.id, {
        imageBase64: base64,
        contentType: file.type || "image/jpeg",
      });
      setData((prev) => ({ ...prev, logo: uploaded.imageUrl }));
      setBaseline((prev) =>
        prev ? { ...prev, logoUrl: uploaded.imageUrl } : prev,
      );
      setSuccess("Logo uploaded successfully.");
    } catch (err) {
      setLogoUploadError(uploadErrorMessage(err));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeTag = (
    field: "industry" | "tones" | "aesthetics" | "traits" | "colors",
    value: string,
  ) => {
    setData((prev) => {
      if (field === "traits") {
        return {
          ...prev,
          persona: {
            ...prev.persona,
            traits: prev.persona.traits.filter((item) => item !== value),
          },
        };
      }
      if (field === "colors") {
        return {
          ...prev,
          colors: prev.colors.filter((item) => item !== value),
        };
      }
      return {
        ...prev,
        [field]: prev[field].filter((item) => item !== value),
      };
    });
  };

  const handleDownloadAuditPdf = async () => {
    const session = loadBrandOnboardingSession();
    const leadId = leadIdFromState ?? session?.leadId;
    if (!leadId) {
      setPdfError("Missing lead id. Re-run the scan from the landing page.");
      return;
    }
    setIsDownloadingPdf(true);
    setPdfError(null);
    try {
      const audit = await getBrandAuditExport(leadId);
      downloadBrandAuditPdf(audit);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : "Could not download audit PDF. Please try again.",
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="bob-funnel-page bob-container">
      <div className="bob-funnel-page__header">
        <div>
          <h1 className="aurora-card__title" style={{ fontSize: "var(--size-h1)" }}>
            Brand DNA
          </h1>
          <p className="bob-muted">{subtitle}</p>
        </div>
        <div className="bob-stack" style={{ flexDirection: "row", gap: 8 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleDownloadAuditPdf()}
            disabled={isDownloadingPdf || isLoading}
          >
            {isDownloadingPdf ? "Preparing PDF…" : "Download audit PDF"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>

      {pdfError ? (
        <Alert title="PDF download failed" tone="error">
          {pdfError}
        </Alert>
      ) : null}
      {loadError ? (
        <Alert title="Couldn’t load profile" tone="error">
          {loadError}
        </Alert>
      ) : null}
      {intelBuilding ? (
        <Alert title="Building brand DNA…" tone="warning">
          {`${stageProgressLabel(intelStatus?.currentStage ?? null)} Stage: ${intelStatus?.currentStage ?? "starting"}.`}
        </Alert>
      ) : null}
      {intelNotice ? (
        <Alert title="Deeper analysis unavailable" tone="warning">
          {intelNotice}
        </Alert>
      ) : null}
      {error ? (
        <Alert title="Validation issue" tone="error">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert title="Saved" tone="success">
          {success}
        </Alert>
      ) : null}

      <div className="bob-dna-grid" style={{ marginTop: error ? 16 : 0 }}>
          <Card title="About" eyebrow="AI extracted">
            <EditableDisplay
              label="Brand name"
              value={data.brandName}
              onEdit={() =>
                openEdit({
                  field: "brandName",
                  label: "Brand name",
                  value: data.brandName,
                  kind: "text",
                })
              }
            />
            <EditableDisplay
              label="Tagline"
              value={data.tagline}
              onEdit={() =>
                openEdit({
                  field: "tagline",
                  label: "Tagline",
                  value: data.tagline,
                  kind: "text",
                })
              }
            />
            <EditableDisplay
              label="Brand description"
              value={data.description}
              long
              helpText="Descriptions over 500 characters are blocked for campaign brief quality."
              onEdit={() =>
                openEdit({
                  field: "description",
                  label: "Description",
                  value: data.description,
                  multiline: true,
                  kind: "text",
                })
              }
            />
            <TagGroup
              label="Industry"
              values={data.industry}
              onAdd={() =>
                openEdit({
                  field: "industry",
                  label: "Industry",
                  value: data.industry[0] ?? "",
                  kind: "industry",
                })
              }
              onEditFirst={
                data.industry.length > 0
                  ? () =>
                      openEdit({
                        field: "industry",
                        label: "Industry",
                        value: data.industry[0] ?? "",
                        kind: "industry",
                      })
                  : undefined
              }
              onRemove={(value) => removeTag("industry", value)}
            />
          </Card>

          <Card title="Visual identity" eyebrow="AI extracted">
            <div className="bob-dna-logo-row">
              <BrandImageAvatar
                className="bob-dna-logo"
                src={data.logo}
                label={data.brandName}
                alt={`${data.brandName} logo`}
                size={64}
              />
              <div>
                <h2>{data.brandName}</h2>
                <p className={data.tagline.trim() ? undefined : "bob-muted"}>
                  {data.tagline.trim() || "No tagline from scan — edit to add one"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isUploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload size={14} aria-hidden />{" "}
                  {isUploadingLogo ? "Uploading…" : "Upload logo"}
                </Button>
                {logoUploadError ? (
                  <p className="bob-upload-error" role="alert">
                    {logoUploadError}
                  </p>
                ) : null}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon"
                  hidden
                  onChange={(event) => {
                    void handleLogoUpload(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
            </div>
            <TagGroup
              label="Tone of voice"
              values={data.tones}
              onAdd={() =>
                openEdit({ field: "tone", label: "Tone tag", value: "", kind: "text" })
              }
              onRemove={(value) => removeTag("tones", value)}
            />
            <TagGroup
              label="Visual aesthetic"
              values={data.aesthetics}
              onAdd={() =>
                openEdit({
                  field: "aesthetic",
                  label: "Aesthetic tag",
                  value: "",
                  kind: "text",
                })
              }
              onRemove={(value) => removeTag("aesthetics", value)}
            />
            <div className="bob-color-row">
              {data.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  style={{ background: color }}
                  aria-label={color}
                  onClick={() =>
                    openEdit({
                      field: "color",
                      label: "Color",
                      value: color,
                      kind: "color",
                    })
                  }
                />
              ))}
            </div>
            {typographyLabel ? (
              <p className="aurora-field__helper">{typographyLabel}</p>
            ) : null}
          </Card>

        </div>

      {brandDnaExtra ? (
        <div style={{ marginTop: 24 }}>
          <Card title="Additional data" eyebrow="Stage 2 Brand DNA">
            <div className="bob-dna-additional">
              <AdditionalRow
                label="Industry niche"
                wrapper={brandDnaExtra.industry_niche}
              />
              <AdditionalRow
                label="Brand positioning"
                wrapper={brandDnaExtra.brand_positioning}
              />
              <AdditionalRow
                label="Brand narrative"
                wrapper={brandDnaExtra.brand_narrative}
              />
              <AdditionalRow
                label="Core value proposition"
                wrapper={brandDnaExtra.core_value_proposition}
              />
              <AdditionalRow
                label="Key differentiators"
                wrapper={brandDnaExtra.key_differentiators}
              />
              {(brandDnaExtra.audience_personas ?? []).map((persona, index) => (
                <AdditionalRow
                  key={`persona-${index + 1}`}
                  label={`Audience persona ${index + 1}`}
                  valueOverride={[
                    wrapDisplay(persona.name),
                    wrapDisplay(persona.age_range),
                    wrapDisplay(persona.gender),
                    wrapDisplay(persona.geography),
                    wrapDisplay(persona.affluence_score),
                    wrapDisplay(persona.traits),
                  ].join(" · ")}
                  wrapper={persona.name}
                />
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <div className="bob-inline" style={{ marginTop: 24 }}>
        <Button
          type="button"
          variant="primary"
          disabled={isLoading || Boolean(loadError) || isSaving || intelBuilding}
          onClick={() => void handleLooksGood()}
        >
          Looks good, next
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isSaving}
          onClick={() => handleChangeLater()}
        >
          I&apos;ll change later
        </Button>
      </div>

      {editTarget ? (
        <div className="bob-modal-backdrop" role="presentation">
          <div className="bob-small-dialog" role="dialog" aria-modal="true">
            <div className="bob-funnel-page__header">
              <h2 className="aurora-card__title">Edit {editTarget.label}</h2>
              <button
                type="button"
                className="bob-icon-button"
                aria-label="Close edit dialog"
                onClick={closeEdit}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            {editTarget.multiline === true ? (
              <TextField
                label={editTarget.label}
                multiline
                rows={6}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setEditError(null);
                }}
              />
            ) : editTarget.kind === "industry" ? (
              <label className="aurora-field">
                <span className="aurora-field__label">{editTarget.label}</span>
                <select
                  className="aurora-input"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setEditError(null);
                  }}
                >
                  <option value="">Select industry…</option>
                  {INDUSTRY_EDIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <TextField
                label={editTarget.label}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setEditError(null);
                }}
                helperText={
                  editTarget.kind === "color"
                    ? "Use hex format, e.g. #34D399"
                    : undefined
                }
              />
            )}
            {editError ? (
              <p className="bob-upload-error" role="alert">
                {editError}
              </p>
            ) : null}
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button type="button" variant="primary" onClick={saveEdit}>
                Save
              </Button>
              <Button type="button" variant="secondary" onClick={closeEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type EditableDisplayProps = {
  helpText?: string;
  label: string;
  long?: boolean;
  onEdit?: () => void;
  value: string;
};

function EditableDisplay({
  helpText,
  label,
  long = false,
  onEdit,
  value,
}: EditableDisplayProps) {
  return (
    <div className="bob-editable">
      <div className="bob-editable__header">
        <span>{label}</span>
        {onEdit ? (
          <button type="button" aria-label={`Edit ${label}`} onClick={onEdit}>
            <Pencil size={14} aria-hidden />
          </button>
        ) : null}
      </div>
      <p className={long ? "bob-editable__value bob-editable__value--long" : "bob-editable__value"}>
        {displayOrDash(value)}
      </p>
      {helpText ? <small>{helpText}</small> : null}
    </div>
  );
}

function AdditionalRow({
  label,
  wrapper,
  valueOverride,
}: {
  label: string;
  wrapper: UniversalFieldWrapper<unknown> | null;
  valueOverride?: string;
}) {
  const value = valueOverride ?? wrapDisplay(wrapper);
  const meta = wrapper
    ? `${wrapper.source} · ${wrapper.confidence}%`
    : "- · -";
  return (
    <div className="bob-dna-additional__row">
      <span className="bob-dna-additional__label">{label}</span>
      <span className="bob-dna-additional__meta">{meta}</span>
      <p className="bob-dna-additional__value">{value}</p>
    </div>
  );
}

type TagGroupProps = {
  label: string;
  onAdd?: () => void;
  onEditFirst?: () => void;
  onRemove: (value: string) => void;
  values: string[];
};

function TagGroup({ label, onAdd, onEditFirst, onRemove, values }: TagGroupProps) {
  return (
    <div className="bob-tag-group">
      <div className="bob-editable__header">
        <span>{label}</span>
        <div className="bob-inline" style={{ gap: 4 }}>
          {onEditFirst ? (
            <button type="button" aria-label={`Edit ${label}`} onClick={onEditFirst}>
              <Pencil size={14} aria-hidden />
            </button>
          ) : null}
          {onAdd ? (
            <button type="button" aria-label={`Add ${label}`} onClick={onAdd}>
              <Plus size={14} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      <div className="bob-inline">
        {values.map((value) => (
          <span className="bob-removable-chip" key={value}>
            <Chip tone="selected">{value}</Chip>
            <button type="button" aria-label={`Remove ${value}`} onClick={() => onRemove(value)}>
              <X size={12} aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
