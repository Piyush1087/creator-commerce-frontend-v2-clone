import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Button, Card } from "../../../design-system/aurora";
import { stageCreatorFeatures } from "../api/creator-onboarding-client";
import { CREATOR_ONBOARDING_ROUTES } from "../constants";
import { CREATOR_MODULE_OPTIONS } from "../mock-data/onboarding-mock";
import { mapUiModulesToApi } from "../utils/module-map";
import { getOnboardingTrackId } from "../utils/onboarding-session";

import "../creator-onboarding.css";

export function CreatorModulesSelectionView() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(["media_kit", "brand_deals"]),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = selected.size === CREATOR_MODULE_OPTIONS.length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(CREATOR_MODULE_OPTIONS.map((m) => m.id)));
  };

  const selectedLabels = useMemo(
    () => CREATOR_MODULE_OPTIONS.filter((m) => selected.has(m.id)).map((m) => m.id),
    [selected],
  );

  const onContinue = async () => {
    const trackId = getOnboardingTrackId();
    if (!trackId) {
      navigate(CREATOR_ONBOARDING_ROUTES.landing);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await stageCreatorFeatures(trackId, mapUiModulesToApi(selectedLabels));
      navigate(CREATOR_ONBOARDING_ROUTES.signup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save module selection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cob-page" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <Card className="cob-modal-panel">
        <h1 style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px" }}>
          Founding Creator Setup
        </h1>
        <p className="cob-muted">Let&apos;s personalize your workspace.</p>

        <div className="cob-module-grid" role="group" aria-label="Workspace modules">
          {CREATOR_MODULE_OPTIONS.map((module) => {
            const isSelected = selected.has(module.id);
            return (
              <button
                key={module.id}
                type="button"
                className={`cob-module-card${isSelected ? " cob-module-card--selected" : ""}`}
                onClick={() => toggle(module.id)}
                aria-pressed={isSelected}
              >
                <span className="cob-module-card__icon" aria-hidden>
                  {module.icon}
                </span>
                <span>
                  <strong>{module.title}</strong>
                  <p className="cob-muted" style={{ margin: "4px 0 0" }}>
                    {module.description}
                  </p>
                </span>
              </button>
            );
          })}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          <span>Select everything</span>
        </label>

        {error ? (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="error" title="Module staging">
              {error}
            </Alert>
          </div>
        ) : null}

        <div className="cob-form-actions">
          <Button
            variant="primary"
            onClick={() => void onContinue()}
            disabled={selected.size === 0 || loading}
          >
            {loading ? "Saving…" : "Build My Workspace →"}
          </Button>
          <Button variant="ghost" onClick={() => navigate(CREATOR_ONBOARDING_ROUTES.signup)}>
            Skip for now
          </Button>
        </div>
        <p className="cob-muted" style={{ marginTop: 16, fontSize: 12 }}>
          Your Instagram account won&apos;t be modified.
        </p>
      </Card>
    </div>
  );
}
