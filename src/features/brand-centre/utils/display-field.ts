/** Temporary empty-state display until conditional field rendering ships. */
export const EMPTY_FIELD = "-";

export function displayField(value: string | null | undefined): string {
  if (value == null) {
    return EMPTY_FIELD;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : EMPTY_FIELD;
}

export function displayList(values: string[] | null | undefined): string[] {
  if (!values || values.length === 0) {
    return [EMPTY_FIELD];
  }
  const filtered = values.map((v) => v.trim()).filter((v) => v.length > 0);
  return filtered.length > 0 ? filtered : [EMPTY_FIELD];
}

export function hasDisplayValue(value: string): boolean {
  return value !== EMPTY_FIELD;
}

export function displayPercentLift(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_FIELD;
  }
  return `+${value}%`;
}
