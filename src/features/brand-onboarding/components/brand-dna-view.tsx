import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pencil, Plus, Upload, X } from "lucide-react";

import { Alert, Button, Card, Chip, TextField } from "../../../design-system/aurora";

import { getBrandProfile, patchBrandProfile, uploadBrandLogo } from "../api/brand-client";
import { uploadErrorMessage } from "../api/http-api-error";
import { BrandImageAvatar } from "./brand-image-avatar";
import type { BrandProfileResponseBody } from "../contracts/brand.contracts";
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
import { fileToBase64 } from "../utils/image-upload";

const INDUSTRY_EDIT_OPTIONS = INDUSTRY_VERTICALS.filter(
  (value) =>
    value !== "GAMBLING" && value !== "ADULT" && value !== "FRAUDULENT_HIGH_RISK",
);

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

  const [data, setData] = useState<BrandDnaState>(EMPTY_BRAND_DNA);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditableTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const typographyLabel = useMemo(
    () => formatTypography(data.typography.heading, data.typography.body),
    [data.typography.body, data.typography.heading],
  );

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
    if (!id) {
      setLoadError("Missing brand profile. Run a scan from the landing page first.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getBrandProfile(id)
      .then((profile) => {
        setBaseline(profile);
        setData(mapProfileToBrandDna(profile));
        setLoadError(null);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Unable to load brand profile.";
        setLoadError(message);
      })
      .finally(() => setIsLoading(false));
  }, [location.state]);

  const subtitle = useMemo(() => {
    if (loadError) {
      return loadError;
    }
    if (isLoading) {
      return "Loading your latest scan results…";
    }
    if (!seedUrl) {
      return "Brand DNA loaded from your profile.";
    }
    return `Seeded from ${seedUrl}${scanMode ? ` • scan: ${scanMode}` : ""}`;
  }, [isLoading, loadError, scanMode, seedUrl]);

  const handleLooksGood = async () => {
    if (!baseline) {
      setError("Still loading your profile. Try again in a moment.");
      return;
    }
    const missingGroups: string[] = [];
    if (data.industry.length === 0) missingGroups.push("industry");
    if (data.tones.length === 0) missingGroups.push("tone of voice");
    if (data.aesthetics.length === 0) missingGroups.push("visual aesthetic");
    if (data.persona.traits.length === 0) missingGroups.push("audience trait");
    if (missingGroups.length > 0) {
      setError(
        missingGroups.length === 1
          ? `Select at least 1 ${missingGroups[0]} before continuing.`
          : `Select at least 1 of each: ${missingGroups.join(", ")}.`,
      );
      return;
    }
    const parsed = brandDnaFormSchema.safeParse({
      brandName: data.brandName,
      tagline: data.tagline,
      description: data.description,
      personaName: data.persona.name || undefined,
      affluence: data.persona.affluence,
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
      if (!editTarget.value && data.tones.length >= 5) {
        setEditError("You can keep at most 5 tone tags.");
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
      if (!editTarget.value && data.aesthetics.length >= 5) {
        setEditError("You can keep at most 5 visual aesthetic tags.");
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
      if (!editTarget.value && data.persona.traits.length >= 7) {
        setEditError("You can keep at most 7 audience traits.");
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

  return (
    <div className="bob-funnel-page bob-container">
      <div className="bob-funnel-page__header">
        <div>
          <h1 className="aurora-card__title" style={{ fontSize: "var(--size-h1)" }}>
            Brand DNA
          </h1>
          <p className="bob-muted">{subtitle}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {loadError ? (
        <Alert title="Couldn’t load profile" tone="error">
          {loadError}
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

      <div className="bob-dna-grid">
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

          <Card title="Audience persona" eyebrow="Matcher signal">
            <EditableDisplay
              label="Persona name"
              value={data.persona.name}
              onEdit={() =>
                openEdit({
                  field: "personaName",
                  label: "Persona name",
                  value: data.persona.name,
                  kind: "text",
                })
              }
            />
            <EditableDisplay label="Location" value={data.persona.location} />
            <EditableDisplay label="Age range" value={data.persona.ageRange} onEdit={() =>
                openEdit({
                  field: "ageRange",
                  label: "Age range",
                  value: data.persona.ageRange,
                  kind: "text",
                })
              } />
            <EditableDisplay
              label="Affluence score"
              value={`${data.persona.affluence}/5`}
              helpText="Set by scan signals — not editable here."
            />
            <TagGroup
              label="Audience traits"
              values={data.persona.traits}
              onAdd={() =>
                openEdit({ field: "trait", label: "Trait", value: "", kind: "text" })
              }
              onRemove={(value) => removeTag("traits", value)}
            />
          </Card>
        </div>

      <div className="bob-inline" style={{ marginTop: 24 }}>
        <Button
          type="button"
          variant="primary"
          disabled={isLoading || Boolean(loadError) || isSaving}
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
        {value}
      </p>
      {helpText ? <small>{helpText}</small> : null}
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
