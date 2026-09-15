import { useState } from "react";
import { Button, TextField } from "../../../design-system/aurora";
import {
  CREATOR_ARCHETYPES,
  archetypeLabel,
  toggleCanonicalValue,
} from "../../uce/components/creator-strategy/creator-strategy-model";
import {
  CREATOR_BRAND_NICHE_IDS,
  CREATOR_BRAND_VOICE_IDS,
} from "../contracts/creator-brand-taxonomies";
import type { CreatorBrandProfileInput } from "../contracts/creator-brand-profile.contract";
import type { CreatorBrandCandidate } from "../contracts/creator-brand-suggestions.schema";
import { CreatorBrandProfileInputSchema } from "../contracts/creator-brand-profile.contract";

export type ProfileField = Exclude<
  keyof CreatorBrandProfileInput,
  "archetypeState"
>;
export const fieldLabels: Record<ProfileField, string> = {
  headline: "Headline / Positioning",
  commercialBio: "Commercial Bio",
  primaryNicheIds: "Primary Niches",
  languages: "Languages I create in",
  creatorArchetypeIds: "Creator Archetypes",
  voiceDescriptorIds: "Voice descriptors",
  voiceDescription: "Voice description",
  visualStyleDescriptors: "Visual-style descriptors",
  palette: "Palette",
};
export const sections: Array<{ title: string; fields: ProfileField[] }> = [
  {
    title: "Profile & Positioning",
    fields: ["headline", "commercialBio", "primaryNicheIds", "languages"],
  },
  { title: "Creator Style", fields: ["creatorArchetypeIds"] },
  {
    title: "Voice & Personality",
    fields: ["voiceDescriptorIds", "voiceDescription"],
  },
  { title: "Visual Identity", fields: ["visualStyleDescriptors", "palette"] },
];
export function readableId(id: string) {
  return id
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
export function languageLabel(tag: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}
export function valueLabel(
  field: ProfileField,
  value: CreatorBrandProfileInput[ProfileField],
) {
  if (value === null || (Array.isArray(value) && !value.length))
    return "Not yet configured";
  if (!Array.isArray(value)) return value;
  return value
    .map((item) =>
      field === "creatorArchetypeIds"
        ? archetypeLabel(item)
        : field === "languages"
          ? `${languageLabel(item)} (${item})`
          : field === "primaryNicheIds" || field === "voiceDescriptorIds"
            ? readableId(item)
            : item,
    )
    .join(" · ");
}
export function candidateTarget(
  candidate: CreatorBrandCandidate,
): ProfileField {
  return candidate.field === "languageTags"
    ? "languages"
    : candidate.field === "paletteCue"
      ? "palette"
      : candidate.field;
}
export function candidateDraft(
  profile: CreatorBrandProfileInput,
  candidate: CreatorBrandCandidate,
) {
  const target = candidateTarget(candidate);
  if (typeof candidate.value === "object" && !Array.isArray(candidate.value))
    return null;
  const next = {
    ...profile,
    [target]: candidate.value,
    ...(target === "creatorArchetypeIds"
      ? { archetypeState: "CONFIRMED" }
      : {}),
  };
  const parsed = CreatorBrandProfileInputSchema.safeParse(next);
  return parsed.success ? parsed.data : null;
}
function CanonicalPicker({
  field,
  values,
  onChange,
  error,
}: {
  field: "primaryNicheIds" | "voiceDescriptorIds" | "creatorArchetypeIds";
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const options: readonly (readonly [string, string])[] =
    field === "creatorArchetypeIds"
      ? CREATOR_ARCHETYPES
      : (field === "primaryNicheIds"
          ? CREATOR_BRAND_NICHE_IDS
          : CREATOR_BRAND_VOICE_IDS
        ).map((id) => [id, readableId(id)]);
  const results = options.filter(([id, label]) =>
    `${id} ${label}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="creator-brand-picker">
      <p id={`${field}-limit`}>
        {values.length} of 3 selected. Empty selection means not yet configured.
      </p>
      <div className="creator-brand-tokens">
        {values.map((id) => (
          <Button
            variant="secondary"
            key={id}
            aria-label={`Remove ${options.find(([value]) => value === id)?.[1]}`}
            onClick={() => onChange(toggleCanonicalValue(values, id, 3))}
          >
            {options.find(([value]) => value === id)?.[1]} ×
          </Button>
        ))}
      </div>
      <TextField
        label={`Search ${fieldLabels[field]}`}
        aria-label={`Search ${fieldLabels[field]}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-describedby={`${field}-limit ${field}-error`}
      />
      <div
        className="creator-brand-options"
        role="group"
        aria-label={fieldLabels[field]}
      >
        {results.map(([id, label]) => (
          <Button
            key={id}
            variant={values.includes(id) ? "primary" : "secondary"}
            aria-pressed={values.includes(id)}
            disabled={!values.includes(id) && values.length >= 3}
            onClick={() => onChange(toggleCanonicalValue(values, id, 3))}
          >
            {label}
          </Button>
        ))}
        {!results.length && <p>No matching canonical values.</p>}
      </div>
      <p id={`${field}-error`} className="creator-brand-error">
        {error}
      </p>
    </div>
  );
}
function TokenInput({
  field,
  values,
  onChange,
  error,
}: {
  field: "languages" | "visualStyleDescriptors" | "palette";
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}) {
  const [entry, setEntry] = useState("");
  const maximum = field === "languages" ? 10 : 5;
  const add = () => {
    if (entry.trim() && values.length < maximum) {
      onChange([...values, entry.trim()]);
      setEntry("");
    }
  };
  return (
    <div>
      <div className="creator-brand-tokens">
        {values.map((value, index) => (
          <Button
            variant="secondary"
            key={`${value}-${index}`}
            aria-label={`Remove ${value}`}
            onClick={() => onChange(values.filter((_, i) => i !== index))}
          >
            {field === "languages"
              ? `${languageLabel(value)} (${value})`
              : value}{" "}
            ×
          </Button>
        ))}
      </div>
      <TextField
        label={`Add ${fieldLabels[field]}`}
        aria-label={`Add ${fieldLabels[field]}`}
        value={entry}
        maxLength={100}
        disabled={values.length >= maximum}
        onChange={(event) => setEntry(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add();
          }
        }}
        aria-describedby={`${field}-help ${field}-error`}
      />
      <Button
        variant="secondary"
        disabled={!entry.trim() || values.length >= maximum}
        onClick={add}
      >
        Add {fieldLabels[field]}
      </Button>
      <p id={`${field}-help`}>
        {values.length} of {maximum} added. Add each value before Save.{" "}
        {field === "languages"
          ? "Use BCP-47 tags, for example en or hi-IN."
          : field === "palette"
            ? "Enter exact #RRGGBB hex values; color words are not hex."
            : "Each descriptor may contain up to 100 characters."}
      </p>
      <p id={`${field}-error`} className="creator-brand-error">
        {error}
      </p>
    </div>
  );
}
export function CreatorBrandField({
  field,
  draft,
  onChange,
  error,
}: {
  field: ProfileField;
  draft: CreatorBrandProfileInput;
  onChange: (draft: CreatorBrandProfileInput) => void;
  error?: string;
}) {
  const update = (value: unknown) =>
    onChange({
      ...draft,
      [field]: value,
      ...(field === "creatorArchetypeIds"
        ? {
            archetypeState:
              Array.isArray(value) && value.length
                ? "CONFIRMED"
                : "UNCONFIGURED",
          }
        : {}),
    });
  if (
    field === "primaryNicheIds" ||
    field === "voiceDescriptorIds" ||
    field === "creatorArchetypeIds"
  )
    return (
      <CanonicalPicker
        field={field}
        values={draft[field]}
        onChange={update}
        error={error}
      />
    );
  if (
    field === "languages" ||
    field === "palette" ||
    field === "visualStyleDescriptors"
  )
    return (
      <TokenInput
        field={field}
        values={draft[field] ?? []}
        onChange={update}
        error={error}
      />
    );
  return (
    <div>
      <TextField
        label={fieldLabels[field]}
        aria-label={fieldLabels[field]}
        multiline={true}
        value={draft[field] ?? ""}
        maxLength={
          field === "commercialBio" ? 1000 : field === "headline" ? 160 : 300
        }
        onChange={(event) => update(event.target.value || null)}
        aria-invalid={!!error}
        aria-describedby={`${field}-error`}
      />
      <p id={`${field}-error`} className="creator-brand-error">
        {error}
      </p>
    </div>
  );
}
