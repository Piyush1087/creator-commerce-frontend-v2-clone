import { useEffect, useState } from "react";

import { Alert, Badge, Button, Card, SelectField, TextField } from "../../../design-system/aurora";
import type { DesignTheme } from "../contracts/creator-centre.contracts";
import { useMediaKit } from "../hooks/use-creator-centre";
import {
  displayValue,
  formatCurrencyUsd,
  formatPercent,
  formatReach,
} from "../utils/display-value";

import "../creator-centre.css";

const THEME_OPTIONS: { value: DesignTheme; label: string }[] = [
  { value: "MINIMAL_STARK", label: "Minimal Stark" },
  { value: "EDITORIAL_LUXE", label: "Editorial Luxe" },
  { value: "CYBER_TECH", label: "Cyber Tech" },
  { value: "VIBRANT_KINETIC", label: "Vibrant Kinetic" },
  { value: "PASTEL_MINIMAL", label: "Pastel Minimal" },
];

const CHECKLIST_LABELS = [
  "Instagram Connected",
  "Portfolio Added",
  "Audience Insights Synced",
  "Pricing Available",
  "Add Testimonials",
] as const;

export function MediaKitWorkspace() {
  const { mediaKit, loading, saving, error, save } = useMediaKit();
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [storyRate, setStoryRate] = useState("");
  const [theme, setTheme] = useState<DesignTheme>("MINIMAL_STARK");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaKit) return;
    setBio(mediaKit.customBioOverride ?? mediaKit.aiGeneratedTagline ?? "");
    setRate(
      mediaKit.rates?.shortFormVideoRate !== undefined
        ? String(mediaKit.rates.shortFormVideoRate)
        : "",
    );
    setStoryRate(
      mediaKit.rates?.storyBundleRate !== undefined
        ? String(mediaKit.rates.storyBundleRate)
        : "",
    );
    setTheme(mediaKit.activeTheme);
  }, [mediaKit]);

  const handleSave = async () => {
    setSaveMessage(null);
    await save({
      customBioOverride: bio.trim() || null,
      activeTheme: theme,
      showTotalReach: mediaKit?.visibility.showTotalReach ?? true,
      showEngagementRate: mediaKit?.visibility.showEngagementRate ?? true,
      showViewsMetric: mediaKit?.visibility.showViewsMetric ?? true,
      showRatesColumn: mediaKit?.visibility.showRatesColumn ?? true,
      shortFormVideoRate: Number(rate) || 0,
      storyBundleRate: Number(storyRate) || 0,
      pastBrandLogos: mediaKit?.pastBrandLogos ?? [],
    });
    setSaveMessage("Profile saved.");
  };

  const copyLink = async () => {
    if (!mediaKit?.publicLink) return;
    await navigator.clipboard.writeText(mediaKit.publicLink);
    setSaveMessage("Link copied.");
  };

  return (
    <div className="cctr-workspace">
      <div className="cctr-page-header">
        <div>
          <p className="cctr-sub" style={{ margin: 0 }}>
            Live Media Kit
          </p>
          <h1>{displayValue(mediaKit?.displayName)}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="outline" size="sm" onClick={() => void copyLink()} disabled={!mediaKit?.publicLink}>
            Copy Profile Link
          </Button>
          <Button variant="primary" size="sm" disabled>
            Preview Profile
          </Button>
        </div>
      </div>

      {error ? (
        <Alert tone="error" title="Could not load media kit">
          {error}
        </Alert>
      ) : null}
      {saveMessage ? (
        <Alert tone="success" title="Media kit">
          {saveMessage}
        </Alert>
      ) : null}
      {loading ? <p className="cctr-sub">Loading media kit…</p> : null}

      <div className="cctr-health">
        <div>
          <span className="cctr-sub">Profile Health</span>
          <p className="cctr-health__score">
            -
            <span style={{ fontSize: 18, color: "var(--text-muted)" }}> / 100</span>
          </p>
        </div>
        <ul className="cctr-checklist">
          {CHECKLIST_LABELS.map((label) => (
            <li key={label} data-done={false}>
              ○ {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="cctr-split cctr-split--media-kit">
        <div>
          <section className="cctr-form-section">
            <h2>Bio</h2>
            <TextField
              label="Custom bio"
              multiline
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <Button variant="ghost" size="sm" style={{ marginTop: 8 }} disabled>
              Improve with AI
            </Button>
          </section>

          <section className="cctr-form-section">
            <h2>Rates & category</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TextField
                label="Short-form video rate (USD)"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
              <TextField
                label="Story bundle rate (USD)"
                type="number"
                value={storyRate}
                onChange={(e) => setStoryRate(e.target.value)}
              />
              <SelectField
                label="Primary category"
                value="-"
                disabled
                onChange={() => undefined}
                options={[{ value: "-", label: "-" }]}
              />
              <SelectField
                label="Active theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as DesignTheme)}
                options={THEME_OPTIONS}
              />
            </div>
            <Button
              variant="primary"
              style={{ marginTop: 16 }}
              onClick={() => void handleSave()}
              disabled={saving || loading}
            >
              {saving ? "Saving…" : "Save Profile Changes"}
            </Button>
          </section>

          <section className="cctr-form-section">
            <h2>Niche tags</h2>
            <div className="cctr-tag-row">
              <Badge tone="neutral">-</Badge>
            </div>
          </section>
        </div>

        <Card className="cctr-preview-phone">
          <p className="cctr-sub" style={{ margin: 0 }}>
            Live preview
          </p>
          <h3>{displayValue(mediaKit?.displayName)}</h3>
          <p className="cctr-sub">{displayValue(mediaKit?.aiGeneratedTagline)}</p>
          <p style={{ margin: "12px 0", fontSize: 14 }}>{displayValue(bio)}</p>
          <div className="cctr-tag-row">
            <Badge tone="success">
              {formatReach(mediaKit?.cachedMetrics.totalReach ?? null)} reach
            </Badge>
            <Badge tone="success">
              {formatPercent(mediaKit?.cachedMetrics.engagementRate ?? null)} ER
            </Badge>
            <Badge tone="neutral">{displayValue(mediaKit?.cachedMetrics.topLocation)}</Badge>
          </div>
          <p style={{ marginTop: 16, fontWeight: 700 }}>
            From {formatCurrencyUsd(Number(rate) || null)} / short-form video
          </p>
          <div className="cctr-portfolio-grid">
            {(mediaKit?.pastBrandLogos.length ? mediaKit.pastBrandLogos : ["-"]).map(
              (item) => (
                <div key={item} className="cctr-portfolio-tile">
                  {item === "-" ? "-" : "Logo"}
                </div>
              ),
            )}
          </div>
          <Button variant="primary" size="sm" style={{ marginTop: 16, width: "100%" }} disabled>
            Work with Me
          </Button>
        </Card>
      </div>
    </div>
  );
}
