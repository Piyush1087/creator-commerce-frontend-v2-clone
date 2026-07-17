import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Info, Upload, X } from "lucide-react";

import { Alert, Button, Card, TextField } from "../../../design-system/aurora";

import {
  getCoreIdentitySnapshot,
  postConfirmIdentity,
  uploadBrandLogo,
} from "../api/brand-client";
import { uploadErrorMessage } from "../api/http-api-error";
import type {
  ConfirmIdentityRequestBody,
  CoreIdentitySnapshot,
  CoreIdentitySnapshotResponse,
  CoreIdentitySocialHandles,
  UniversalFieldWrapper,
} from "../contracts/brand.contracts";
import { INDUSTRY_VERTICALS } from "../contracts/discovery.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import {
  loadBrandOnboardingSession,
  saveBrandOnboardingSession,
} from "../session/onboarding-session";
import { fileToBase64 } from "../utils/image-upload";
import { BrandImageAvatar } from "./brand-image-avatar";

type LocationState = {
  url?: string;
  leadId?: string;
  brandProfileId?: string;
  scanMode?: "http" | "cached";
};

type EditableForm = {
  brand_name: string;
  brand_logo: string;
  industry: string;
  sub_industry: string;
  tagline: string;
  social_handles: CoreIdentitySocialHandles;
};

const INDUSTRY_OPTIONS = INDUSTRY_VERTICALS.filter(
  (value) =>
    value !== "GAMBLING" &&
    value !== "ADULT" &&
    value !== "FRAUDULENT_HIGH_RISK" &&
    value !== "UNKNOWN",
);

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "-";
  }
  return String(value);
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeIndustryOption(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (key === "D2C_ECOMMERCE" || key === "ECOMMERCE") return "D2C";
  if (key === "AI_SAAS" || key === "SAAS") return "SAAS_AI";
  return key;
}

function formFromSnapshot(snapshot: CoreIdentitySnapshot): EditableForm {
  return {
    brand_name: snapshot.brand_name.value ?? "",
    brand_logo: snapshot.brand_logo.value ?? "",
    industry: normalizeIndustryOption(snapshot.industry.value ?? "D2C"),
    sub_industry: snapshot.sub_industry.value ?? "",
    tagline: snapshot.tagline.value ?? "",
    social_handles: {
      instagram: snapshot.social_handles.value.instagram,
      tiktok: snapshot.social_handles.value.tiktok,
      facebook: snapshot.social_handles.value.facebook,
      youtube: snapshot.social_handles.value.youtube,
      linkedin: snapshot.social_handles.value.linkedin,
    },
  };
}

function FieldMeta({
  wrapper,
}: {
  wrapper: UniversalFieldWrapper<unknown> | null;
}) {
  if (!wrapper) {
    return null;
  }
  const evidence =
    wrapper.evidence?.[0]?.excerpt?.trim() ||
    wrapper.evidence?.[0]?.page_type ||
    "-";
  return (
    <p className="bob-core-identity__evidence">
      <Info size={14} aria-hidden />
      <span>
        {wrapper.source} · {wrapper.confidence}% — {evidence}
      </span>
    </p>
  );
}

