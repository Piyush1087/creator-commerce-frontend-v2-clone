import { Check, ChevronLeft, Clock, Mail, Shield, ShieldCheck, X } from "lucide-react";

import { Badge, Button } from "../../../design-system/aurora";

type SetupVerificationModalProps = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void | Promise<void>;
};

export function SetupVerificationModal({
  open,
  onClose,
  onBack,
  onConfirm,
}: SetupVerificationModalProps) {
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
        className="bob-modal bob-modal--setup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bob-setup-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-modal__mobile-handle" aria-hidden />
        <div className="bob-modal__header">
          <button
            type="button"
            className="bob-modal__close"
            aria-label="Close modal"
            onClick={() => onClose()}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="bob-modal__body">
          <div className="bob-inline bob-setup-badge-row">
            <Badge tone="pending">
              <Clock size={14} aria-hidden /> Estimated time — around 2 minutes
            </Badge>
          </div>
          <h2 id="bob-setup-title" className="bob-modal__title bob-modal__title--setup">
            Your Creator Match Setup Takes About 2 Minutes
          </h2>
          <p className="bob-modal__description">
            To deliver accurate creator recommendations and enable secure
            outreach, we&apos;ll need a few quick setup steps from your team.
            Everything stays encrypted, permission-controlled, and brand-safe.
          </p>

          <div className="bob-setup-includes">
            <div>
              <Check size={16} strokeWidth={3} aria-hidden />
              <strong>This includes:</strong>
            </div>
            <p>AI brand analysis</p>
            <p>creator recommendation</p>
            <p>account verification</p>
          </div>

          <div className="bob-setup-card">
            <span className="bob-setup-card__icon">
              <Mail size={20} aria-hidden />
            </span>
            <div>
              <h3>Verify your brand email</h3>
              <p>
                Use an email address connected to your website domain. This helps
                us protect creator trust, prevent impersonation, and maintain
                platform quality.
              </p>
            </div>
          </div>

          <div className="bob-setup-card bob-setup-card--muted">
            <span className="bob-setup-card__icon bob-setup-card__icon--outline">
              <ShieldCheck size={20} aria-hidden />
            </span>
            <div>
              <h3>Connect Meta Business Manager</h3>
              <p>
                Securely connect your Meta Business account to enable automated
                priority outreach to verified creators. We never access passwords
                or publish content without approval.
              </p>
            </div>
          </div>

          <div className="bob-setup-card bob-setup-card--muted">
            <span className="bob-setup-card__icon bob-setup-card__icon--outline">
              <Shield size={20} aria-hidden />
            </span>
            <div>
              <h3>Brand safety &amp; compliance</h3>
              <p>
                All outreach follows platform-safe sending practices and verified
                business authentication protocols. Built for modern growth and
                compliance teams.
              </p>
            </div>
          </div>
        </div>
        <div className="bob-modal__footer bob-setup-footer">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              void Promise.resolve(onConfirm());
            }}
          >
            Verify &amp; Continue Setup →
          </Button>
          <div className="bob-setup-footer__row">
            <button type="button" onClick={() => onBack()}>
              <ChevronLeft size={16} aria-hidden /> Back
            </button>
            <small>Secure setup • No spam outreach • Cancel anytime</small>
          </div>
        </div>
      </div>
    </div>
  );
}
