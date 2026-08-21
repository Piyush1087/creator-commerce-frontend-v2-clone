const STORAGE_KEY = "ccs.brandOnboarding.v1";
const BRAND_PREVIEW_PENDING_STORAGE_KEY = "ccs.brandPreview.pending.v1";

export type BrandOnboardingSessionV1 = {
  leadId: string;
  brandProfileId: string;
  normalizedUrl: string;
};

export type BrandPreviewPendingSessionV1 = {
  leadId: string;
  normalizedUrl: string;
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
    };
    if (
      typeof v.leadId !== "string" ||
      typeof v.brandProfileId !== "string" ||
      typeof v.normalizedUrl !== "string"
    ) {
      return null;
    }
    return {
      leadId: v.leadId,
      brandProfileId: v.brandProfileId,
      normalizedUrl: v.normalizedUrl,
    };
  } catch {
    return null;
  }
}

export function clearBrandOnboardingSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function saveBrandPreviewPendingSession(
  session: BrandPreviewPendingSessionV1,
): void {
  sessionStorage.setItem(BRAND_PREVIEW_PENDING_STORAGE_KEY, JSON.stringify(session));
}

export function loadBrandPreviewPendingSession(): BrandPreviewPendingSessionV1 | null {
  const raw = sessionStorage.getItem(BRAND_PREVIEW_PENDING_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const v = parsed as { leadId?: unknown; normalizedUrl?: unknown };
    if (typeof v.leadId !== "string" || typeof v.normalizedUrl !== "string") {
      return null;
    }
    return { leadId: v.leadId, normalizedUrl: v.normalizedUrl };
  } catch {
    return null;
  }
}

export function clearBrandPreviewPendingSession(): void {
  sessionStorage.removeItem(BRAND_PREVIEW_PENDING_STORAGE_KEY);
}
