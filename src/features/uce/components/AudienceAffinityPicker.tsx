import { useMemo, useState } from "react";

import { AUDIENCE_AFFINITIES } from "../canonical/audience-affinities";
import "./CampaignCanonicalPickers.css";

export function AudienceAffinityPicker({
  value,
  onChange,
  onBlur,
  max = 5,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  onBlur?: () => void;
  max?: number;
}) {
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => AUDIENCE_AFFINITIES.filter((item) => value.includes(item.id)),
    [value],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return AUDIENCE_AFFINITIES.filter((item) => !value.includes(item.id));
    return AUDIENCE_AFFINITIES.filter((item) => {
      if (value.includes(item.id)) return false;
      return [item.id, item.label, ...item.aliases]
        .some((candidate) => candidate.toLowerCase().includes(needle));
    });
  }, [query, value]);

  const remove = (id: string) => onChange(value.filter((item) => item !== id));
  const add = (id: string) => {
    if (value.includes(id) || value.length >= max) return;
    onChange([...value, id]);
    setQuery("");
  };

  return (
    <div className="cw-canonical-picker" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onBlur?.();
    }}>
      {selected.length ? (
        <div className="cw-format-chips" style={{ paddingLeft: 0 }}>
          {selected.map((item) => (
            <button
              key={item.id}
              type="button"
              className="cw-format-chip is-active"
              onClick={() => remove(item.id)}
              aria-label={`Remove ${item.label}`}
            >
              {item.label} ×
            </button>
          ))}
        </div>
      ) : null}

      <input
        className="cw-input"
        aria-label="Search affinities"
        value={query}
        disabled={value.length >= max}
        placeholder={value.length >= max ? `Maximum ${max} affinities selected` : "Search affinities"}
        onChange={(event) => setQuery(event.target.value)}
      />

      {value.length < max ? (
        <div className="cw-picker-results" role="listbox" aria-label="Audience affinity results">
          {results.slice(0, 12).map((item) => (
            <button key={item.id} type="button" role="option" aria-selected="false" className="cw-picker-option" onClick={() => add(item.id)}>
              <strong>{item.label}</strong>
              <span>{item.aliases.slice(0, 3).join(" · ")}</span>
            </button>
          ))}
          {!results.length ? <p className="cw-hint">No canonical affinity matches.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
