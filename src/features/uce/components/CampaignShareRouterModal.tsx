import { useMemo, useState } from "react";
import { env } from "../../../shared/config/env";
import { shareCampaign } from "../api/brand-uce-client";
import {
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  Camera,
  X,
} from "lucide-react";

type ShareChannel = "whatsapp" | "instagram" | "email";

type ShareProductOption = {
  id: string;
  name: string;
};

type CampaignShareRouterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignName?: string;
  campaignSlug?: string;
  campaignId: string;
  shareAvailable: boolean;
  products?: ShareProductOption[];
};

const CHANNEL_LABELS: Record<ShareChannel, string> = {
  whatsapp: "WhatsApp Channel",
  instagram: "Instagram Direct",
  email: "Corporate Email",
};

export function CampaignShareRouterModal({
  isOpen,
  onClose,
  campaignName = "Spring Glow 2024",
  campaignId,
  shareAvailable,
  products = [],
}: CampaignShareRouterModalProps) {
  const [productScope, setProductScope] = useState("all");
  const [briefScope, setBriefScope] = useState("all");
  const [utmSource, setUtmSource] = useState("");
  const [channel, setChannel] = useState<ShareChannel>("whatsapp");
  const [shareUrl, setShareUrl] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const requestShareUrl = async () => {
    if (!shareAvailable) throw new Error("Sharing is unavailable until this campaign is live and ready.");
    const commandChannel = channel === "whatsapp" ? "WHATSAPP" : channel === "instagram" ? "INSTAGRAM" : "NATIVE_SHARE";
    const result = await shareCampaign(campaignId, commandChannel);
    const origin = new URL(env.apiUrl).origin;
    const url = new URL(result.sharePath, origin);
    if (utmSource.trim()) url.searchParams.set("utm_source", utmSource.trim());
    setShareUrl(url.toString());
    return url.toString();
  };

  const messagePreview = useMemo(() => {
    const productLine =
      productScope === "all"
        ? "our open briefs"
        : products.find((p) => p.id === productScope)?.name ?? "this product";
    return `We're launching our '${campaignName}' campaign. Check out ${productLine}${shareUrl ? ` here: ${shareUrl}` : ". Generate the authorized link to share."}`;
  }, [campaignName, productScope, products, shareUrl]);

  const briefSelectDisabled = productScope === "all" && products.length > 0;

  const copyLaunch = async () => {
    setSharing(true);
    setShareError(null);
    try {
      const url = await requestShareUrl();
      const message = `We're launching our '${campaignName}' campaign. ${url}`;
      await navigator.clipboard.writeText(message);
      if (channel === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Could not create an authorized share link.");
    } finally {
      setSharing(false);
    }
  };

  const resetScopes = () => {
    setProductScope("all");
    setBriefScope("all");
    setUtmSource("");
    setChannel("whatsapp");
  };

  if (!isOpen) return null;

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
            <p>
              Generate customized deep-links or universal recruitment portals to onboard
              external creators into your execution pipeline.
            </p>
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
              <h3 className="uce-field-label uce-field-label--block">Opportunity Scoping</h3>
              <div className="uce-share-form-stack">
                <label className="uce-share-field">
                  <span>Select Target Product</span>
                  <div className="uce-share-select-wrap">
                    <Globe size={16} className="uce-share-select-icon" />
                    <select
                      value={productScope}
                      onChange={(e) => setProductScope(e.target.value)}
                    >
                      <option value="all">
                        All Connected Products (Master Campaign Hub Link)
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label
                  className={`uce-share-field ${briefSelectDisabled ? "uce-share-field--disabled" : ""}`}
                >
                  <span>Select Associated Strategy Brief</span>
                  <div className="uce-share-select-wrap">
                    <MessageCircle size={16} className="uce-share-select-icon" />
                    <select
                      value={briefScope}
                      disabled={briefSelectDisabled}
                      onChange={(e) => setBriefScope(e.target.value)}
                    >
                      <option value="all">All Active Briefs Linked to All Products</option>
                      <option value="summer">Summer Skin Routine</option>
                    </select>
                  </div>
                </label>
                <label className="uce-share-field">
                  <span>Custom UTM Source Reference Channel ID (Optional)</span>
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
              <h3 className="uce-field-label uce-field-label--block">Messaging Preview</h3>
              <div className="uce-share-form-stack">
                <div className="uce-share-url-row">
                  <code>{shareUrl || "Generated by the Campaign Share command"}</code>
                  <button
                    type="button"
                    className="uce-share-copy-btn"
                    title="Copy link"
                    disabled={!shareUrl}
                    onClick={() => void navigator.clipboard.writeText(shareUrl)}
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div className="uce-share-channel-strip" role="tablist">
                  {(
                    [
                      { id: "whatsapp" as const, icon: MessageCircle, short: "WA" },
                      { id: "instagram" as const, icon: Camera, short: "IG" },
                      { id: "email" as const, icon: Mail, short: "Mail" },
                    ] as const
                  ).map(({ id, icon: Icon, short }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={channel === id}
                      className={`uce-share-channel-btn ${channel === id ? "is-active" : ""}`}
                      onClick={() => setChannel(id)}
                    >
                      <Icon size={16} />
                      <span className="uce-share-channel-label-full">{CHANNEL_LABELS[id]}</span>
                      <span className="uce-share-channel-label-short">{short}</span>
                    </button>
                  ))}
                </div>

                <div className="uce-share-message-preview">{messagePreview}</div>

                {shareError ? <p role="alert">{shareError}</p> : null}
                <button type="button" className="uce-share-whatsapp-btn" disabled={sharing || !shareAvailable} onClick={() => void copyLaunch()}>
                  Copy Text &amp; Launch {channel === "whatsapp" ? "WhatsApp Chat Web" : CHANNEL_LABELS[channel]}
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="uce-share-router-footer">
          <button type="button" className="uce-share-reset-btn" onClick={resetScopes}>
            Reset Dropdown Scopes
          </button>
          <div className="uce-share-footer-actions">
            <button
              type="button"
              className="uce-share-btn-secondary"
              onClick={() => {
                resetScopes();
                onClose();
              }}
            >
              Clear &amp; Close Panel
            </button>
            <button
              type="button"
              className="uce-share-btn-primary"
              disabled={sharing || !shareAvailable}
              onClick={() => void copyLaunch()}
            >
              Master Copy &amp; Inject Tab Route
            </button>
          </div>
          <button type="button" className="uce-share-mobile-launch" disabled={sharing || !shareAvailable} onClick={() => void copyLaunch()}>
            Copy Message &amp; Open App Platform
          </button>
        </footer>
      </div>
    </div>
  );
}
