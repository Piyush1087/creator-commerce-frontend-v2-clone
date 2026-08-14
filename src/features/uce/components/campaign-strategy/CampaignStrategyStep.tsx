import { Check, Instagram, LoaderCircle, LockKeyhole } from "lucide-react";
import { forwardRef, useRef, type KeyboardEvent, type ReactNode } from "react";

import type { CanonicalCampaignReadinessState } from "../../readiness/canonical-campaign-readiness-controller";
import type { CampaignObjective, CampaignVisibility, WizardData, WizardFieldErrors, WizardFieldKey } from "../../types/campaign-wizard";
import { getFieldError } from "../../utils/validate-campaign-wizard";
import { campaignReadinessPresentation, CAMPAIGN_OBJECTIVES, radioNavigationIndex, scheduleSelectionPatch, showScheduledDates } from "./campaign-strategy-model";
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
  const nameError = getFieldError(errors, "name");
  const fromError = getFieldError(errors, "publishFrom");
  const untilError = getFieldError(errors, "publishUntil");
  const objectiveError = getFieldError(errors, "objective");
  const visibilityError = getFieldError(errors, "visibility");
  return (
    <div className="campaign-strategy">
      <header className="create-wizard-step-head"><h2>Campaign Strategy</h2><p>Define the Campaign objective, publishing window and marketplace visibility.</p></header>

      <section className="campaign-strategy__section" aria-labelledby="basic-information-heading">
        <h2 id="basic-information-heading">Basic Information</h2>
        <Field id="campaign-name" label="Campaign Name" required error={nameError}>
          <input id="campaign-name" className="cw-input" maxLength={60} value={data.name} placeholder="e.g., Summer Skin Reset" aria-invalid={nameError ? true : undefined} aria-describedby={["campaign-name-counter", nameError ? "campaign-name-error" : null].filter(Boolean).join(" ")} onChange={(event) => patchData({ name: event.target.value }, "name")} onBlur={() => void validateOnExit("name")} />
          <span id="campaign-name-counter" className="campaign-strategy__counter" aria-label={`${data.name.length} of 60 characters`}>{data.name.length} / 60</span>
        </Field>
      </section>

      <section className="campaign-strategy__section" aria-labelledby="publishing-schedule-heading">
        <h2 id="publishing-schedule-heading">Publishing Schedule</h2>
        <ChoiceGroup className="campaign-choice-grid campaign-choice-grid--two" labelledBy="publishing-schedule-heading" value={data.publishingSchedule} options={[{ value: "EVERGREEN", title: "Evergreen", description: "Always on, no end date." }, { value: "SCHEDULED", title: "Scheduled", description: "Defined start and end dates." }]} onSelect={(value) => patchData(scheduleSelectionPatch(value), "publishingSchedule")} />
        {showScheduledDates(data.publishingSchedule) ? <div className="campaign-schedule-dates">
          <Field id="publish-from" label="Publish From" required error={fromError}><input id="publish-from" type="date" className="cw-input" value={data.publishFrom} aria-invalid={fromError ? true : undefined} aria-describedby={["publishing-window-helper", fromError ? "publish-from-error" : null].filter(Boolean).join(" ")} onChange={(event) => patchData({ publishFrom: event.target.value }, "publishFrom")} onBlur={() => void validateOnExit("publishFrom")} /></Field>
          <Field id="publish-until" label="Publish Until" required error={untilError}><input id="publish-until" type="date" className="cw-input" value={data.publishUntil} aria-invalid={untilError ? true : undefined} aria-describedby={["publishing-window-helper", untilError ? "publish-until-error" : null].filter(Boolean).join(" ")} onChange={(event) => patchData({ publishUntil: event.target.value }, "publishUntil")} onBlur={() => void validateOnExit("publishUntil")} /></Field>
          <p id="publishing-window-helper">These dates define the creator-content publishing window.</p>
        </div> : null}
      </section>

      <section className="campaign-strategy__section" aria-labelledby="campaign-objective-heading">
        <h2 id="campaign-objective-heading">Campaign Objective</h2>
        <p className="campaign-strategy__section-copy">Select the primary goal used to resolve Campaign success metrics.</p>
        <ChoiceGroup className="campaign-choice-grid campaign-choice-grid--objectives" labelledBy="campaign-objective-heading" errorId={objectiveError ? "campaign-objective-error" : undefined} value={data.objective} options={CAMPAIGN_OBJECTIVES.map((objective) => ({ value: objective.value, title: `${objective.name} — ${objective.outcome}`, description: objective.description }))} onSelect={(value) => patchData({ objective: value as CampaignObjective }, "objective")} />
        {objectiveError ? <p id="campaign-objective-error" className="cw-field-error" role="alert">{objectiveError}</p> : null}
        <SuccessMetrics presentation={metrics} onRetry={retryReadiness} />
      </section>

      <section className="campaign-strategy__section" aria-labelledby="reach-distribution-heading">
        <h2 id="reach-distribution-heading">Reach &amp; Distribution</h2>
        <Field label="Platform"><div className="campaign-platform" aria-label="Instagram, selected and locked"><Instagram size={22} aria-hidden="true" /><div><strong>Instagram</strong><span>Instagram only for MVP</span></div><LockKeyhole size={18} aria-hidden="true" /></div></Field>
        <Field label="Visibility" labelId="campaign-visibility-label" required error={visibilityError}>
          <ChoiceGroup className="campaign-choice-grid campaign-choice-grid--visibility" labelledBy="campaign-visibility-label" errorId={visibilityError ? "campaign-visibility-label-error" : undefined} value={data.visibility} options={VISIBILITY.map((item) => ({ value: item.value, title: item.label }))} onSelect={(value) => patchData({ visibility: value as CampaignVisibility }, "visibility")} />
        </Field>
      </section>
    </div>
  );
}

