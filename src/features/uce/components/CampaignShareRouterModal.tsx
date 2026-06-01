import { useMemo, useState } from "react";
import { Copy, X } from "lucide-react";

type CampaignShareRouterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignSlug?: string;
};

const BASE_URL = "https://app.aura.io/c/spring_glow_2024";

export function CampaignShareRouterModal({
  isOpen,
  onClose,
  campaignSlug = "spring_glow_2024",
}: CampaignShareRouterModalProps) {
  const [utmSource, setUtmSource] = useState("");

  const shareUrl = useMemo(() => {
    const base = BASE_URL.replace("spring_glow_2024", campaignSlug);
    if (!utmSource.trim()) {
      return base;
    }
    const param = encodeURIComponent(utmSource.trim());
    return `${base}${base.includes("?") ? "&" : "?"}utm_source=${param}`;
  }, [campaignSlug, utmSource]);

  const messagePreview = useMemo(
    () =>
      `Hey! I'm Sarah from Aurora Beauty. We're launching our 'Spring Glow 2024' campaign and love your content. Check details at: ${shareUrl}`,
    [shareUrl],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="uce-share-router" role="dialog" aria-modal="true">
      <button
        type="button"
        className="uce-share-router-backdrop"
        aria-label="Close share router"
        onClick={onClose}
      />
      <div className="uce-share-router-panel">
        <header className="uce-share-router-header">
          <div>
            <h2>Universal Campaign Share Router</h2>
            <p>Generate deep-links or recruitment portals.</p>
          </div>
          <button
            type="button"
            className="uce-share-router-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        <div className="uce-share-router-body">
          <div className="uce-share-router-columns">
            <div className="uce-share-router-col">
              <h3 className="uce-field-label">Opportunity Scoping</h3>
              <div className="uce-share-form-stack">
                <label className="uce-share-field">
                  <span>Select Target Product</span>
                  <select defaultValue="all">
                    <option value="all">All Connected Products (Master Hub)</option>
                    <option value="serum">Hydration Boost Serum</option>
                  </select>
                </label>
                <label className="uce-share-field">
                  <span>
                    Custom UTM Source Reference Channel ID (Optional)
                  </span>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="e.g., Summer_Influencer_Cohort_2026"
                  />
                </label>
              </div>
            </div>

            <div className="uce-share-router-col">
              <h3 className="uce-field-label">Messaging Preview</h3>
              <div className="uce-share-form-stack">
                <div className="uce-share-url-row">
                  <code>{shareUrl}</code>
                  <button
                    type="button"
                    className="uce-share-copy-btn"
                    title="Copy link"
                    onClick={() => void navigator.clipboard.writeText(shareUrl)}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="uce-share-message-preview">{messagePreview}</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="uce-share-router-footer">
          <button
            type="button"
            className="uce-share-btn-secondary"
            onClick={() => {
              setUtmSource("");
              onClose();
            }}
          >
            Clear &amp; Close Panel
          </button>
          <button type="button" className="uce-share-btn-primary">
            Master Copy &amp; Inject Tab Route
          </button>
        </footer>
      </div>
    </div>
  );
}
