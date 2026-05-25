import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import { ONBOARDING_ROUTES } from "../constants";
import { saveBrandOnboardingSession } from "../session/onboarding-session";

type VerificationRequiredModalProps = {
  open: boolean;
  domain: string;
  message: string;
  brandProfileId: string;
  leadId: string | null;
  normalizedUrl: string;
  onClose: () => void;
};

export function VerificationRequiredModal({
  open,
  domain,
  message,
  brandProfileId,
  leadId,
  normalizedUrl,
  onClose,
}: VerificationRequiredModalProps) {
  const navigate = useNavigate();

  if (!open) {
    return null;
  }

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
            Verification required
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
        <p style={{ marginBottom: 16, fontWeight: 600 }}>
          Domain: <span style={{ fontFamily: "ui-monospace, monospace" }}>{domain}</span>
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
