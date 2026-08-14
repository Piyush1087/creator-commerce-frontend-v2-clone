import { Check, Instagram, LoaderCircle, LockKeyhole } from "lucide-react";

import type { CanonicalCampaignReadinessState } from "../../readiness/canonical-campaign-readiness-controller";
import type { CampaignObjective, CampaignVisibility, WizardData, WizardFieldErrors, WizardFieldKey } from "../../types/campaign-wizard";
import { getFieldError } from "../../utils/validate-campaign-wizard";
import { campaignReadinessPresentation, CAMPAIGN_OBJECTIVES, scheduleSelectionPatch, showScheduledDates } from "./campaign-strategy-model";
import "./campaign-strategy.css";

const VISIBILITY: Array<{ value: CampaignVisibility; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "ELIGIBLE_CREATORS_ONLY", label: "Eligible Creators Only" },
  { value: "INVITE_ONLY", label: "Invite Only" },
];

type Props = {
  data: WizardData;
  errors: WizardFieldErrors;
  patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void;
  readiness: CanonicalCampaignReadinessState;
  retryReadiness: () => void;
  validateOnExit: (field: WizardFieldKey) => Promise<void>;
};

export function CampaignStrategyStep({ data, errors, patchData, readiness, retryReadiness, validateOnExit }: Props) {
  const metrics = campaignReadinessPresentation(readiness);
  return (
    <div className="campaign-strategy">
      <header className="create-wizard-step-head"><h1>Campaign Strategy</h1><p>Define the Campaign objective, publishing window and marketplace visibility.</p></header>

      <section className="campaign-strategy__section" aria-labelledby="basic-information-heading">
        <h2 id="basic-information-heading">Basic Information</h2>
        <Field label="Campaign Name" required error={getFieldError(errors, "name")}>
          <input className="cw-input" maxLength={60} value={data.name} placeholder="e.g., Summer Skin Reset" aria-invalid={Boolean(getFieldError(errors, "name"))} onChange={(event) => patchData({ name: event.target.value }, "name")} onBlur={() => void validateOnExit("name")} />
          <span className="campaign-strategy__counter" aria-label={`${data.name.length} of 60 characters`}>{data.name.length} / 60</span>
        </Field>
      </section>

      <section className="campaign-strategy__section" aria-labelledby="publishing-schedule-heading">
        <h2 id="publishing-schedule-heading">Publishing Schedule</h2>
        <div className="campaign-choice-grid campaign-choice-grid--two" role="radiogroup" aria-label="Publishing Schedule">
          <Choice selected={data.publishingSchedule === "EVERGREEN"} title="Evergreen" description="Always on, no end date." onSelect={() => patchData(scheduleSelectionPatch("EVERGREEN"), "publishingSchedule")} />
          <Choice selected={data.publishingSchedule === "SCHEDULED"} title="Scheduled" description="Defined start and end dates." onSelect={() => patchData(scheduleSelectionPatch("SCHEDULED"), "publishingSchedule")} />
        </div>
        {showScheduledDates(data.publishingSchedule) ? <div className="campaign-schedule-dates">
          <Field label="Publish From" required error={getFieldError(errors, "publishFrom")}><input type="date" className="cw-input" value={data.publishFrom} aria-invalid={Boolean(getFieldError(errors, "publishFrom"))} onChange={(event) => patchData({ publishFrom: event.target.value }, "publishFrom")} onBlur={() => void validateOnExit("publishFrom")} /></Field>
          <Field label="Publish Until" required error={getFieldError(errors, "publishUntil")}><input type="date" className="cw-input" value={data.publishUntil} aria-invalid={Boolean(getFieldError(errors, "publishUntil"))} onChange={(event) => patchData({ publishUntil: event.target.value }, "publishUntil")} onBlur={() => void validateOnExit("publishUntil")} /></Field>
          <p>These dates define the creator-content publishing window.</p>
        </div> : null}
      </section>

      <section className="campaign-strategy__section" aria-labelledby="campaign-objective-heading">
        <h2 id="campaign-objective-heading">Campaign Objective</h2>
        <p className="campaign-strategy__section-copy">Select the primary goal used to resolve Campaign success metrics.</p>
        <div className="campaign-choice-grid campaign-choice-grid--objectives" role="radiogroup" aria-label="Campaign Objective">
          {CAMPAIGN_OBJECTIVES.map((objective) => <Choice key={objective.value} selected={data.objective === objective.value} title={`${objective.name} — ${objective.outcome}`} description={objective.description} onSelect={() => patchData({ objective: objective.value as CampaignObjective }, "objective")} />)}
        </div>
        {getFieldError(errors, "objective") ? <p className="cw-field-error" role="alert">{getFieldError(errors, "objective")}</p> : null}
        <SuccessMetrics presentation={metrics} onRetry={retryReadiness} />
      </section>

      <section className="campaign-strategy__section" aria-labelledby="reach-distribution-heading">
        <h2 id="reach-distribution-heading">Reach &amp; Distribution</h2>
        <Field label="Platform"><div className="campaign-platform" aria-label="Instagram, selected and locked"><Instagram size={22} aria-hidden="true" /><div><strong>Instagram</strong><span>Instagram only for MVP</span></div><LockKeyhole size={18} aria-hidden="true" /></div></Field>
        <Field label="Visibility" required error={getFieldError(errors, "visibility")}>
          <div className="campaign-choice-grid campaign-choice-grid--visibility" role="radiogroup" aria-label="Visibility">
            {VISIBILITY.map((item) => <Choice key={item.value} selected={data.visibility === item.value} title={item.label} onSelect={() => patchData({ visibility: item.value }, "visibility")} />)}
          </div>
        </Field>
      </section>
    </div>
  );
}

function Choice({ selected, title, description, onSelect }: { selected: boolean; title: string; description?: string; onSelect: () => void }) {
  return <button type="button" role="radio" aria-checked={selected} className={`campaign-choice ${selected ? "campaign-choice--selected" : ""}`} onClick={onSelect}><span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span><span className="campaign-choice__indicator" aria-hidden="true">{selected ? <Check size={15} /> : null}</span></button>;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <div className={`cw-field ${error ? "cw-field--error" : ""}`}><span className="cw-label">{label}{required ? <span className="cw-required">Required</span> : null}</span>{children}{error ? <p className="cw-field-error" role="alert">{error}</p> : null}</div>;
}

function SuccessMetrics({ presentation, onRetry }: { presentation: ReturnType<typeof campaignReadinessPresentation>; onRetry: () => void }) {
  if (presentation.kind === "hidden") return null;
  if (presentation.kind === "resolving") return <div className="campaign-metrics campaign-metrics--status" role="status"><LoaderCircle className="campaign-metrics__spinner" size={18} aria-hidden="true" /><span>{presentation.title}</span></div>;
  if (presentation.kind === "retryable-failure") return <div className="campaign-metrics campaign-metrics--error" role="alert"><span>{presentation.message}</span><button type="button" onClick={onRetry}>Retry</button></div>;
  if (presentation.kind === "configuration-failure") return <div className="campaign-metrics campaign-metrics--error" role="alert">{presentation.message}</div>;
  return <div className="campaign-metrics"><h3>Success metrics</h3><div className="campaign-metrics__grid"><div><span>Primary</span><strong>{presentation.primary}</strong></div>{presentation.supporting.map((metric) => <div key={metric}><span>Supporting</span><strong>{metric}</strong></div>)}</div></div>;
}
