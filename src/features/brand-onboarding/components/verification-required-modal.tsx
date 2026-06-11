import { useNavigate } from "react-router-dom";
import { ShieldAlert, X } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import { ONBOARDING_ROUTES } from "../constants";
import {
  scanLimitVerificationCopy,
  type ScanLimitReason,
} from "../scan-limit-messages";
import { saveBrandOnboardingSession } from "../session/onboarding-session";

type VerificationRequiredModalProps = {
  open: boolean;
  domain: string;
  reason?: ScanLimitReason;
  brandProfileId: string;
  leadId: string | null;
  normalizedUrl: string;
  onClose: () => void;
};

export function VerificationRequiredModal({
  open,
  domain,
  reason = "DOMAIN_LIMIT",
  brandProfileId,
  leadId,
  normalizedUrl,
  onClose,
}: VerificationRequiredModalProps) {
  const navigate = useNavigate();

  if (!open) {
    return null;
  }

  const copy = scanLimitVerificationCopy(reason, domain);

  const goVerify = () => {
    if (leadId) {
      saveBrandOnboardingSession({
        leadId,
        brandProfileId,
        normalizedUrl,
      });
    }
    onClose();
    navigate(ONBOARDING_ROUTES.verification);
  };

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
        aria-labelledby="bob-verify-required-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-funnel-page__header">
          <h2 id="bob-verify-required-title" className="aurora-card__title">
            {copy.title}
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
        <p
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginBottom: 16,
            color: "var(--text-high)",
          }}
        >
          <ShieldAlert
            size={20}
            aria-hidden
            style={{ flexShrink: 0, marginTop: 2, color: "var(--color-primary)" }}
          />
          <span>{copy.body}</span>
        </p>
        <p style={{ marginBottom: 16, fontWeight: 600 }}>
          Domain:{" "}
          <span style={{ fontFamily: "ui-monospace, monospace" }}>{domain}</span>
        </p>
        <Button
          type="button"
          variant="primary"
          style={{ width: "100%" }}
          disabled={!leadId}
          onClick={() => goVerify()}
        >
          Verify work email
        </Button>
      </div>
    </div>
  );
}
