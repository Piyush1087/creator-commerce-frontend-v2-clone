import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Globe, Plus, Undo2, X } from "lucide-react";

import { Alert, Button, Card, TextField } from "../../../design-system/aurora";

import { COMPETITORS_ROOT_DOMAIN, INITIAL_COMPETITORS } from "../mock-data/competitors-mock";
import type { CompetitorRow } from "../types";

export function BrandCompetitorsView() {
  const navigate = useNavigate();
  const [competitors, setCompetitors] = useState<CompetitorRow[]>(INITIAL_COMPETITORS);
  const [activeId, setActiveId] = useState(INITIAL_COMPETITORS[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [narrative, setNarrative] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<CompetitorRow | null>(null);
  const active = competitors.find((row) => row.id === activeId) ?? competitors[0];

  const addCompetitor = () => {
    setError(null);
    try {
      const url = new URL(newUrl);
      const blacklist = [
        "google.com",
        "facebook.com",
        "amazon.com",
        "youtube.com",
        "instagram.com",
        "tiktok.com",
      ];
      const host = url.hostname.replace(/^www\./, "");
      if (blacklist.includes(host)) {
        setError("Please provide a direct brand website rather than a marketplace or social platform.");
        return;
      }
      if (narrative.trim().length < 60) {
        setError("Why narrative must be at least 60 characters for strategic value.");
        return;
      }
      const next: CompetitorRow = {
        id: `manual-${Date.now()}`,
        name: host.split(".")[0] ?? "New competitor",
        url: newUrl,
        handles: {},
        narrative,
      };
      setCompetitors((prev) => [next, ...prev]);
      setActiveId(next.id);
      setAdding(false);
      setNewUrl("");
      setNarrative("");
    } catch {
      setError("Enter a valid competitor URL.");
    }
  };

  const removeCompetitor = (row: CompetitorRow) => {
    setCompetitors((prev) => prev.filter((item) => item.id !== row.id));
    setRemoved(row);
    setActiveId((prev) => (prev === row.id ? competitors[0]?.id ?? "" : prev));
  };

  return (
    <div className="bob-funnel-page bob-container">
      <div className="bob-funnel-page__header">
        <div>
          <h1 className="aurora-card__title" style={{ fontSize: "var(--size-h1)" }}>
            Competitor intelligence
          </h1>
          <p className="bob-muted">
            Mock competitors for <strong>{COMPETITORS_ROOT_DOMAIN}</strong>. Add
            flows can be layered after backend contracts land.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="bob-inline" style={{ marginBottom: 16 }}>
        <Button type="button" variant="primary" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden /> Add competitor
        </Button>
        <p className="bob-muted" style={{ margin: 0 }}>
          Root brand: {COMPETITORS_ROOT_DOMAIN}
        </p>
      </div>

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
              setCompetitors((prev) => [removed, ...prev]);
              setActiveId(removed.id);
              setRemoved(null);
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
              {row.logo ? <img src={row.logo} alt="" /> : <Globe size={22} />}
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
              <Button type="button" variant="ghost">
                <ExternalLink size={14} aria-hidden /> Visit
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => removeCompetitor(active)}
              >
                Remove
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="bob-inline" style={{ marginTop: 24 }}>
        <Button type="button" variant="primary" onClick={() => navigate("/")}>
          Finish onboarding preview
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
                onClick={() => setAdding(false)}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="bob-stack">
              <TextField
                label="Competitor website"
                value={newUrl}
                placeholder="https://competitor.com"
                onChange={(event) => setNewUrl(event.target.value)}
              />
              <TextField
                label="Why this competitor matters"
                multiline
                rows={4}
                value={narrative}
                onChange={(event) => setNarrative(event.target.value)}
              />
            </div>
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button type="button" variant="primary" onClick={addCompetitor}>
                Add competitor
              </Button>
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
