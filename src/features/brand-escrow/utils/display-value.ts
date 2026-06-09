import { formatEscrowCurrency } from "./format-escrow-currency";

export const EMPTY_DISPLAY = "—";

export function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : EMPTY_DISPLAY;
}

export function displayCurrency(
  amount: number | null | undefined,
  currency?: string | null,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return EMPTY_DISPLAY;
  }
  if (!currency?.trim()) {
    return EMPTY_DISPLAY;
  }
  return formatEscrowCurrency(amount, currency);
}
