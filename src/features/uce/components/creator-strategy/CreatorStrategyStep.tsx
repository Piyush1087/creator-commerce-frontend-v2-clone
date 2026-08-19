import type { ReactNode } from "react";
import type { WizardData, WizardFieldErrors, WizardFieldKey } from "../../types/campaign-wizard";
import { getFieldError } from "../../utils/validate-campaign-wizard";
import { AudienceAffinityPicker } from "../AudienceAffinityPicker";
import { AudienceGeographyPicker } from "../AudienceGeographyPicker";
import { CreatorArchetypePicker } from "./CreatorArchetypePicker";
import { GENDER_OPTIONS, formatInteger, parseGroupedInteger } from "./creator-strategy-model";
import "./creator-strategy.css";

type Props = { data: WizardData; patchData: (patch: Partial<WizardData>, touched?: WizardFieldKey) => void; errors: WizardFieldErrors; validateOnExit: (field: WizardFieldKey) => Promise<void> };

function Field({ id, label, required, optional, error, children, full = false }: { id: string; label: string; required?: boolean; optional?: boolean; error?: string; children: ReactNode; full?: boolean }) {
  return <div className={`cw-field ${full ? "cw-field--full" : ""} ${error ? "cw-field--error" : ""}`} id={`${id}-field`}>
    <label className="cw-label" htmlFor={id}>{label}{required ? <span className="cw-required">Required</span> : null}{optional ? <span className="cw-optional">Optional</span> : null}</label>
    {children}{error ? <p className="cw-field-error" id={`${id}-error`} role="alert">{error}</p> : null}
  </div>;
}

function GroupedNumber({ id, value, nullable, min, max, onChange, onBlur }: { id: string; value: number | null; nullable?: boolean; min: number; max?: number; onChange: (value: number | null) => void; onBlur: () => void }) {
  return <input id={id} className="cw-input" inputMode="numeric" value={formatInteger(value)} placeholder={nullable ? "No maximum" : undefined} aria-describedby={`${id}-error`} onChange={(event) => { const parsed = parseGroupedInteger(event.target.value); if (parsed == null && !nullable && event.target.value.trim()) return; onChange(parsed == null ? (nullable ? null : 0) : Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, parsed))); }} onBlur={onBlur} />;
}

export function CreatorStrategyStep({ data, patchData, errors, validateOnExit }: Props) {
  return <div className="create-wizard-step creator-strategy-step">
    <header className="create-wizard-step-head"><h2>Creator Strategy</h2><p>Define the creators and audience profile this Campaign should target.</p></header>
    <section className="creator-strategy-section" aria-labelledby="creator-profile-heading"><div className="creator-strategy-section-head"><h2 id="creator-profile-heading">Creator Profile</h2><p>Choose the creator styles and follower range that fit this Campaign.</p></div><div className="creator-strategy-grid">
      <Field id="creator-archetypes" label="Creator Archetypes" required full error={getFieldError(errors, "archetypes")}><CreatorArchetypePicker value={data.archetypes} onChange={(archetypes) => patchData({ archetypes }, "archetypes")} onBlur={() => void validateOnExit("archetypes")} /></Field>
      <Field id="minimum-followers" label="Minimum followers" required error={getFieldError(errors, "minimumFollowers")}><GroupedNumber id="minimum-followers" value={data.minimumFollowers} min={0} onChange={(minimumFollowers) => patchData({ minimumFollowers: minimumFollowers ?? 0 }, "minimumFollowers")} onBlur={() => void validateOnExit("minimumFollowers")} /></Field>
      <Field id="maximum-followers" label="Maximum followers" optional error={getFieldError(errors, "maximumFollowers")}><GroupedNumber id="maximum-followers" value={data.maximumFollowers} nullable min={0} onChange={(maximumFollowers) => patchData({ maximumFollowers }, "maximumFollowers")} onBlur={() => void validateOnExit("maximumFollowers")} /></Field>
    </div></section>
    <section className="creator-strategy-section" aria-labelledby="audience-match-heading"><div className="creator-strategy-section-head"><h2 id="audience-match-heading">Audience Match</h2><p>Describe the audience creators should already reach.</p></div><div className="creator-strategy-grid">
      <fieldset className={`cw-field cw-field--full ${getFieldError(errors, "audienceGender") ? "cw-field--error" : ""}`}><legend className="cw-label">Gender <span className="cw-required">Required</span></legend><div className="creator-gender-options">{GENDER_OPTIONS.map((option) => <label className={`creator-choice-card ${data.audienceGender === option.value ? "is-selected" : ""}`} key={option.value}><input type="radio" name="audience-gender" checked={data.audienceGender === option.value} onChange={() => patchData({ audienceGender: option.value }, "audienceGender")} onBlur={() => void validateOnExit("audienceGender")} /><span>{option.label}</span></label>)}</div>{getFieldError(errors, "audienceGender") ? <p className="cw-field-error" role="alert">{getFieldError(errors, "audienceGender")}</p> : null}</fieldset>
      <Field id="minimum-age" label="Minimum age" required error={getFieldError(errors, "audienceAgeMin")}><GroupedNumber id="minimum-age" value={data.audienceAgeMin} min={13} max={65} onChange={(audienceAgeMin) => patchData({ audienceAgeMin: audienceAgeMin ?? 13 }, "audienceAgeMin")} onBlur={() => void validateOnExit("audienceAgeMin")} /></Field>
      <Field id="maximum-age" label="Maximum age" required error={getFieldError(errors, "audienceAgeMax")}><GroupedNumber id="maximum-age" value={data.audienceAgeMax} min={13} max={65} onChange={(audienceAgeMax) => patchData({ audienceAgeMax: audienceAgeMax ?? 13 }, "audienceAgeMax")} onBlur={() => void validateOnExit("audienceAgeMax")} /></Field>
      <Field id="audience-geography" label="Geography" required full error={getFieldError(errors, "audienceGeographies")}><AudienceGeographyPicker value={data.audienceGeographies} onChange={(audienceGeographies) => patchData({ audienceGeographies }, "audienceGeographies")} onBlur={() => void validateOnExit("audienceGeographies")} /></Field>
      <Field id="audience-affinities" label="Affinities" optional full error={getFieldError(errors, "affinityIds")}><AudienceAffinityPicker value={data.affinityIds} onChange={(affinityIds) => patchData({ affinityIds }, "affinityIds")} onBlur={() => void validateOnExit("affinityIds")} /></Field>
    </div></section>
  </div>;
}
