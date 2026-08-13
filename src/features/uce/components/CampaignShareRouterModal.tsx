import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Globe,
  MessageCircle,
  Camera,
  Share2,
  X,
} from "lucide-react";

import { Alert, Button } from "../../../design-system/aurora";
import { executeCampaignShare } from "../api/brand-uce-client";
import type { ShareChannel } from "../campaign-page/types";
import "./CampaignShareRouterModal.css";

type ShareProductOption = {
  id: string;
  name: string;
};

type CampaignShareRouterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignName?: string;
  products?: ShareProductOption[];
  /** Channels from Campaign Page View DTO; opening the surface does not execute Share. */
  supportedChannels?: ShareChannel[];
};

const CHANNEL_META: Record<
  ShareChannel,
  { label: string; short: string; icon: typeof Copy }
> = {
  COPY_LINK: { label: "Copy Link", short: "Copy", icon: Copy },
  WHATSAPP: { label: "WhatsApp", short: "WA", icon: MessageCircle },
  INSTAGRAM: { label: "Instagram", short: "IG", icon: Camera },
  NATIVE_SHARE: { label: "More…", short: "More", icon: Share2 },
};

const DEFAULT_CHANNELS: ShareChannel[] = [
  "COPY_LINK",
  "WHATSAPP",
  "INSTAGRAM",
];

export function CampaignShareRouterModal({
  isOpen,
  onClose,
  campaignId,
  campaignName = "Campaign",
  products = [],
  supportedChannels,
}: CampaignShareRouterModalProps) {
  const channels = useMemo(() => {
    const fromView = supportedChannels?.filter((c) => c in CHANNEL_META) ?? [];
    return fromView.length > 0 ? fromView : DEFAULT_CHANNELS;
  }, [supportedChannels]);

  const [productScope, setProductScope] = useState("all");
  const [channel, setChannel] = useState<ShareChannel>(channels[0] ?? "COPY_LINK");
  const [trackedUrl, setTrackedUrl] = useState<string>();
  const [shareError, setShareError] = useState<string>();
  const [shareSuccess, setShareSuccess] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTrackedUrl(undefined);
    setShareError(undefined);
    setShareSuccess(undefined);
    setChannel(channels[0] ?? "COPY_LINK");
  }, [isOpen, channels]);

  const draftPreviewUrl = useMemo(() => {
    if (trackedUrl) return trackedUrl;
    return "Tracked link is created when you share";
  }, [trackedUrl]);

  const messagePreview = useMemo(() => {
    const productLine =
      productScope === "all"
        ? "our open briefs"
        : (products.find((p) => p.id === productScope)?.name ?? "this product");
    const link = trackedUrl ?? "[tracked campaign link]";
    return `We're launching '${campaignName}' and would love creators like you. Check out ${productLine}: ${link}`;
  }, [campaignName, productScope, products, trackedUrl]);

  const executeShare = () => {
    if (!campaignId) {
      setShareError("Campaign id is required to share.");
      return;
    }

    void (async () => {
      setBusy(true);
      setShareError(undefined);
      setShareSuccess(undefined);
      try {
        const result = await executeCampaignShare(
          campaignId,
          channel,
          `share-ui-${crypto.randomUUID()}`,
        );
        const url = `${window.location.origin}${result.sharePath}`;
        setTrackedUrl(url);

        const finalMessage = messagePreview.replace(
          trackedUrl ?? "[tracked campaign link]",
          url,
        );

        if (channel === "COPY_LINK") {
          await navigator.clipboard.writeText(url);
          setShareSuccess("Tracked link copied.");
        } else if (channel === "WHATSAPP") {
          await navigator.clipboard.writeText(finalMessage);
          window.open(
            `https://wa.me/?text=${encodeURIComponent(finalMessage)}`,
            "_blank",
            "noopener,noreferrer",
          );
          setShareSuccess("WhatsApp handoff opened with tracked link.");
        } else if (channel === "INSTAGRAM") {
          await navigator.clipboard.writeText(finalMessage);
          setShareSuccess("Message copied for Instagram handoff.");
        } else if (channel === "NATIVE_SHARE" && navigator.share) {
          await navigator.share({
            title: campaignName,
            text: finalMessage,
            url,
          });
          setShareSuccess("Native share completed.");
        } else {
          await navigator.clipboard.writeText(url);
          setShareSuccess("Tracked link copied.");
        }

        // Docs: after deliberate handoff / copy, Share surface closes.
        window.setTimeout(() => onClose(), 700);
      } catch (error) {
        setShareError(
          error instanceof Error ? error.message : "Share command failed.",
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  const resetScopes = () => {
    setProductScope("all");
    setChannel(channels[0] ?? "COPY_LINK");
    setTrackedUrl(undefined);
    setShareError(undefined);
    setShareSuccess(undefined);
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
            <h2>Share Campaign</h2>
            <p>
              Choose a channel, review the message, then execute Share. Opening this
              surface does not create tracking evidence.
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
          {shareError ? (
            <Alert title="Share failed" tone="error">
              {shareError}
            </Alert>
          ) : null}
          {shareSuccess ? (
            <Alert title="Share accepted" tone="success">
              {shareSuccess}
            </Alert>
          ) : null}

          <div className="uce-share-router-columns">
            <div className="uce-share-router-col">
              <h3 className="uce-field-label uce-field-label--block">Opportunity scope</h3>
              <div className="uce-share-form-stack">
                <label className="uce-share-field">
                  <span>Product scope</span>
                  <div className="uce-share-select-wrap">
                    <Globe size={16} className="uce-share-select-icon" />
                    <select
                      value={productScope}
                      onChange={(e) => setProductScope(e.target.value)}
                    >
                      <option value="all">All products / briefs</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
            </div>

            <div className="uce-share-router-col">
              <h3 className="uce-field-label uce-field-label--block">Channel & message</h3>
              <div className="uce-share-form-stack">
                <div className="uce-share-url-row">
                  <code>{draftPreviewUrl}</code>
                  <button
                    type="button"
                    className="uce-share-copy-btn"
                    disabled={!trackedUrl}
                    onClick={() => {
                      if (trackedUrl) void navigator.clipboard.writeText(trackedUrl);
                    }}
                    aria-label="Copy tracked URL"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div className="uce-share-channel-strip" role="tablist">
                  {channels.map((id) => {
                    const meta = CHANNEL_META[id];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={channel === id}
                        className={`uce-share-channel-btn ${channel === id ? "is-active" : ""}`}
                        onClick={() => setChannel(id)}
                      >
                        <Icon size={16} />
                        <span className="uce-share-channel-label-full">{meta.label}</span>
                        <span className="uce-share-channel-label-short">{meta.short}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="uce-share-message-preview">{messagePreview}</div>

                <button
                  type="button"
                  className="uce-share-whatsapp-btn"
                  disabled={busy || !campaignId}
                  onClick={executeShare}
                >
                  <ExternalLink size={16} />
                  {busy ? "Sharing…" : `Share via ${CHANNEL_META[channel].label}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="uce-share-router-footer">
          <button type="button" className="uce-share-reset-btn" onClick={resetScopes}>
            Reset
          </button>
          <div className="uce-share-footer-actions">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={busy || !campaignId}
              onClick={executeShare}
              type="button"
            >
              {busy ? "Sharing…" : "Share"}
            </Button>
          </div>
          <button
            type="button"
            className="uce-share-mobile-launch"
            disabled={busy || !campaignId}
            onClick={executeShare}
          >
            {busy ? "Sharing…" : "Share"}
          </button>
        </footer>
      </div>
    </div>
  );
}
