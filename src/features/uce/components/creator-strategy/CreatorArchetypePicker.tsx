import { useMemo, useState } from "react";
import { CREATOR_ARCHETYPE_MAX, archetypeLabel, filterArchetypes, toggleCanonicalValue } from "./creator-strategy-model";

export function CreatorArchetypePicker({ value, onChange, onBlur }: { value: string[]; onChange: (value: string[]) => void; onBlur: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterArchetypes(query, value), [query, value]);
  const atMaximum = value.length >= CREATOR_ARCHETYPE_MAX;
  return <div className="cw-controlled-picker" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onBlur(); }}>
    {value.length ? <div className="cw-selected-chips" aria-label="Selected creator archetypes">{value.map((id) => <button type="button" className="cw-selection-chip" key={id} onClick={() => onChange(toggleCanonicalValue(value, id, CREATOR_ARCHETYPE_MAX))} aria-label={`Remove ${archetypeLabel(id)}`}>{archetypeLabel(id)} <span aria-hidden="true">×</span></button>)}</div> : null}
    <input className="cw-input" aria-label="Search creator archetypes" placeholder={atMaximum ? "Maximum 5 archetypes selected" : "Search creator archetypes"} value={query} disabled={atMaximum} onChange={(event) => setQuery(event.target.value)} />
    {!atMaximum && (query || !value.length) ? <div className="cw-picker-results" role="listbox" aria-label="Creator archetype results">{results.slice(0, 10).map(([id, label]) => <button key={id} type="button" role="option" aria-selected="false" className="cw-picker-option" onClick={() => { onChange(toggleCanonicalValue(value, id, CREATOR_ARCHETYPE_MAX)); setQuery(""); }}><strong>{label}</strong></button>)}{!results.length ? <p className="cw-picker-message">No canonical archetypes match your search.</p> : null}</div> : null}
    <p className="cw-hint">Select 1–5 archetypes from the Creator Shop taxonomy.</p>
  </div>;
}