function ChoiceGroup<T extends string>({ className, labelledBy, errorId, value, options, onSelect }: { className: string; labelledBy: string; errorId?: string; value: T; options: ReadonlyArray<{ value: T; title: string; description?: string }>; onSelect: (value: T) => void }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const valueIndex = options.findIndex((option) => option.value === value);
  const tabbableIndex = valueIndex < 0 ? 0 : valueIndex;
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex = radioNavigationIndex(event.key, index, options.length);
    if (nextIndex == null) return;
    event.preventDefault();
    onSelect(options[nextIndex].value);
    refs.current[nextIndex]?.focus();
  };
  return <div className={className} role="radiogroup" aria-labelledby={labelledBy} aria-invalid={errorId ? true : undefined} aria-describedby={errorId}>{options.map((option, index) => <Choice key={option.value} ref={(node) => { refs.current[index] = node; }} selected={option.value === value} tabbable={index === tabbableIndex} title={option.title} description={option.description} onKeyDown={(event) => handleKeyDown(event, index)} onSelect={() => onSelect(option.value)} />)}</div>;
}

const Choice = forwardRef<HTMLButtonElement, { selected: boolean; tabbable: boolean; title: string; description?: string; onSelect: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }>(function Choice({ selected, tabbable, title, description, onSelect, onKeyDown }, ref) {
  return <button ref={ref} type="button" role="radio" aria-checked={selected} tabIndex={tabbable ? 0 : -1} className={`campaign-choice ${selected ? "campaign-choice--selected" : ""}`} onKeyDown={onKeyDown} onClick={onSelect}><span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span><span className="campaign-choice__indicator" aria-hidden="true">{selected ? <Check size={15} /> : null}</span></button>;
});

function Field({ id, label, labelId, required, error, children }: { id?: string; label: string; labelId?: string; required?: boolean; error?: string; children: ReactNode }) {
  const labelContent = <>{label}{required ? <span className="cw-required">Required</span> : null}</>;
  return <div className={`cw-field ${error ? "cw-field--error" : ""}`}>{id ? <label id={labelId} className="cw-label" htmlFor={id}>{labelContent}</label> : <span id={labelId} className="cw-label">{labelContent}</span>}{children}{error ? <p className="cw-field-error" id={`${id ?? labelId}-error`} role="alert">{error}</p> : null}</div>;
}

function SuccessMetrics({ presentation, onRetry }: { presentation: ReturnType<typeof campaignReadinessPresentation>; onRetry: () => void }) {
  if (presentation.kind === "hidden") return null;
  if (presentation.kind === "resolving") return <div className="campaign-metrics campaign-metrics--status" role="status"><LoaderCircle className="campaign-metrics__spinner" size={18} aria-hidden="true" /><span>{presentation.title}</span></div>;
  if (presentation.kind === "retryable-failure") return <div className="campaign-metrics campaign-metrics--error" role="alert"><span>{presentation.message}</span><button type="button" onClick={onRetry}>Retry</button></div>;
  if (presentation.kind === "configuration-failure") return <div className="campaign-metrics campaign-metrics--error" role="alert">{presentation.message}</div>;
  return <div className="campaign-metrics"><h3>Success metrics</h3><div className="campaign-metrics__grid"><div><span>Primary</span><strong>{presentation.primary}</strong></div>{presentation.supporting.map((metric) => <div key={metric}><span>Supporting</span><strong>{metric}</strong></div>)}</div></div>;
}
