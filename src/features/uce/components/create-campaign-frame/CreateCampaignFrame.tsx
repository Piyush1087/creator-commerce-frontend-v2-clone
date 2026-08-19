import { Check, ChevronDown, CircleAlert, LoaderCircle } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "../../../../design-system/aurora/components/Button";
import {
  getWizardActions,
  getInitialSummaryExpanded,
  getWizardProgress,
  toggleSummaryExpanded,
  WIZARD_STEP_LABELS,
  type WizardInitializationState,
  type WizardStep,
} from "./create-campaign-frame-model";
import "./create-campaign-frame.css";

export function CampaignWizardProgress({ step, compact = false }: { step: WizardStep; compact?: boolean }) {
  return (
    <div className={`campaign-progress ${compact ? "campaign-progress--compact" : ""}`}>
      {compact ? <p className="campaign-progress__mobile-label">Step {step} of 3</p> : null}
      <ol aria-label="Campaign creation progress">
        {getWizardProgress(step).map((item) => (
          <li key={item.step} className={`campaign-progress__item campaign-progress__item--${item.state}`} aria-current={item.state === "current" ? "step" : undefined}>
            <span className="campaign-progress__marker" aria-hidden="true">
              {item.state === "completed" ? <Check size={15} /> : item.step}
            </span>
            <span className="campaign-progress__label">{item.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CampaignAutosaveStatus({ label, canRetry, onRetry }: { label: string; canRetry: boolean; onRetry: () => void }) {
  return (
    <div className="campaign-autosave" role="status" aria-live="polite" aria-atomic="true">
      <span>{label}</span>
      {canRetry ? <><span aria-hidden="true"> · </span><button type="button" onClick={onRetry}>Retry</button></> : null}
    </div>
  );
}

export function CampaignSummary({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(() => getInitialSummaryExpanded(true));
  return (
    <aside className="campaign-summary" aria-label="Campaign Summary">
      <div className="campaign-summary__desktop">
        <h2>Campaign Summary</h2>
        {children}
      </div>
      <div className="campaign-summary__mobile">
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(toggleSummaryExpanded)}>
          <span>Campaign summary</span><ChevronDown size={18} aria-hidden="true" />
        </button>
        {expanded ? <div className="campaign-summary__content">{children}</div> : null}
      </div>
    </aside>
  );
}

export function CampaignWizardActions({ step, busy, blocked, onSecondary, onPrimary }: { step: WizardStep; busy: boolean; blocked: boolean; onSecondary: () => void; onPrimary: () => void }) {
  const actions = getWizardActions(step, busy, blocked);
  return (
    <div className="campaign-actions" aria-label="Campaign workflow actions">
      <Button variant="outline" disabled={busy} onClick={onSecondary}>{actions.secondary}</Button>
      <Button variant="primary" disabled={actions.disabled} aria-busy={busy || undefined} onClick={onPrimary}>
        {actions.primaryBusy ?? actions.primary}
      </Button>
    </div>
  );
}

export function CampaignInitialization({ state, onRetry, onBack }: { state: Exclude<WizardInitializationState, "ready">; onRetry: () => void; onBack: () => void }) {
  if (state === "loading") {
    return (
      <section className="campaign-initialization" aria-live="polite" aria-busy="true">
        <LoaderCircle className="campaign-initialization__spinner" size={24} aria-hidden="true" />
        <div><h1>Preparing Create Campaign</h1><p>Loading your Campaign Draft…</p></div>
      </section>
    );
  }
  return (
    <section className="campaign-initialization campaign-initialization--failed" role="alert">
      <CircleAlert size={28} aria-hidden="true" />
      <div>
        <h1>Campaign setup couldn't be loaded</h1>
        <p>We couldn't prepare your Campaign Draft.</p>
        <p>Retry, or return to Campaigns.</p>
        <p className="campaign-initialization__note">No Campaign changes have been saved.</p>
        <div className="campaign-initialization__actions">
          <Button variant="primary" onClick={onRetry}>Retry</Button>
          <Button variant="outline" onClick={onBack}>Back to Campaigns</Button>
        </div>
      </div>
    </section>
  );
}

export function CampaignWizardFrame({ step, autosave, validationSummary, summary, actions, children }: { step: WizardStep; autosave: ReactNode; validationSummary: boolean; summary: ReactNode; actions: ReactNode; children: ReactNode }) {
  return (
    <div className="campaign-frame">
      <header className="campaign-frame__header">
        <nav className="campaign-frame__breadcrumb" aria-label="Breadcrumb"><span>Campaigns</span><span aria-hidden="true">/</span><span>New Campaign</span></nav>
        <div className="campaign-frame__title-row"><div><h1>Create Campaign</h1><p className="campaign-frame__mobile-context">{WIZARD_STEP_LABELS[step - 1]}</p></div>{autosave}</div>
        <CampaignWizardProgress step={step} />
        <CampaignWizardProgress step={step} compact />
      </header>
      <div className="campaign-frame__layout">
        <main className="campaign-frame__form">
          {validationSummary ? <div className="campaign-validation-summary" role="alert">Complete the highlighted fields to continue.</div> : null}
          {children}
        </main>
        {summary}
      </div>
      <footer className="campaign-frame__actions">{actions}</footer>
    </div>
  );
}
