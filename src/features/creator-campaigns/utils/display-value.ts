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

export function displayCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "-";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatClosedDate(iso: string | null | undefined): string {
  if (!iso) {
    return "-";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
