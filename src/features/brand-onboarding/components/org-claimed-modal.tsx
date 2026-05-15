import { Mail, X } from "lucide-react";

import { Button } from "../../../design-system/aurora";

type OrgClaimedModalProps = {
  open: boolean;
  domain: string;
  adminEmail: string;
  message: string;
  onClose: () => void;
};

export function OrgClaimedModal({
  open,
  domain,
  adminEmail,
  message,
  onClose,
}: OrgClaimedModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="bob-modal-backdrop"
      role="presentation"
      onClick={() => onClose()}
    >
      <div
        className="bob-small-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bob-org-claimed-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-funnel-page__header">
          <h2 id="bob-org-claimed-title" className="aurora-card__title">
            This organization is already set up
          </h2>
          <button
            type="button"
            className="bob-icon-button"
            aria-label="Close dialog"
            onClick={() => onClose()}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="bob-muted" style={{ marginBottom: 16 }}>
          {message}
        </p>
        <p style={{ marginBottom: 8, fontWeight: 600, color: "var(--text-high)" }}>
          Domain: <span style={{ fontFamily: "ui-monospace, monospace" }}>{domain}</span>
        </p>
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
            color: "var(--text-high)",
          }}
        >
          <Mail size={18} aria-hidden style={{ flexShrink: 0, color: "var(--color-primary)" }} />
          <span>
            Ask your admin for an invitation. Primary contact on file:{" "}
            <strong style={{ wordBreak: "break-all" }}>{adminEmail}</strong>
          </span>
        </p>
        <Button type="button" variant="primary" onClick={() => onClose()}>
          Got it
        </Button>
      </div>
    </div>
  );
}