export function CoreIdentityReviewView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};
  const session = loadBrandOnboardingSession();

  const leadId = state.leadId ?? session?.leadId ?? "";
  const brandUrl = state.url ?? session?.normalizedUrl ?? "yourbrand.com";
  const scanMode = state.scanMode;

  const [payload, setPayload] = useState<CoreIdentitySnapshotResponse | null>(
    null,
  );
  const [form, setForm] = useState<EditableForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!leadId) {
      setLoadError(
        "Missing discovery session. Go back to the landing page and start a scan.",
      );
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getCoreIdentitySnapshot(leadId)
      .then((result) => {
        setPayload(result);
        setForm(formFromSnapshot(result.snapshot));
        setLoadError(null);
        if (result.brandProfileId) {
          saveBrandOnboardingSession({
            leadId: result.leadId,
            brandProfileId: result.brandProfileId,
            normalizedUrl: brandUrl,
          });
        }
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Unable to load Stage 1A core identity snapshot.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [brandUrl, leadId]);

  const snapshot = payload?.snapshot;
  const brandName = form?.brand_name.trim() || brandUrl;
  const brandProfileId =
    payload?.brandProfileId ??
    state.brandProfileId ??
    session?.brandProfileId ??
    "";

  const subtitle = useMemo(() => {
    if (loadError) {
      return loadError;
    }
    if (isLoading) {
      return "Loading Stage 1A core identity snapshot…";
    }
    return `Checkpoint 1 · Stage 1A · ${brandUrl}${
      scanMode ? ` · scan: ${scanMode}` : ""
    }`;
  }, [brandUrl, isLoading, loadError, scanMode]);

  const updateSocial = (
    key: keyof CoreIdentitySocialHandles,
    value: string,
  ) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            social_handles: {
              ...prev.social_handles,
              [key]: emptyToNull(value),
            },
          }
        : prev,
    );
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!brandProfileId) {
      setLogoUploadError(
        "Missing brand profile. Re-run the surface scan from the landing page.",
      );
      return;
    }
    setIsUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const base64 = await fileToBase64(file);
      const uploaded = await uploadBrandLogo(brandProfileId, {
        imageBase64: base64,
        contentType: file.type || "image/jpeg",
      });
      setForm((prev) =>
        prev ? { ...prev, brand_logo: uploaded.imageUrl } : prev,
      );
    } catch (err) {
      setLogoUploadError(uploadErrorMessage(err));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const confirmIdentity = async () => {
    if (!form || !leadId) {
      return;
    }
    if (!brandProfileId) {
      setConfirmError(
        "Missing brand profile id. Re-run the surface scan from the landing page.",
      );
      setConfirmOpen(false);
      return;
    }
    if (!form.brand_name.trim() || !form.sub_industry.trim()) {
      setConfirmError("Brand name and sub-industry are required.");
      return;
    }

    const body: ConfirmIdentityRequestBody = {
      brand_name: form.brand_name.trim(),
      brand_logo: emptyToNull(form.brand_logo),
      industry: form.industry,
      sub_industry: form.sub_industry.trim(),
      tagline: emptyToNull(form.tagline),
      social_handles: {
        instagram: form.social_handles.instagram,
        tiktok: form.social_handles.tiktok,
        facebook: form.social_handles.facebook,
        youtube: form.social_handles.youtube,
        linkedin: form.social_handles.linkedin,
      },
    };

    setIsSaving(true);
    setConfirmError(null);
    try {
      await postConfirmIdentity(leadId, body);
      setConfirmOpen(false);
      navigate(ONBOARDING_ROUTES.intelligenceScan, {
        replace: true,
        state: {
          url: brandUrl,
          leadId,
          brandProfileId,
          scanMode: scanMode ?? "http",
        },
      });
    } catch (err: unknown) {
      setConfirmError(
        err instanceof Error
          ? err.message
          : "Unable to confirm identity. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bob-core-identity">
      <div className="bob-core-identity__header">
        <div>
          <p className="bob-core-identity__eyebrow">Checkpoint 1</p>
          <h1>Core Identity Review</h1>
          <p className="bob-core-identity__subtitle">{subtitle}</p>
        </div>
        <div className="bob-core-identity__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(ONBOARDING_ROUTES.landing)}
          >
            Back to landing
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={Boolean(loadError) || isLoading || !form}
            onClick={() => {
              setConfirmError(null);
              setConfirmOpen(true);
            }}
          >
            Confirm and Continue
          </Button>
        </div>
      </div>

      {loadError ? (
        <Alert tone="warning" title="Core identity unavailable">
          {loadError}
        </Alert>
      ) : null}

      {confirmError && !confirmOpen ? (
        <Alert tone="warning" title="Confirm failed">
          {confirmError}
        </Alert>
      ) : null}

      {isLoading ? (
        <Card className="bob-core-identity__loading">
          <p>Fetching the validated Stage 1A snapshot…</p>
        </Card>
      ) : null}

      {snapshot && form ? (
        <>
          <Card className="bob-core-identity__hero">
            <BrandImageAvatar
              src={emptyToNull(form.brand_logo)}
              label={brandName}
              size={88}
            />
            <div>
              <h2>{displayValue(form.brand_name)}</h2>
              <p>{displayValue(snapshot.website_url.value)}</p>
              <p className="bob-core-identity__hero-meta">
                {displayValue(form.industry)} · {displayValue(form.sub_industry)}
              </p>
              <p className="bob-core-identity__hero-meta">
                Links discovered: {snapshot.discovered_root_links.length}
              </p>
            </div>
          </Card>

          <div className="bob-core-identity__grid">
            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Brand name</h3>
                <span className="bob-core-identity__meta">Editable</span>
              </div>
              <TextField
                label="Brand name"
                value={form.brand_name}
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, brand_name: event.target.value } : prev,
                  )
                }
              />
              <FieldMeta wrapper={snapshot.brand_name} />
            </Card>

            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Website URL</h3>
                <span className="bob-core-identity__meta">
                  Read-only (Checkpoint 1)
                </span>
              </div>
              <p className="bob-core-identity__value">
                {displayValue(snapshot.website_url.value)}
              </p>
              <FieldMeta wrapper={snapshot.website_url} />
            </Card>

            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Brand logo</h3>
                <span className="bob-core-identity__meta">Editable</span>
              </div>
              <div className="bob-dna-logo-row">
                <BrandImageAvatar
                  className="bob-dna-logo"
                  src={emptyToNull(form.brand_logo)}
                  label={brandName}
                  alt={`${brandName} logo`}
                  size={64}
                />
                <div>
                  <p className="bob-muted">
                    {form.brand_logo.trim()
                      ? "Logo from scan — upload to replace."
                      : "No logo from scan — upload one if you have it."}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isUploadingLogo || !brandProfileId}
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
              <FieldMeta wrapper={snapshot.brand_logo} />
            </Card>

            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Industry</h3>
                <span className="bob-core-identity__meta">Editable</span>
              </div>
              <label className="bob-core-identity__select-label">
                <span className="bob-core-identity__select-caption">Industry</span>
                <select
                  className="bob-core-identity__select"
                  value={form.industry}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev ? { ...prev, industry: event.target.value } : prev,
                    )
                  }
                >
                  {INDUSTRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <FieldMeta wrapper={snapshot.industry} />
            </Card>

            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Sub-industry</h3>
                <span className="bob-core-identity__meta">Editable</span>
              </div>
              <TextField
                label="Sub-industry"
                value={form.sub_industry}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, sub_industry: event.target.value }
                      : prev,
                  )
                }
              />
              <FieldMeta wrapper={snapshot.sub_industry} />
            </Card>

            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Country</h3>
                <span className="bob-core-identity__meta">
                  Read-only (Checkpoint 1)
                </span>
              </div>
              <p className="bob-core-identity__value">
                {displayValue(snapshot.country.value)}
              </p>
              <FieldMeta wrapper={snapshot.country} />
            </Card>

            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Reporting currency</h3>
                <span className="bob-core-identity__meta">
                  Read-only (Checkpoint 1)
                </span>
              </div>
              <p className="bob-core-identity__value">
                {displayValue(snapshot.reporting_currency.value)}
              </p>
              <FieldMeta wrapper={snapshot.reporting_currency} />
            </Card>

            <Card className="bob-core-identity__field">
              <div className="bob-core-identity__field-head">
                <h3>Tagline</h3>
                <span className="bob-core-identity__meta">Editable</span>
              </div>
              <TextField
                label="Tagline"
                value={form.tagline}
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, tagline: event.target.value } : prev,
                  )
                }
              />
              <FieldMeta wrapper={snapshot.tagline} />
            </Card>

            <Card className="bob-core-identity__field bob-core-identity__field--wide">
              <div className="bob-core-identity__field-head">
                <h3>Social handles</h3>
                <span className="bob-core-identity__meta">Editable</span>
              </div>
              <div className="bob-core-identity__social-grid">
                {(
                  [
                    "instagram",
                    "tiktok",
                    "facebook",
                    "youtube",
                    "linkedin",
                  ] as const
                ).map((key) => (
                  <TextField
                    key={key}
                    label={key}
                    value={form.social_handles[key] ?? ""}
                    onChange={(event) => updateSocial(key, event.target.value)}
                  />
                ))}
              </div>
              <FieldMeta wrapper={snapshot.social_handles} />
            </Card>
          </div>
        </>
      ) : null}

      {confirmOpen ? (
        <div
          className="bob-modal-backdrop"
          role="presentation"
          onClick={() => !isSaving && setConfirmOpen(false)}
        >
          <div
            className="bob-modal bob-modal--process"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bob-core-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bob-modal__mobile-handle" aria-hidden />
            <div className="bob-modal__header">
              <button
                type="button"
                className="bob-modal__close"
                aria-label="Close modal"
                disabled={isSaving}
                onClick={() => setConfirmOpen(false)}
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="bob-modal__body">
              <div className="bob-core-identity__confirm-icon" aria-hidden>
                <CheckCircle2 size={28} />
              </div>
              <h2 id="bob-core-confirm-title" className="bob-modal__title">
                Confirm core identity?
              </h2>
              <p className="bob-modal__description">
                This confirmation locks brand name, industry, sub-industry,
                logo, geography, and social handles as the authoritative
                identity for the rest of onboarding.
              </p>
              {confirmError ? (
                <Alert tone="warning" title="Confirm failed">
                  {confirmError}
                </Alert>
              ) : null}
              <div className="bob-modal__actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={() => setConfirmOpen(false)}
                >
                  Keep reviewing
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={isSaving}
                  onClick={() => void confirmIdentity()}
                >
                  {isSaving ? "Confirming…" : "Confirm identity"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
