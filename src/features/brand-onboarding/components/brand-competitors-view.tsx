import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Pencil, Plus, Undo2, Upload, X } from "lucide-react";

import { Alert, Button, Card, TextField } from "../../../design-system/aurora";

import {
  getBrandProfile,
  syncBrandCompetitors,
  uploadCompetitorLogo,
} from "../api/brand-client";
import { uploadErrorMessage } from "../api/http-api-error";
import { BrandImageAvatar } from "./brand-image-avatar";
import { ONBOARDING_ROUTES } from "../constants";
import type { BrandProfileResponseBody } from "../contracts/brand.contracts";
import {
  mapCompetitorRowsToSync,
  mapCompetitorsToRows,
  parseHostnameFromUrl,
} from "../mappers/map-brand-profile";
import { competitorEditSchema, zodFirstError } from "../schemas/brand-dna-schema";
import { loadBrandOnboardingSession } from "../session/onboarding-session";
import { fileToBase64 } from "../utils/image-upload";
import type { CompetitorRow } from "../types";

export function BrandCompetitorsView() {
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<BrandProfileResponseBody | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [activeId, setActiveId] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CompetitorRow | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [narrative, setNarrative] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<CompetitorRow | null>(null);
  const [logoUploadTargetId, setLogoUploadTargetId] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  useEffect(() => {
    const session = loadBrandOnboardingSession();
    if (!session) {
      setLoadError("Missing onboarding session. Go back and run a scan.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getBrandProfile(session.brandProfileId)
      .then((p) => {
        setProfile(p);
        const rows = mapCompetitorsToRows(p.competitors);
        setCompetitors(rows);
        setActiveId(rows[0]?.id ?? "");
        setLoadError(null);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Unable to load competitor data.";
        setLoadError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const active = useMemo(
    () => competitors.find((row) => row.id === activeId) ?? competitors[0],
    [activeId, competitors],
  );

  const rootDomain = useMemo(() => {
    const session = loadBrandOnboardingSession();
    const host = session ? parseHostnameFromUrl(session.normalizedUrl) : "";
    return host.length > 0 ? host : profile?.domain ?? "your-domain.com";
  }, [profile?.domain]);

  const persistCompetitors = async (rows: CompetitorRow[]) => {
    const session = loadBrandOnboardingSession();
    if (!session) {
      setError("Missing onboarding session.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const updated = await syncBrandCompetitors(
        session.brandProfileId,
        mapCompetitorRowsToSync(rows),
      );
      setProfile(updated);
      const mapped = mapCompetitorsToRows(updated.competitors);
      setCompetitors(mapped);
      setActiveId((current) =>
        mapped.some((row) => row.id === current) ? current : mapped[0]?.id ?? "",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save competitor changes.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const openAdd = () => {
    setModalError(null);
    setError(null);
    setAdding(true);
  };

  const closeAdd = () => {
    setAdding(false);
    setModalError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setModalError(null);
  };

  const addCompetitor = async () => {
    setModalError(null);
    const parsed = competitorEditSchema.safeParse({
      name: newName.trim(),
      websiteUrl: newUrl.trim(),
      whyCompetitor: narrative,
    });
    if (!parsed.success) {
      setModalError(zodFirstError(parsed.error));
      return;
    }
    const next: CompetitorRow = {
      id: `manual-${Date.now()}`,
      name: parsed.data.name,
      url: parsed.data.websiteUrl,
      handles: {},
      narrative: parsed.data.whyCompetitor,
    };
    const merged = [next, ...competitors];
    setCompetitors(merged);
    setActiveId(next.id);
    closeAdd();
    setNewUrl("");
    setNewName("");
    setNarrative("");
    await persistCompetitors(merged);
  };

  const saveEdit = async () => {
    if (!editing) {
      return;
    }
    setModalError(null);
    const parsed = competitorEditSchema.safeParse({
      name: editing.name,
      websiteUrl: editing.url,
      whyCompetitor: editing.narrative,
      logoUrl: editing.logo?.trim() ? editing.logo : null,
    });
    if (!parsed.success) {
      setModalError(zodFirstError(parsed.error));
      return;
    }
    const merged = competitors.map((row) =>
      row.id === editing.id
        ? {
            ...editing,
            name: parsed.data.name,
            url: parsed.data.websiteUrl,
            narrative: parsed.data.whyCompetitor,
          }
        : row,
    );
    setCompetitors(merged);
    closeEdit();
    await persistCompetitors(merged);
  };

  const handleContinue = () => {
    if (competitors.length === 0) {
      setError("Add at least 1 competitor before continuing.");
      return;
    }
    setError(null);
    navigate(ONBOARDING_ROUTES.verification);
  };

  const handleLogoUpload = async (
    competitorId: string,
    file: File | undefined,
  ) => {
    const session = loadBrandOnboardingSession();
    if (!session || !file) {
      return;
    }
    setIsUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const base64 = await fileToBase64(file);
      const uploaded = await uploadCompetitorLogo(
        session.brandProfileId,
        competitorId,
        {
          imageBase64: base64,
          contentType: file.type || "image/jpeg",
        },
      );
      const merged = competitors.map((row) =>
        row.id === competitorId ? { ...row, logo: uploaded.imageUrl } : row,
      );
      setCompetitors(merged);
      if (editing?.id === competitorId) {
        setEditing({ ...editing, logo: uploaded.imageUrl });
      }
    } catch (err) {
      setLogoUploadError(uploadErrorMessage(err));
    } finally {
      setIsUploadingLogo(false);
      setLogoUploadTargetId(null);
    }
  };

  const removeCompetitor = async (row: CompetitorRow) => {
    const next = competitors.filter((item) => item.id !== row.id);
    setCompetitors(next);
    setActiveId((current) => (current === row.id ? next[0]?.id ?? "" : current));
    setRemoved(row);
    await persistCompetitors(next);
  };

  return (
    <div className="bob-funnel-page bob-container">
      <div className="bob-funnel-page__header">
        <div>
          <h1 className="aurora-card__title" style={{ fontSize: "var(--size-h1)" }}>
            Competitor intelligence
          </h1>
          <p className="bob-muted">
            {isLoading
              ? "Loading competitors from your latest scan…"
              : `Root brand domain: ${rootDomain}`}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {loadError ? (
        <Alert title="Couldn’t load competitors" tone="error">
          {loadError}
        </Alert>
      ) : null}

      <div className="bob-inline" style={{ marginBottom: 16 }}>
        <Button type="button" variant="primary" onClick={openAdd}>
          <Plus size={16} aria-hidden /> Add competitor
        </Button>
        <p className="bob-muted" style={{ margin: 0 }}>
          {profile?.name ? `Brand: ${profile.name}` : null}
          {isSaving ? " • Saving…" : null}
        </p>
      </div>

      {!isLoading && !loadError && competitors.length === 0 ? (
        <Alert title="No competitors yet" tone="warning">
          Add at least 1 competitor before continuing.
        </Alert>
      ) : null}

      {error ? (
        <Alert title="Competitor validation" tone="error">
          {error}
        </Alert>
      ) : null}
      {removed ? (
        <Alert title="Competitor removed" tone="warning">
          <button
            className="bob-link-button"
            type="button"
            onClick={() => {
              void (async () => {
                const merged = [removed, ...competitors];
                setCompetitors(merged);
                setActiveId(removed.id);
                setRemoved(null);
                await persistCompetitors(merged);
              })();
            }}
          >
            <Undo2 size={14} aria-hidden /> Undo remove
          </button>
        </Alert>
      ) : null}

      <div className="bob-competitor-layout">
        <div className="bob-stack">
          {competitors.map((row) => (
            <button
              key={row.id}
              type="button"
              className={
                row.id === activeId
                  ? "bob-competitor-pill bob-competitor-pill--active"
                  : "bob-competitor-pill"
              }
              onClick={() => setActiveId(row.id)}
            >
              <BrandImageAvatar
                className="bob-competitor-pill__avatar"
                src={row.logo}
                label={row.name}
                size={44}
              />
              <span>{row.name}</span>
            </button>
          ))}
        </div>

        {active ? (
          <Card title={active.name} eyebrow="Competitor landscape">
            <p className="bob-muted" style={{ marginBottom: 8 }}>
              {active.url}
            </p>
            <p style={{ lineHeight: 1.6 }}>{active.narrative}</p>
            <div className="bob-inline" style={{ marginTop: 12 }}>
              {active.handles.instagram ? (
                <span className="aurora-badge aurora-badge--selected">
                  @{active.handles.instagram}
                </span>
              ) : null}
              {active.handles.tiktok ? (
                <span className="aurora-badge aurora-badge--pending">
                  TikTok: {active.handles.tiktok}
                </span>
              ) : null}
            </div>
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.open(active.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink size={14} aria-hidden /> Visit
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalError(null);
                  setEditing(active);
                }}
              >
                <Pencil size={14} aria-hidden /> Edit
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={() => void removeCompetitor(active)}
              >
                Remove
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="bob-inline" style={{ marginTop: 24 }}>
        <Button
          type="button"
          variant="primary"
          disabled={
            isSaving ||
            isLoading ||
            Boolean(loadError) ||
            competitors.length === 0
          }
          onClick={handleContinue}
        >
          Continue to verification
        </Button>
      </div>

      {adding ? (
        <div className="bob-modal-backdrop" role="presentation">
          <div className="bob-small-dialog" role="dialog" aria-modal="true">
            <div className="bob-funnel-page__header">
              <h2 className="aurora-card__title">Add competitor</h2>
              <button
                type="button"
                className="bob-icon-button"
                aria-label="Close add competitor"
                onClick={closeAdd}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <TextField
              label="Competitor name"
              value={newName}
              placeholder="Competitor brand"
              onChange={(event) => {
                setNewName(event.target.value);
                setModalError(null);
              }}
            />
            <TextField
              label="Competitor website"
              value={newUrl}
              placeholder="https://competitor.com"
              onChange={(event) => {
                setNewUrl(event.target.value);
                setModalError(null);
              }}
            />
            <TextField
              label="Why they compete (40–300 chars)"
              multiline
              rows={4}
              value={narrative}
              onChange={(event) => {
                setNarrative(event.target.value);
                setModalError(null);
              }}
            />
            {modalError ? (
              <p className="bob-upload-error" role="alert">
                {modalError}
              </p>
            ) : null}
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button
                type="button"
                variant="primary"
                disabled={isSaving}
                onClick={() => void addCompetitor()}
              >
                Save competitor
              </Button>
              <Button type="button" variant="secondary" onClick={closeAdd}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="bob-modal-backdrop" role="presentation">
          <div className="bob-small-dialog" role="dialog" aria-modal="true">
            <div className="bob-funnel-page__header">
              <h2 className="aurora-card__title">Edit competitor</h2>
              <button
                type="button"
                className="bob-icon-button"
                aria-label="Close edit competitor"
                onClick={closeEdit}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <TextField
              label="Competitor name"
              value={editing.name}
              onChange={(event) => {
                setEditing({ ...editing, name: event.target.value });
                setModalError(null);
              }}
            />
            <TextField
              label="Competitor website"
              value={editing.url}
              onChange={(event) => {
                setEditing({ ...editing, url: event.target.value });
                setModalError(null);
              }}
            />
            <TextField
              label="Why they compete (40–300 chars)"
              multiline
              rows={4}
              value={editing.narrative}
              onChange={(event) => {
                setEditing({ ...editing, narrative: event.target.value });
                setModalError(null);
              }}
            />
            <div className="bob-inline" style={{ marginTop: 12, alignItems: "center" }}>
              <BrandImageAvatar
                className="bob-competitor-pill__avatar"
                src={editing.logo}
                label={editing.name}
                size={44}
              />
              <Button
                type="button"
                variant="ghost"
                disabled={isUploadingLogo}
                onClick={() => {
                  setLogoUploadTargetId(editing.id);
                  setLogoUploadError(null);
                  logoInputRef.current?.click();
                }}
              >
                <Upload size={14} aria-hidden />{" "}
                {isUploadingLogo ? "Uploading…" : "Upload logo"}
              </Button>
            </div>
            {logoUploadError ? (
              <p className="bob-upload-error" role="alert">
                {logoUploadError}
              </p>
            ) : null}
            {modalError ? (
              <p className="bob-upload-error" role="alert">
                {modalError}
              </p>
            ) : null}
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button
                type="button"
                variant="primary"
                disabled={isSaving}
                onClick={() => void saveEdit()}
              >
                Save changes
              </Button>
              <Button type="button" variant="secondary" onClick={closeEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (logoUploadTargetId) {
            void handleLogoUpload(logoUploadTargetId, file);
          }
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
