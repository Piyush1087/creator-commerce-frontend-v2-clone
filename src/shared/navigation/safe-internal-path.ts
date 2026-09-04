const INTERNAL_BASE = "https://navigation.invalid";
const ENCODED_SEPARATOR = /%(?:2f|5c)/iu;
const SAFE_SEGMENT = "[A-Za-z0-9][A-Za-z0-9_-]{0,127}";

const SUPPORTED_PATHS = [
  /^\/$/u,
  /^\/(?:login|forgot-password|reset-password|terms|privacy)$/u,
  /^\/brand\/team-invitations\/accept$/u,
  new RegExp(`^/brand/${SAFE_SEGMENT}$`, "u"),
  /^\/brand\/(?:dashboard|collaborations|collaboration-page|payouts)$/u,
  /^\/brand\/settings(?:\/(?:general|integrations|billing|escrow))?$/u,
  new RegExp(
    `^/brand/uce/campaigns(?:/(?:create|${SAFE_SEGMENT}))?$`,
    "u",
  ),
  /^\/brand\/intelligence\/identity-test$/u,
  /^\/brand\/onboarding\/(?:scan|core-identity|intelligence-scan|dna|catalogue|competitors|verification|pricing|social-sync|sync-verify|sync-complete)$/u,
  new RegExp(`^/brand-centre(?:/offerings(?:/${SAFE_SEGMENT})?)?$`, "u"),
  /^\/creator\/(?:dashboard|home|analytics|media-kit|campaigns|campaigns\/history|collaborations|payouts)$/u,
  new RegExp(`^/creator/marketplace(?:/${SAFE_SEGMENT})?$`, "u"),
  /^\/creator\/settings(?:\/(?:profile|social|payouts))?$/u,
  /^\/creator\/onboarding(?:\/(?:modules|signup|connect|sync))?$/u,
  /^\/creator-marketplace\/callback$/u,
  /^\/integrate-instagram$/u,
  /^\/marketplace$/u,
  new RegExp(`^/marketplace/${SAFE_SEGMENT}$`, "u"),
  new RegExp(`^/marketplace/invite/${SAFE_SEGMENT}$`, "u"),
] as const;

function hasEncodedSeparator(value: string): boolean {
  let decoded = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (ENCODED_SEPARATOR.test(decoded)) return true;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return false;
      decoded = next;
    } catch {
      return true;
    }
  }
  return ENCODED_SEPARATOR.test(decoded);
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}

export function isSupportedInternalPath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || hasControlCharacter(value)) return false;
  if (hasEncodedSeparator(value)) return false;

  try {
    const parsed = new URL(value, INTERNAL_BASE);
    if (parsed.origin !== INTERNAL_BASE || parsed.username || parsed.password) {
      return false;
    }
    return SUPPORTED_PATHS.some((pattern) => pattern.test(parsed.pathname));
  } catch {
    return false;
  }
}

/**
 * Resolves an externally influenced return value to an allowlisted Creator Shop
 * route. Callers must provide a trusted, role-safe fallback.
 */
export function resolveSafeInternalPath(
  value: unknown,
  fallback: string,
): string {
  if (isSupportedInternalPath(value)) return value;
  return isSupportedInternalPath(fallback) ? fallback : "/";
}
