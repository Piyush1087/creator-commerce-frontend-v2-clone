import type {
  DiscoverValidateBrandActive,
  DiscoverValidateOrgClaimed,
  DiscoverValidateVerificationRequired,
} from "./contracts/discovery.contracts";
import type { SurfaceScanGatePayload } from "./api/brand-client";

export type LandingGateRedirect =
  | { kind: "rate_limit"; message?: string }
  | {
      kind: "verification_required";
      payload: DiscoverValidateVerificationRequired;
      leadId?: string;
      normalizedUrl?: string;
    }
  | { kind: "brand_active"; payload: DiscoverValidateBrandActive }
  | { kind: "org_claimed"; payload: DiscoverValidateOrgClaimed };

export type LandingGateRedirectState = {
  gate?: LandingGateRedirect;
};

export function landingStateFromScanGate(
  gate: SurfaceScanGatePayload,
  ctx: { leadId: string; normalizedUrl: string },
): LandingGateRedirect {
  if (gate.outcome === "verification_required") {
    return {
      kind: "verification_required",
      payload: gate,
      leadId: ctx.leadId,
      normalizedUrl: ctx.normalizedUrl,
    };
  }
  if (gate.outcome === "brand_active") {
    return { kind: "brand_active", payload: gate };
  }
  return { kind: "org_claimed", payload: gate };
}
