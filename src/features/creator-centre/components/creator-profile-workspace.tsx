import { useEffect, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  SelectField,
  TextField,
  Toggle,
} from "../../../design-system/aurora";
import type { DesignTheme } from "../contracts/creator-centre.contracts";
import { useMediaKit } from "../hooks/use-creator-centre";
import { MOCK_CREATOR_PROFILE, MOCK_MEDIA_KIT } from "../mock-data/centre-mock";
import { formatPercent, formatReach } from "../utils/display-value";

import "../creator-centre.css";

const THEME_OPTIONS: { value: DesignTheme; label: string }[] = [
  { value: "MINIMAL_STARK", label: "Minimal Stark" },
  { value: "EDITORIAL_LUXE", label: "Editorial Luxe" },
  { value: "CYBER_TECH", label: "Cyber Tech" },
  { value: "VIBRANT_KINETIC", label: "Vibrant Kinetic" },
  { value: "PASTEL_MINIMAL", label: "Pastel Minimal" },
];

/**
 * Creator Profile — Master Spec sections 1–12 (UI).
 * Wired: GET/PATCH media-kit for bio, theme, reel/story rates, visibility flags, logos.
 */
export function CreatorProfileWorkspace() {
  const { mediaKit, loading, saving, error, save } = useMediaKit();
  const mock = MOCK_MEDIA_KIT;
  const [bio, setBio] = useState(mock.bio);
  const [rate, setRate] = useState(String(mock.rates.reel.replace(/,/g, "")));
  const [storyRate, setStoryRate] = useState(
    String(mock.rates.story.replace(/,/g, "")),
  );
  const [carouselRate] = useState(mock.rates.carousel);
  const [bundleRate] = useState(mock.rates.bundle);
  const [theme, setTheme] = useState<DesignTheme>("MINIMAL_STARK");
  const [showTotalReach, setShowTotalReach] = useState(true);
  const [showEngagementRate, setShowEngagementRate] = useState(true);
  const [showViewsMetric, setShowViewsMetric] = useState(true);
  const [showSaves, setShowSaves] = useState(true);
  const [showResponseRate, setShowResponseRate] = useState(true);
  const [showRepeat, setShowRepeat] = useState(true);
  const [showRatesColumn, setShowRatesColumn] = useState(true);
  const [visibility, setVisibility] = useState<(typeof mock.visibilityOptions)[number]>(
    "Public",
  );
  const [accepting, setAccepting] = useState(
    () => Object.fromEntries(mock.acceptingTypes.map((t) => [t.id, t.on])),
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaKit) return;
    setBio(
      mediaKit.customBioOverride ?? mediaKit.aiGeneratedTagline ?? mock.bio,
    );
    setRate(
      mediaKit.rates?.shortFormVideoRate
        ? String(mediaKit.rates.shortFormVideoRate)
        : String(mock.rates.reel.replace(/,/g, "")),
    );
    setStoryRate(
      mediaKit.rates?.storyBundleRate
        ? String(mediaKit.rates.storyBundleRate)
        : String(mock.rates.story.replace(/,/g, "")),
    );
    setTheme(mediaKit.activeTheme);
    setShowTotalReach(mediaKit.visibility.showTotalReach);
    setShowEngagementRate(mediaKit.visibility.showEngagementRate);
    setShowViewsMetric(mediaKit.visibility.showViewsMetric);
    setShowRatesColumn(mediaKit.visibility.showRatesColumn);
  }, [mediaKit, mock.bio, mock.rates.reel, mock.rates.story]);

  const handleSave = async () => {
    setSaveMessage(null);
    await save({
      customBioOverride: bio.trim() || null,
      activeTheme: theme,
      showTotalReach,
      showEngagementRate,
      showViewsMetric,
      showRatesColumn,
      shortFormVideoRate: Number(rate) || 0,
      storyBundleRate: Number(storyRate) || 0,
      pastBrandLogos: mediaKit?.pastBrandLogos?.length
        ? mediaKit.pastBrandLogos
        : mock.brandLogos,
    });
    setSaveMessage("Profile saved.");
  };

  const copyLink = async () => {
    if (!mediaKit?.publicLink) {
      setSaveMessage(
        "Public link will be available once your profile slug is live.",
      );
      return;
    }
    const absolute = mediaKit.publicLink.startsWith("http")
      ? mediaKit.publicLink
      : `${window.location.origin}${mediaKit.publicLink}`;
    await navigator.clipboard.writeText(absolute);
    setSaveMessage("Profile link copied.");
  };

  const displayName =
    mediaKit?.displayName?.trim() || MOCK_CREATOR_PROFILE.displayName;
  const handle = mediaKit?.instagramHandle
    ? `@${mediaKit.instagramHandle.replace(/^@/, "")}`
    : MOCK_CREATOR_PROFILE.handle;
  const reachLabel = mediaKit?.cachedMetrics.totalReach
    ? formatReach(mediaKit.cachedMetrics.totalReach)
    : mock.totalReach;
  const erLabel = mediaKit?.cachedMetrics.engagementRate
    ? formatPercent(mediaKit.cachedMetrics.engagementRate)
    : mock.engagementRate;
  const logos = mediaKit?.pastBrandLogos?.length
    ? mediaKit.pastBrandLogos
    : mock.brandLogos;

  return (
    <div className="cctr-workspace cctr-profile cctr-canvas">
      <p className="cctr-demo-chip">
        Stitch · Final Completion · Master Spec UI
      </p>
      <div className="cctr-profile__inner">
        {/* 1. Title strip */}
        <div className="cctr-page-header">
          <div>
            <div className="cctr-profile-title-row">
              <h1>
                <span aria-hidden="true">👤 </span>
                Creator Profile
              </h1>
              <Badge tone="success">Live</Badge>
            </div>
            <p className="cctr-sub" style={{ marginBottom: 0 }}>
              This is the profile brands see when deciding whether to work with
              you.
            </p>
          </div>
          <div className="cctr-profile-actions">
            <Button variant="outline" size="sm" onClick={() => void copyLink()}>
              Copy Profile Link
            </Button>
            <Button variant="primary" size="sm" disabled>
              Preview Profile →
            </Button>
          </div>
        </div>

        {error ? (
          <Alert tone="error" title="Could not load profile">
            {error}
          </Alert>
        ) : null}
        {saveMessage ? (
          <Alert tone="success" title="Creator Profile">
            {saveMessage}
          </Alert>
        ) : null}
        {loading ? <p className="cctr-sub">Loading profile…</p> : null}

        {/* 2. Health */}
        <Card className="cctr-health">
          <div className="cctr-health__main">
            <span className="cctr-sub">Creator Profile Score</span>
            <p className="cctr-health__score">
              {mock.healthScore}
              <span className="cctr-health__denom"> / 100</span>
            </p>
            <Badge tone="success">Excellent</Badge>
            <p className="cctr-sub" style={{ margin: "8px 0 0" }}>
              {mock.healthLabel}
            </p>
            <div className="cctr-meter" style={{ marginTop: 12 }}>
              <div
                className="cctr-meter__fill"
                style={{ width: `${mock.healthScore}%` }}
              />
            </div>
          </div>
          <ul className="cctr-checklist">
            {mock.checklist.map((item) => (
              <li key={item.label} data-done={item.done ? "true" : "false"}>
                {item.done ? "✅" : "⬜"} {item.label}
              </li>
            ))}
          </ul>
        </Card>

        {/* 3. Editor | Preview */}
        <div className="cctr-split cctr-split--media-kit">
          <div className="cctr-profile-editor">
            {/* 4. Bio */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Bio</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Tell brands who you are and why they should work with you.
                </p>
              </div>
              <TextField
                label="Profile bio"
                multiline
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <div className="cctr-inline-actions">
                <Button variant="ghost" size="sm" disabled>
                  Improve with AI
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Edit
                </Button>
              </div>
            </section>

            {/* 5. Niche */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Your Niche</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Categories help brands find the right fit.
                </p>
              </div>
              <div className="cctr-tag-row">
                {mock.niches.map((label) => (
                  <Chip key={label} tone="selected">
                    {label}
                  </Chip>
                ))}
              </div>
              <Button variant="ghost" size="sm" disabled>
                Edit Categories
              </Button>
            </section>

            {/* 6. Featured */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Featured Content</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Highlight the content you&apos;re most proud of (up to 6).
                </p>
              </div>
              <div className="cctr-portfolio-grid">
                {mock.portfolio.map((title) => (
                  <div key={title} className="cctr-portfolio-tile">
                    <span className="cctr-portfolio-tile__pin" aria-hidden>
                      📌
                    </span>
                    {title}
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" disabled>
                Manage Portfolio →
              </Button>
            </section>

            {/* 7. Why brands */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Why Brands Choose You</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  The most important numbers brands care about.
                </p>
              </div>
              <div className="cctr-metric-cards">
                <div className="cctr-metric-card">
                  <span aria-hidden>👥</span>
                  <div>
                    <strong>{mock.followers}</strong>
                    <span>Followers</span>
                  </div>
                  <Toggle
                    label="Show"
                    checked={showTotalReach}
                    onChange={setShowTotalReach}
                  />
                </div>
                <div className="cctr-metric-card">
                  <span aria-hidden>📈</span>
                  <div>
                    <strong>{erLabel}</strong>
                    <span>Engagement</span>
                  </div>
                  <Toggle
                    label="Show"
                    checked={showEngagementRate}
                    onChange={setShowEngagementRate}
                  />
                </div>
                <div className="cctr-metric-card">
                  <span aria-hidden>🎥</span>
                  <div>
                    <strong>{mock.avgReelViews}</strong>
                    <span>Avg Reel Views</span>
                  </div>
                  <Toggle
                    label="Show"
                    checked={showViewsMetric}
                    onChange={setShowViewsMetric}
                  />
                </div>
                <div className="cctr-metric-card">
                  <span aria-hidden>❤️</span>
                  <div>
                    <strong>{mock.avgSaves}</strong>
                    <span>Avg Saves</span>
                  </div>
                  <Toggle
                    label="Show"
                    checked={showSaves}
                    onChange={setShowSaves}
                  />
                </div>
                <div className="cctr-metric-card">
                  <span aria-hidden>💬</span>
                  <div>
                    <strong>{mock.responseRate}</strong>
                    <span>Response Rate</span>
                  </div>
                  <Toggle
                    label="Show"
                    checked={showResponseRate}
                    onChange={setShowResponseRate}
                  />
                </div>
                <div className="cctr-metric-card">
                  <span aria-hidden>✨</span>
                  <div>
                    <strong>{mock.repeatCollabs}</strong>
                    <span>Repeat Collabs</span>
                  </div>
                  <Toggle
                    label="Show"
                    checked={showRepeat}
                    onChange={setShowRepeat}
                  />
                </div>
              </div>
            </section>

            {/* 8. Collaborations */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Previous Collaborations</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Show brands who you&apos;ve worked with.
                </p>
              </div>
              <div className="cctr-collab-row">
                {logos.map((logo) => (
                  <div key={logo} className="cctr-collab-logo">
                    {logo.startsWith("http") ? (
                      <img src={logo} alt="Brand" />
                    ) : (
                      <span>{logo}</span>
                    )}
                  </div>
                ))}
              </div>
              <ul className="cctr-collab-stories">
                {mock.collaborations.map((collab) => (
                  <li key={collab.brand} className="cctr-collab-story">
                    <strong>{collab.brand}</strong>
                    <span
                      className="cctr-sub"
                      style={{ margin: 0, display: "block" }}
                    >
                      {collab.completed}
                    </span>
                    {collab.quote ? (
                      <p className="cctr-collab-story__quote">{collab.quote}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" disabled>
                Manage Collaborations →
              </Button>
            </section>

            {/* 9. Rates */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Collaboration Rates</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Your pricing stays private until you choose to share it.
                </p>
              </div>
              <div className="cctr-rates-grid">
                <TextField
                  label={`Reel (${mock.rates.currency})`}
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <TextField
                  label={`Story (${mock.rates.currency})`}
                  type="number"
                  value={storyRate}
                  onChange={(e) => setStoryRate(e.target.value)}
                />
                <TextField
                  label={`Carousel (${mock.rates.currency})`}
                  value={carouselRate}
                  disabled
                  onChange={() => undefined}
                />
                <TextField
                  label={`Bundle (${mock.rates.currency})`}
                  value={bundleRate}
                  disabled
                  onChange={() => undefined}
                />
              </div>
              <Toggle
                label="Show rates on public profile"
                checked={showRatesColumn}
                onChange={setShowRatesColumn}
              />
              <div className="cctr-ai-banner">
                <p className="cctr-ai-hint">{mock.rateSuggestion}</p>
                <Button variant="ghost" size="sm" disabled>
                  View Suggested Pricing →
                </Button>
              </div>
            </section>

            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Design theme</h2>
              </div>
              <SelectField
                label="Active theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as DesignTheme)}
                options={THEME_OPTIONS}
              />
            </section>

            {/* 10. Accepting + Ideal */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Currently Accepting</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Only opportunities matching your preferences will be
                  recommended.
                </p>
              </div>
              <div className="cctr-accept-grid">
                {mock.acceptingTypes.map((item) => (
                  <Toggle
                    key={item.id}
                    label={item.label}
                    checked={Boolean(accepting[item.id])}
                    onChange={(on) =>
                      setAccepting((prev) => ({ ...prev, [item.id]: on }))
                    }
                  />
                ))}
              </div>
              <div className="cctr-section-head" style={{ marginTop: 20 }}>
                <h2>Ideal Partnerships</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Help us recommend better campaigns.
                </p>
              </div>
              <div className="cctr-tag-row">
                {mock.idealPartnerships.map((label) => (
                  <Chip
                    key={label}
                    tone={
                      mock.selectedPartnerships.includes(label)
                        ? "selected"
                        : "neutral"
                    }
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              <div className="cctr-rates-grid" style={{ marginTop: 16 }}>
                <TextField
                  label="Minimum budget"
                  value={mock.minBudget}
                  disabled
                  onChange={() => undefined}
                />
                <TextField
                  label="Preferred regions"
                  value={mock.preferredRegions}
                  disabled
                  onChange={() => undefined}
                />
                <TextField
                  label="Languages"
                  value={mock.languages}
                  disabled
                  onChange={() => undefined}
                />
              </div>
            </section>

            {/* 11. Visibility */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Visibility</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Control who can discover your profile.
                </p>
              </div>
              <div className="cctr-visibility-options" role="radiogroup">
                {mock.visibilityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`cctr-visibility-option${visibility === option ? " cctr-visibility-option--active" : ""}`}
                    onClick={() => setVisibility(option)}
                  >
                    <strong>{option}</strong>
                    <span>
                      {option === "Public"
                        ? "Discoverable in brand search"
                        : option === "Invite Only"
                          ? "Only via your secure link"
                          : "Hidden from discovery"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <Button
              variant="primary"
              onClick={() => void handleSave()}
              disabled={saving || loading}
            >
              {saving ? "Saving…" : "Save Profile Changes"}
            </Button>

            {/* 12. Suggestions / recent / share */}
            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Suggested Improvements</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  A few quick updates could make your profile even stronger.
                </p>
              </div>
              <ul className="cctr-improve-list">
                {mock.suggestedImprovements.map((item) => (
                  <li key={item.id} className="cctr-improve-card">
                    <span aria-hidden>{item.icon}</span>
                    <div>
                      <p>{item.body}</p>
                      <Button variant="ghost" size="sm" disabled>
                        {item.cta}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Recent Updates</h2>
              </div>
              <ul className="cctr-recent-list">
                {mock.recentUpdates.map((row) => (
                  <li key={row.when + row.text}>
                    <strong>{row.when}</strong>
                    <span>{row.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cctr-form-section">
              <div className="cctr-section-head">
                <h2>Share Your Creator Profile</h2>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  Send your profile anywhere.
                </p>
              </div>
              <div className="cctr-share-row">
                <Button variant="outline" size="sm" onClick={() => void copyLink()}>
                  Copy Link
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Share Sheet
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Generate QR
                </Button>
              </div>
            </section>

            <p className="cctr-profile-footer-banner">{mock.footerBanner}</p>
          </div>

          <Card className="cctr-preview-phone">
            <div className="cctr-preview-phone__badge">
              <Badge tone="neutral">Public preview</Badge>
            </div>
            <p className="cctr-sub" style={{ marginTop: 0 }}>
              See exactly what brands experience when they open your profile.
            </p>
            <div className="cctr-preview-phone__identity">
              {mediaKit?.avatarUrl ? (
                <img
                  className="cctr-preview-avatar"
                  src={mediaKit.avatarUrl}
                  alt=""
                />
              ) : (
                <div className="cctr-preview-avatar cctr-preview-avatar--fallback">
                  {MOCK_CREATOR_PROFILE.avatarInitials}
                </div>
              )}
              <div>
                <h3>{displayName}</h3>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  {handle}
                </p>
                <p className="cctr-sub" style={{ margin: 0 }}>
                  {MOCK_CREATOR_PROFILE.tagline}
                </p>
              </div>
            </div>
            <p className="cctr-preview-bio">{bio}</p>
            <div className="cctr-tag-row">
              {showTotalReach ? (
                <Badge tone="success">{reachLabel} reach</Badge>
              ) : null}
              {showEngagementRate ? (
                <Badge tone="success">{erLabel} ER</Badge>
              ) : null}
              <Badge tone="neutral">{mock.primaryCategory}</Badge>
              <Badge tone="neutral">{visibility}</Badge>
            </div>
            {showRatesColumn ? (
              <div className="cctr-preview-rates">
                <div>
                  <span>Reel</span>
                  <strong>
                    {mock.rates.currency}
                    {Number(rate).toLocaleString() || mock.rates.reel}
                  </strong>
                </div>
                <div>
                  <span>Story</span>
                  <strong>
                    {mock.rates.currency}
                    {Number(storyRate).toLocaleString() || mock.rates.story}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="cctr-sub">Inquire for rates</p>
            )}
            <div className="cctr-portfolio-grid">
              {mock.portfolio.slice(0, 4).map((title) => (
                <div key={title} className="cctr-portfolio-tile">
                  {title}
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="sm"
              style={{ width: "100%" }}
              disabled
            >
              Work with Me
            </Button>
            <button type="button" className="cctr-text-link" disabled>
              Open Live Profile →
            </button>
            <p className="cctr-sub" style={{ marginBottom: 0, fontSize: 12 }}>
              Theme:{" "}
              {THEME_OPTIONS.find((t) => t.value === theme)?.label ?? theme}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Prefer CreatorProfileWorkspace */
export const MediaKitWorkspace = CreatorProfileWorkspace;
