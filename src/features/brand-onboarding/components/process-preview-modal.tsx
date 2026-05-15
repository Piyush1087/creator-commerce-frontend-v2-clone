import {
  Brain,
  CheckCircle2,
  MessageSquare,
  Rocket,
  Target,
  X,
} from "lucide-react";

import { Button, Card } from "../../../design-system/aurora";

import type { ExistingBrandProfileSummary } from "../contracts/discovery.contracts";
import { PROCESS_JOURNEY_STEPS } from "../constants/process-journey-steps";

type ProcessPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  existingBrandProfile?: ExistingBrandProfileSummary | null;
};

export function ProcessPreviewModal({
  open,
  onClose,
  onContinue,
  existingBrandProfile,
}: ProcessPreviewModalProps) {
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
        className="bob-modal bob-modal--process"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bob-process-title"
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
          <h2 id="bob-process-title" className="bob-modal__title">
            Your AI Creator Match Process Starts Now
          </h2>
          <p className="bob-modal__description">
            We&apos;re now building a tailored influencer campaign based on your
            brand identity, audience, positioning, and growth goals. Here&apos;s
            what happens next:
          </p>

          {existingBrandProfile ? (
            <Card title="Saved brand profile (preview)" eyebrow="Already on file">
              <p className="bob-muted" style={{ marginTop: 0 }}>
                We found an existing surface scan for this domain. You can continue
                to review it in the funnel, or start a fresh scan later with a forced
                refresh from the API.
              </p>
              <p style={{ marginBottom: 6 }}>
                <strong>{existingBrandProfile.name}</strong>
              </p>
              <p className="bob-muted" style={{ marginTop: 0 }}>
                Status: <strong>{existingBrandProfile.scanStatus}</strong> ·
                Offerings: <strong>{existingBrandProfile.offerings}</strong> ·
                Competitors: <strong>{existingBrandProfile.competitors}</strong> ·
                Locations: <strong>{existingBrandProfile.locations}</strong>
              </p>
              {existingBrandProfile.tagline ? (
                <p style={{ marginTop: 8 }}>{existingBrandProfile.tagline}</p>
              ) : null}
              {existingBrandProfile.descriptionPreview ? (
                <p className="bob-muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
                  {existingBrandProfile.descriptionPreview}
                  {existingBrandProfile.descriptionPreview.length >= 280 ? "…" : null}
                </p>
              ) : null}
            </Card>
          ) : null}

          <div className="bob-journey">
            {PROCESS_JOURNEY_STEPS.map((step, index) => {
              const icons = [Brain, Rocket, Target, CheckCircle2, MessageSquare];
              const Icon = icons[index] ?? Brain;
              return (
                <div key={step.number} className="bob-journey-step">
                  <div className="bob-journey-step__icon">
                    <Icon size={18} aria-hidden />
                  </div>
                  <div>
                    <h3>
                      {step.number} — {step.title.toUpperCase()}
                    </h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bob-modal__footer bob-modal__footer--stack">
          <Button
            type="button"
            variant="primary"
            fullWidthOnMobile
            onClick={() => {
              void Promise.resolve(onContinue());
            }}
          >
            Start My AI Brand Scan
          </Button>
          <p className="bob-modal__microcopy">Takes less than 2 minutes to begin</p>
        </div>
      </div>
    </div>
  );
}
