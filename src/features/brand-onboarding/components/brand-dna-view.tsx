import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pencil, Plus, X } from "lucide-react";

import { Alert, Button, Card, Chip, TextField } from "../../../design-system/aurora";

import { getBrandProfile, patchBrandProfile } from "../api/brand-client";
import { BrandImageAvatar } from "./brand-image-avatar";
import type { BrandProfileResponseBody } from "../contracts/brand.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import { EMPTY_BRAND_DNA } from "../constants/empty-brand-dna";
import { buildPatchFromDna, mapProfileToBrandDna } from "../mappers/map-brand-profile";
import { brandDnaFormSchema } from "../schemas/brand-dna-schema";
import { loadBrandOnboardingSession } from "../session/onboarding-session";
import type { BrandDnaState } from "../types";

const TABS = ["Brand Identity", "Campaign History", "Creative Assets"] as const;

type EditableTarget =
  | { field: "brandName"; label: string; value: string; multiline?: false }
  | { field: "tagline"; label: string; value: string; multiline?: false }
  | { field: "description"; label: string; value: string; multiline: true }
  | { field: "personaName"; label: string; value: string; multiline?: false };

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
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Brand Identity");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditableTarget | null>(null);
  const [draft, setDraft] = useState("");

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
    const parsed = brandDnaFormSchema.safeParse({
      brandName: data.brandName,
      tagline: data.tagline,
      description: data.description,
      personaName: data.persona.name,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed.");
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
    setError(null);
  };

  const saveEdit = () => {
    if (!editTarget) {
      return;
    }
    if (editTarget.field === "description" && draft.length > 500) {
      setError("Briefs work best with concise descriptions. Please trim this down.");
      return;
    }
    const optionalWhenEmpty: EditableTarget["field"][] = [
      "tagline",
      "description",
    ];
    if (
      draft.trim().length === 0 &&
      !optionalWhenEmpty.includes(editTarget.field)
    ) {
      setError(`${editTarget.label} is required.`);
      return;
    }
    setData((prev) => {
      if (editTarget.field === "personaName") {
        return {
          ...prev,
          persona: { ...prev.persona, name: draft },
        };
      }
      return { ...prev, [editTarget.field]: draft };
    });
    setSuccess(`Updated ${editTarget.label.toLowerCase()} successfully.`);
    setEditTarget(null);
  };

  const removeTag = (
    field: "industry" | "tones" | "aesthetics" | "traits",
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

      <div className="bob-tabs" role="tablist" aria-label="Brand DNA sections">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? "bob-tabs__tab--active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Brand Identity" ? (
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
                })
              }
            />
            <TagGroup
              label="Industry"
              values={data.industry}
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
              </div>
            </div>
            <TagGroup
              label="Tone of voice"
              values={data.tones}
              onRemove={(value) => removeTag("tones", value)}
            />
            <TagGroup
              label="Visual aesthetic"
              values={data.aesthetics}
              onRemove={(value) => removeTag("aesthetics", value)}
            />
            <div className="bob-color-row">
              {data.colors.map((color) => (
                <span
                  key={color}
                  title={color}
                  style={{ background: color }}
                  aria-label={color}
                />
              ))}
            </div>
            <p className="aurora-field__helper">
              Typography: {data.typography.heading} / {data.typography.body}
            </p>
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
                })
              }
            />
            <EditableDisplay label="Location" value={data.persona.location} />
            <EditableDisplay label="Age range" value={data.persona.ageRange} />
            <EditableDisplay
              label="Affluence score"
              value={`${data.persona.affluence}/5`}
            />
            <TagGroup
              label="Audience traits"
              values={data.persona.traits}
              onRemove={(value) => removeTag("traits", value)}
            />
          </Card>
        </div>
      ) : (
        <Card title={activeTab} eyebrow="Coming next">
          <p className="bob-muted">
            This tab mirrors the prototype structure and is reserved for the next
            dataset. Brand identity remains the active editable section for now.
          </p>
        </Card>
      )}

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
                onClick={() => setEditTarget(null)}
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
                onChange={(event) => setDraft(event.target.value)}
              />
            ) : (
              <TextField
                label={editTarget.label}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            )}
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button type="button" variant="primary" onClick={saveEdit}>
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditTarget(null)}
              >
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
  onRemove: (value: string) => void;
  values: string[];
};

function TagGroup({ label, onRemove, values }: TagGroupProps) {
  return (
    <div className="bob-tag-group">
      <div className="bob-editable__header">
        <span>{label}</span>
        <button type="button" aria-label={`Add ${label}`}>
          <Plus size={14} aria-hidden />
        </button>
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
