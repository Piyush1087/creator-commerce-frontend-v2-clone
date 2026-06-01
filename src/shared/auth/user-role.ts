export const USER_ROLES = ["BRAND", "INFLUENCER", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function normalizeUserRole(role: string | undefined): UserRole | null {
  const upper = role?.trim().toUpperCase();
  if (upper === "BRAND" || upper === "INFLUENCER" || upper === "ADMIN") {
    return upper;
  }
  return null;
}
