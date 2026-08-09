import type { MarketplaceCompensationTeaser } from "../contracts/creator-campaigns.contracts";
import { displayCurrency, displayValue } from "./display-value";

export function formatCompensationTeaser(
  teaser: MarketplaceCompensationTeaser | null | undefined,
): { label: string; value: string } {
  if (!teaser) {
    return { label: "Compensation", value: "-" };
  }

  if (teaser.compensation_type === "FIXED_FEE") {
    return {
      label: "Fixed fee",
      value: displayCurrency(teaser.fixed_fee_amount),
    };
  }

  if (teaser.compensation_type === "NEGOTIABLE") {
    const min = teaser.negotiable_min_fee;
    const max = teaser.negotiable_max_fee;
    if (min !== null && max !== null) {
      return {
        label: "Negotiable range",
        value: `${displayCurrency(min)} – ${displayCurrency(max)}`,
      };
    }
    return { label: "Negotiable", value: "-" };
  }

  return {
    label: displayValue(teaser.compensation_type),
    value: "-",
  };
}

export function matchTierFromScore(
  score: number | null,
): "high" | "medium" | "none" {
  if (score === null || score === undefined) {
    return "none";
  }
  if (score >= 80) {
    return "high";
  }
  if (score >= 50) {
    return "medium";
  }
  return "none";
}

export function formatApplicationScopeLabel(
  scope: string | null | undefined,
  isGuest: boolean,
): string {
  if (isGuest) {
    return "Public brief";
  }
  switch (scope) {
    case "EVERYONE":
      return "Open pool";
    case "ELIGIBLE_ONLY":
      return "Eligible only";
    case "INVITED_ONLY":
      return "Invite only";
    case "DIRECT_BYPASS":
      return "VIP invite";
    case "VETTED_STEALTH":
      return "Vetted circle";
    case "BLENDED_SMART_FUNNEL":
      return "Smart funnel";
    default:
      return scope ? scope.replace(/_/g, " ").toLowerCase() : "-";
  }
}
