export function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string" && value.trim() === "") {
    return "-";
  }
  if (typeof value === "number" && Number.isNaN(value)) {
    return "-";
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "-" : value.map((item) => displayValue(item)).join(", ");
  }
  return String(value);
}

export function formatReach(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${value.toFixed(1)}%`;
}

export function formatCurrencyUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
