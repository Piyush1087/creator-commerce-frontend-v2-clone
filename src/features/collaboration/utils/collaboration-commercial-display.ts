export function formatCommercialAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "Not available";
  const normalizedCurrency = currency?.trim().toUpperCase();
  if (!normalizedCurrency) return new Intl.NumberFormat().format(amount);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: normalizedCurrency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${normalizedCurrency} ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)}`;
  }
}
