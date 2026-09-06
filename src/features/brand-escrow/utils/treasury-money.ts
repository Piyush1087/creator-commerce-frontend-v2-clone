const BACKEND_SCALE = 4;
const USER_FRACTION_DIGITS = 2;

export type ParsedTreasuryAmount = {
  majorAmount: number;
  scaledAmount: bigint;
  canonical: string;
};

function decimalToScaled(raw: string, maximumFractionDigits: number): bigint | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) return null;
  const fraction = match[2] ?? "";
  if (fraction.length > maximumFractionDigits || fraction.length > BACKEND_SCALE)
    return null;
  const whole = match[1].replace(/^0+(?=\d)/, "");
  const padded = fraction.padEnd(BACKEND_SCALE, "0");
  try {
    return BigInt(whole) * 10n ** BigInt(BACKEND_SCALE) + BigInt(padded || "0");
  } catch {
    return null;
  }
}

export function parseTreasuryAmount(raw: string): ParsedTreasuryAmount | null {
  const normalized = raw.trim().replace(/,/g, "");
  const scaledAmount = decimalToScaled(normalized, USER_FRACTION_DIGITS);
  if (scaledAmount === null || scaledAmount <= 0n) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const canonical = `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(USER_FRACTION_DIGITS, "0")}`;
  const majorAmount = Number(canonical);
  if (!Number.isSafeInteger(Number(whole)) || !Number.isFinite(majorAmount))
    return null;
  return { majorAmount, scaledAmount, canonical };
}

export function backendAmountToScaled(amount: number): bigint | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const raw = String(amount);
  if (/e/i.test(raw)) return null;
  return decimalToScaled(raw, BACKEND_SCALE);
}

export function amountIsWithinAuthoritativeLimit(
  amount: ParsedTreasuryAmount,
  authoritativeLimit: number,
): boolean {
  const limit = backendAmountToScaled(authoritativeLimit);
  return limit !== null && amount.scaledAmount <= limit;
}

export function meetsIndiaTopUpMinimum(
  amount: ParsedTreasuryAmount,
  currency: string,
): boolean {
  if (currency !== "INR") return true;
  const minimum = decimalToScaled("5000", 0);
  return minimum !== null && amount.scaledAmount >= minimum;
}
