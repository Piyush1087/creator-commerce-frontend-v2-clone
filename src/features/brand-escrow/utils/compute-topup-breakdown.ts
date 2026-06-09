import type { EscrowTopUpBreakdown } from "../types";

export function computeTopUpBreakdown(
  allocation: number,
  currency: string,
): EscrowTopUpBreakdown | null {
  if (!Number.isFinite(allocation) || allocation <= 0) {
    return null;
  }

  const gatewaySurcharge = allocation * 0.02;
  const surchargeGst = currency === "INR" ? gatewaySurcharge * 0.18 : 0;
  const totalInvoiced = allocation + gatewaySurcharge + surchargeGst;

  return {
    allocation,
    gatewaySurcharge,
    surchargeGst,
    totalInvoiced,
  };
}
