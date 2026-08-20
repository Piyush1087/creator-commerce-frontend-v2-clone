import { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock3, ShieldCheck, X } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import {
  SUPPORTED_GATEKEEPER_INDUSTRIES,
  SUPPORTED_GATEKEEPER_INDUSTRY_LABELS,
  type SupportedGatekeeperIndustry,
} from "../contracts/gatekeeper.contracts";
import "./gatekeeper-confirmation-adjustments.css";

export const COMING_SOON_INDUSTRIES = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "EDUCATION", label: "Education" },
  { value: "MEDIA_ENTERTAINMENT", label: "Media & Entertainment" },
  { value: "B2B_AGENCY", label: "B2B / Agency" },
] as const;

type Props = {
  open: boolean;
  domain: string;
  detectedIndustry: SupportedGatekeeperIndustry;
  selectedIndustry: string;
  isStarting: boolean;
  error?: string | null;
  onSelectIndustry: (industry: string) => void;
  onResetIndustry: () => void;
  onConfirmSupported: () => void | Promise<void>;
  onConfirmUnsupported: () => void | Promise<void>;
  onClose: () => void;
};

export function GatekeeperConfirmationModal({
  open,
  domain,
  detectedIndustry,
  selectedIndustry,
  isStarting,
  error,
  onSelectIndustry,
  onResetIndustry,
  onConfirmSupported,
  onConfirmUnsupported,
  onClose,
}: Props) {
  const [editingIndustry, setEditingIndustry] = useState(false);

  useEffect(() => {
    if (open) setEditingIndustry(false);
  }, [open]);

  if (!open) return null;

  const selectedSupported = SUPPORTED_GATEKEEPER_INDUSTRIES.includes(
    selectedIndustry as SupportedGatekeeperIndustry,
  );
  const isOverride = selectedSupported && selectedIndustry !== detectedIndustry;
  const isUnsupported = !selectedSupported;
  const selectedLabel = selectedSupported
    ? SUPPORTED_GATEKEEPER_INDUSTRY_LABELS[
        selectedIndustry as SupportedGatekeeperIndustry
      ]
    : COMING_SOON_INDUSTRIES.find((item) => item.value === selectedIndustry)?.label ??
      selectedIndustry;
  const detectedLabel = SUPPORTED_GATEKEEPER_INDUSTRY_LABELS[detectedIndustry];

  const keepDetectedIndustry = () => {
    onResetIndustry();
    setEditingIndustry(false);
  };

  return (
    <div className="gk-modal-backdrop" role="presentation">
      <section
        className="gk-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gk-confirm-title"
        aria-describedby="gk-confirm-description"
      >
        <button
          type="button"
          className="gk-icon-button"
          aria-label="Close confirmation"
          onClick={onClose}
          disabled={isStarting}
        >
          <X size={20} aria-hidden />
        </button>

        <div className="gk-modal__eyebrow">
          <ShieldCheck size={18} aria-hidden /> Ready for Brand Intelligence
        </div>
        <h2 id="gk-confirm-title">Review what we detected</h2>
        <p id="gk-confirm-description" className="gk-modal__lead">
          We’re ready to take a deeper look at <strong>{domain}</strong>. Confirm the
          top-level Industry before the scan starts.
        </p>

        <div className="gk-industry-card">
          <div className="gk-industry-current">
            <div>
              <span className="gk-label">AI-assessed Industry</span>
              <strong>{detectedLabel}</strong>
            </div>
            {!editingIndustry ? (
              <button
                type="button"
                className="gk-change-industry"
                onClick={() => setEditingIndustry(true)}
                disabled={isStarting}
              >
                Change
              </button>
            ) : null}
          </div>

          {editingIndustry ? (
            <div className="gk-industry-editor">
              <div className="gk-industry-options" role="group" aria-label="Supported Industries">
                {SUPPORTED_GATEKEEPER_INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    className={
                      selectedIndustry === industry
                        ? "gk-industry-option gk-industry-option--selected"
                        : "gk-industry-option"
                    }
                    onClick={() => onSelectIndustry(industry)}
                    disabled={isStarting}
                  >
                    {selectedIndustry === industry ? <Check size={15} aria-hidden /> : null}
                    {SUPPORTED_GATEKEEPER_INDUSTRY_LABELS[industry]}
                  </button>
                ))}
              </div>
              <div className="gk-coming-soon">
                <span className="gk-label">Coming soon</span>
                <div className="gk-industry-options" role="group" aria-label="Coming soon Industries">
                  {COMING_SOON_INDUSTRIES.map((industry) => (
                    <button
                      key={industry.value}
                      type="button"
                      className={
                        selectedIndustry === industry.value
                          ? "gk-industry-option gk-industry-option--coming gk-industry-option--selected"
                          : "gk-industry-option gk-industry-option--coming"
                      }
                      onClick={() => onSelectIndustry(industry.value)}
                      disabled={isStarting}
                    >
                      {industry.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {isOverride ? (
          <div className="gk-warning" role="alert">
            <AlertTriangle size={20} aria-hidden />
            <div>
              <strong>You selected {selectedLabel}</strong>
              <p>
                Creator Shop detected {detectedLabel}. Keep the detected Industry, or
                explicitly continue with {selectedLabel}. Your correction will be
                recorded for operational review and will not block this scan.
              </p>
              <button type="button" onClick={keepDetectedIndustry} disabled={isStarting}>
                Keep {detectedLabel}
              </button>
            </div>
          </div>
        ) : null}

        {isUnsupported ? (
          <div className="gk-warning gk-warning--strong" role="alert">
            <AlertTriangle size={20} aria-hidden />
            <div>
              <strong>{selectedLabel} is coming soon</strong>
              <p>
                This Industry is not supported for MVP automated onboarding. If you
                confirm it, Brand Intelligence will not start.
              </p>
              <button type="button" onClick={keepDetectedIndustry} disabled={isStarting}>
                Keep {detectedLabel}
              </button>
            </div>
          </div>
        ) : null}

        <div className="gk-scan-summary">
          <div>
            <Clock3 size={18} aria-hidden />
            <span>
              <strong>Deeper brand analysis</strong>
              <small>Timing varies by site; we’ll keep you informed as the scan runs.</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={18} aria-hidden />
            <span>
              <strong>No extra access required now</strong>
              <small>A domain-linked work email and Meta / Instagram access may be useful later, but are not required to start.</small>
            </span>
          </div>
          <div>
            <Check size={18} aria-hidden />
            <span>
              <strong>You stay in control</strong>
              <small>You’ll review the resulting Intelligence before it becomes part of your working brand context.</small>
            </span>
          </div>
        </div>

        {error ? <p className="gk-form-error" role="alert">{error}</p> : null}

        <div className="gk-modal__actions">
          {isUnsupported ? (
            <Button
              type="button"
              variant="primary"
              disabled={isStarting}
              onClick={() => void onConfirmUnsupported()}
            >
              {isStarting ? "Confirming…" : `Confirm ${selectedLabel}`}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={isStarting}
              onClick={() => void onConfirmSupported()}
            >
              {isStarting
                ? "Starting…"
                : isOverride
                  ? `Continue with ${selectedLabel}`
                  : "Start Brand Intelligence Scan"}
            </Button>
          )}
          <Button type="button" variant="secondary" disabled={isStarting} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </section>
    </div>
  );
}
