/** Keep in sync with backend `brand-scan-gate.config.ts`. */
export const SCAN_LIMIT_WINDOW_DAYS = 7;
export const SCAN_LIMIT_MAX_SCANS = 5;

export type ScanLimitReason = "DOMAIN_LIMIT" | "IP_LIMIT";

export function scanLimitVerificationCopy(
  reason: ScanLimitReason,
  domain: string,
): { title: string; body: string } {
  const windowLabel = `${SCAN_LIMIT_WINDOW_DAYS}-day rolling window`;
  const capLabel = String(SCAN_LIMIT_MAX_SCANS);

  if (reason === "DOMAIN_LIMIT") {
    return {
      title: "Scan limit reached for this brand",
      body: `We've already run ${capLabel} surface scans for ${domain} in the past ${windowLabel}. Verify your work email to continue.`,
    };
  }

  return {
    title: "Scan limit reached from your network",
    body: `Too many surface scans from your IP address in the past ${windowLabel} (limit: ${capLabel} scans across brands). Verify your work email to continue.`,
  };
}
