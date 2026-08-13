import { useState } from "react";
import type { CanonicalGeography } from "../types/campaign-wizard";
import { unavailableGeographySearchAdapter, type GeographySearchAdapter, type GeographySuggestion } from "../geography/geography-search";

export function CanonicalGeographyPicker({ value, onChange, onBlur, adapter = unavailableGeographySearchAdapter }: {
  value: CanonicalGeography[];
  onChange: (value: CanonicalGeography[]) => void;
  onBlur: () => void;
  adapter?: GeographySearchAdapter;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeographySuggestion[]>([]);
  const search = async (next: string) => {
    setQuery(next);
    setSuggestions(next.trim().length >= 2 ? await adapter.search(next.trim()) : []);
  };
  const select = async (suggestion: GeographySuggestion) => {
    const geography = await adapter.resolve(suggestion.id);
    if (!value.some((item) => item.scope === geography.scope && item.label === geography.label)) {
      onChange([...value, { ...geography, is_primary: value.length === 0 }]);
    }
    setQuery(""); setSuggestions([]);
  };
  return <div className="cw-token-input">
    <div className="cw-token-list">
      {value.map((item) => <span key={`${item.scope}:${item.label}`} className="cw-token">{item.label}<button type="button" onClick={() => onChange(value.filter((candidate) => candidate !== item))}>×</button></span>)}
      <input value={query} disabled={!adapter.configured} onChange={(event) => void search(event.target.value)} onBlur={onBlur} placeholder={adapter.configured ? "Search country, region, or city…" : "Google Places is not configured"} />
    </div>
    {suggestions.length ? <div role="listbox">{suggestions.map((item) => <button type="button" role="option" key={item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => void select(item)}>{item.label}</button>)}</div> : null}
  </div>;
}
