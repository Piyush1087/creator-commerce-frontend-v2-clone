import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Info, X } from "lucide-react";

import { Alert, Button, Card } from "../../../design-system/aurora";

import { getCoreIdentitySnapshot } from "../api/brand-client";
import type {
  CoreIdentitySnapshot,
  CoreIdentitySnapshotResponse,
  UniversalFieldWrapper,
} from "../contracts/brand.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import { loadBrandOnboardingSession, saveBrandOnboardingSession } from "../session/onboarding-session";
import { BrandImageAvatar } from "./brand-image-avatar";

type LocationState = {
  url?: string;
  leadId?: string;
  brandProfileId?: string;
  scanMode?: "http" | "cached";
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "-";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "-";
}

function FieldCard({
  label,
  wrapper,
  valueOverride,
}: {
  label: string;
  wrapper: UniversalFieldWrapper<unknown> | null;
  valueOverride?: string;
}) {
  const value = valueOverride ?? displayValue(wrapper?.value);
  const confidence =
    typeof wrapper?.confidence === "number" ? `${wrapper.confidence}%` : "-";
  const source = wrapper?.source ? String(wrapper.source) : "-";
  const evidence =
    wrapper?.evidence?.[0]?.excerpt?.trim() ||
    wrapper?.evidence?.[0]?.page_type ||
    "-";

  return (
    <Card className="bob-core-identity__field">
      <div className="bob-core-identity__field-head">
        <h3>{label}</h3>
        <span className="bob-core-identity__meta">
          {source} · {confidence}
        </span>
      </div>
      <p className="bob-core-identity__value">{value}</p>
      <p className="bob-core-identity__evidence">
        <Info size={14} aria-hidden />
        <span>{evidence}</span>
      </p>
    </Card>
  );
}

function socialLines(
  handles: CoreIdentitySnapshot["social_handles"]["value"] | undefined,
): string {
  if (!handles) {
    return "-";
  }
  const lines = [
    handles.instagram ? `Instagram: ${handles.instagram}` : null,
    handles.tiktok ? `TikTok: ${handles.tiktok}` : null,
    handles.facebook ? `Facebook: ${handles.facebook}` : null,
    handles.youtube ? `YouTube: ${handles.youtube}` : null,
    handles.linkedin ? `LinkedIn: ${handles.linkedin}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : "-";
}

export function CoreIdentityReviewView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};
  const session = loadBrandOnboardingSession();

  const leadId = state.leadId ?? session?.leadId ?? "";
  const brandUrl =
    state.url ?? session?.normalizedUrl ?? "yourbrand.com";
  const scanMode = state.scanMode;

  const [payload, setPayload] = useState<CoreIdentitySnapshotResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  const brandName = snapshot?.brand_name.value?.trim() || brandUrl;
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

  const continueToDna = () => {
    if (!brandProfileId) {
      setLoadError(
        "Missing brand profile id. Re-run the surface scan from the landing page.",
      );
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(false);
    navigate(ONBOARDING_ROUTES.dna, {
      replace: true,
      state: {
        url: brandUrl,
        leadId,
        brandProfileId,
        scanMode: scanMode ?? "http",
        coreIdentityConfirmed: true,
      },
    });
  };

  return (
    <div className="bob-core-identity">
      <div className="bob-core-identity__header">
        <div>
          <p className="bob-core-identity__eyebrow">Temporary review UI</p>
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
            disabled={Boolean(loadError) || isLoading || !snapshot}
            onClick={() => setConfirmOpen(true)}
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

      {isLoading ? (
        <Card className="bob-core-identity__loading">
          <p>Fetching the validated Stage 1A snapshot…</p>
        </Card>
      ) : null}

      {snapshot ? (
        <>
          <Card className="bob-core-identity__hero">
            <BrandImageAvatar
              src={snapshot.brand_logo.value}
              label={brandName}
              size={88}
            />
            <div>
              <h2>{displayValue(snapshot.brand_name.value)}</h2>
              <p>{displayValue(snapshot.website_url.value)}</p>
              <p className="bob-core-identity__hero-meta">
                {displayValue(snapshot.industry.value)} ·{" "}
                {displayValue(snapshot.sub_industry.value)}
              </p>
              <p className="bob-core-identity__hero-meta">
                Links discovered: {snapshot.discovered_root_links.length}
              </p>
            </div>
          </Card>

          <div className="bob-core-identity__grid">
            <FieldCard label="Brand name" wrapper={snapshot.brand_name} />
            <FieldCard label="Website URL" wrapper={snapshot.website_url} />
            <FieldCard
              label="Brand logo"
              wrapper={snapshot.brand_logo}
              valueOverride={displayValue(snapshot.brand_logo.value)}
            />
            <FieldCard label="Industry" wrapper={snapshot.industry} />
            <FieldCard label="Sub-industry" wrapper={snapshot.sub_industry} />
            <FieldCard label="Country" wrapper={snapshot.country} />
            <FieldCard
              label="Reporting currency"
              wrapper={snapshot.reporting_currency}
            />
            <FieldCard label="Tagline" wrapper={snapshot.tagline} />
            <FieldCard
              label="Social handles"
              wrapper={snapshot.social_handles}
              valueOverride={socialLines(snapshot.social_handles.value)}
            />
            <FieldCard
              label="Discovered root links"
              wrapper={null}
              valueOverride={
                snapshot.discovered_root_links.length > 0
                  ? snapshot.discovered_root_links.slice(0, 12).join("\n")
                  : "-"
              }
            />
          </div>
        </>
      ) : null}

      {confirmOpen ? (
        <div
          className="bob-modal-backdrop"
          role="presentation"
          onClick={() => setConfirmOpen(false)}
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
              <div className="bob-modal__actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmOpen(false)}
                >
                  Keep reviewing
                </Button>
                <Button type="button" variant="primary" onClick={continueToDna}>
                  Confirm identity
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
