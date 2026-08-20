import { useEffect, useMemo, useRef, useState } from "react";
import {
  GATEKEEPER_INDUSTRY_LABELS,
  SUPPORTED_GATEKEEPER_INDUSTRIES,
  isSupportedGatekeeperIndustry,
  type SupportedGatekeeperIndustry,
} from "../gatekeeper/gatekeeper-runtime";

const COMING_SOON = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "EDUCATION", label: "Education" },
  { value: "MEDIA_ENTERTAINMENT", label: "Media & Entertainment" },
  { value: "B2B_AGENCY", label: "B2B / Agency" },
] as const;

export function GatekeeperConfirmationModal({
  open,
  domain,
  assessedIndustry,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  domain: string;
  assessedIndustry: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (industry: string) => void;
}) {
  const [selected, setSelected] = useState(assessedIndustry);
  const [editing, setEditing] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setSelected(assessedIndustry);
      setEditing(false);
      window.setTimeout(() => closeRef.current?.focus(), 0);
    }
  }, [assessedIndustry, open]);

  const isSupported = isSupportedGatekeeperIndustry(selected);
  const differs = selected !== assessedIndustry;
  const warning = useMemo(() => {
    if (!differs) return null;
    if (isSupported) {
      return {
        title: "Confirm your Industry change",
        body: `Creator Shop detected ${displayIndustry(assessedIndustry)}. You selected ${displayIndustry(selected)}. You can keep the detected Industry or explicitly continue with your selection.`,
        confirm: `Continue with ${displayIndustry(selected)}`,
      };
    }
    return {
      title: `${displayIndustry(selected)} is coming soon`,
      body: `This Industry isn't supported for automated onboarding yet. Keeping ${displayIndustry(assessedIndustry)} lets you continue; confirming ${displayIndustry(selected)} will stop this onboarding journey.`,
      confirm: `Confirm ${displayIndustry(selected)}`,
    };
  }, [assessedIndustry, differs, isSupported, selected]);

  if (!open) return null;

  return (
    <div className="gk-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <div className="gk-modal" role="dialog" aria-modal="true" aria-labelledby="gk-confirm-title">
        <button ref={closeRef} type="button" className="gk-modal__close" aria-label="Close confirmation" disabled={busy} onClick={onClose}>×</button>
        <div className="gk-modal__eyebrow">Ready for deeper analysis</div>
        <h2 id="gk-confirm-title">Review your brand before we start</h2>
        <div className="gk-brand-context">
          <span>Website</span>
          <strong>{domain}</strong>
        </div>
        <div className="gk-industry-row">
          <div>
            <span>Detected Industry</span>
            <strong>{displayIndustry(assessedIndustry)}</strong>
          </div>
          <button type="button" className="gk-link-button" onClick={() => setEditing((value) => !value)} disabled={busy}>
            {editing ? "Done" : "Change"}
          </button>
        </div>
        {editing ? (
          <div className="gk-industry-picker" aria-label="Industry options">
            <div className="gk-industry-picker__group">
              <span>Supported now</span>
              {SUPPORTED_GATEKEEPER_INDUSTRIES.map((industry) => (
                <label key={industry}>
                  <input type="radio" name="gatekeeper-industry" value={industry} checked={selected === industry} onChange={() => setSelected(industry)} />
                  {GATEKEEPER_INDUSTRY_LABELS[industry as SupportedGatekeeperIndustry]}
                </label>
              ))}
            </div>
            <div className="gk-industry-picker__group gk-industry-picker__group--soon">
              <span>Coming soon</span>
              {COMING_SOON.map((industry) => (
                <label key={industry.value}>
                  <input type="radio" name="gatekeeper-industry" value={industry.value} checked={selected === industry.value} onChange={() => setSelected(industry.value)} />
                  {industry.label}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        {warning ? (
          <div className={isSupported ? "gk-industry-warning" : "gk-industry-warning gk-industry-warning--unsupported"} role="alert">
            <strong>{warning.title}</strong>
            <p>{warning.body}</p>
            <div className="gk-industry-warning__actions">
              <button type="button" className="gk-button gk-button--secondary" disabled={busy} onClick={() => setSelected(assessedIndustry)}>
                Keep {displayIndustry(assessedIndustry)}
              </button>
              <button type="button" className="gk-button gk-button--primary" disabled={busy} onClick={() => onConfirm(selected)}>
                {warning.confirm}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="gk-scan-summary">
              <h3>What happens next</h3>
              <p>We'll analyze your website more deeply to build useful Brand Intelligence across your identity, offerings, audience and competitive context.</p>
              <p className="gk-scan-summary__time">Timing varies by website; we'll keep the experience moving and show the next step when the scan is ready.</p>
            </div>
            <div className="gk-later-note">
              <strong>You can start now.</strong>
              <p>A domain-linked work email and Meta / Instagram access may improve later steps, but neither is required to begin this scan. You'll review the resulting Intelligence before using it.</p>
            </div>
            <button type="button" className="gk-button gk-button--primary gk-modal__primary" disabled={busy} onClick={() => onConfirm(selected)}>
              {busy ? "Starting…" : "Start Brand Intelligence Scan"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function displayIndustry(value: string): string {
  if (isSupportedGatekeeperIndustry(value)) return GATEKEEPER_INDUSTRY_LABELS[value];
  return COMING_SOON.find((item) => item.value === value)?.label ?? value.replace(/_/g, " ");
}
