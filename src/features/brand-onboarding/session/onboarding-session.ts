const STORAGE_KEY = "ccs.brandOnboarding.v1";

export type BrandOnboardingSessionV1 = {
  leadId: string;
  brandProfileId?: string;
  normalizedUrl: string;
  confirmedIndustry?: "D2C" | "SAAS_AI" | "HEALTHCARE" | "OFFLINE_SERVICES";
};

export function saveBrandOnboardingSession(session: BrandOnboardingSessionV1): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadBrandOnboardingSession(): BrandOnboardingSessionV1 | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const v = parsed as {
      leadId?: unknown;
      brandProfileId?: unknown;
      normalizedUrl?: unknown;
      confirmedIndustry?: unknown;
    };
    if (
      typeof v.leadId !== "string" ||
      typeof v.normalizedUrl !== "string" ||
      (v.brandProfileId !== undefined && typeof v.brandProfileId !== "string")
    ) {
      return null;
    }
    const confirmedIndustry =
      v.confirmedIndustry === "D2C" ||
      v.confirmedIndustry === "SAAS_AI" ||
      v.confirmedIndustry === "HEALTHCARE" ||
      v.confirmedIndustry === "OFFLINE_SERVICES"
        ? v.confirmedIndustry
        : undefined;

    return {
      leadId: v.leadId,
      brandProfileId: v.brandProfileId,
      normalizedUrl: v.normalizedUrl,
      confirmedIndustry,
    };
  } catch {
    return null;
  }
}

export function clearBrandOnboardingSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
