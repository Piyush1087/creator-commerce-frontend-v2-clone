const CURRENCY_PREFIX: Record<string, string> = {
  INR: "₹",
  USD: "$",
};

export function currencyInputPrefix(currency: string | null | undefined): string {
  const code = currency?.trim().toUpperCase();
  if (!code) {
    return "₹";
  }
  return CURRENCY_PREFIX[code] ?? code;
}
