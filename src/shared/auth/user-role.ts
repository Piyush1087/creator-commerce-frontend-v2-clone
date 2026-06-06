export const USER_ROLES = ["BRAND", "CREATOR", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function normalizeUserRole(role: string | undefined): UserRole | null {
  const upper = role?.trim().toUpperCase();
  if (upper === "BRAND" || upper === "CREATOR" || upper === "ADMIN") {
    return upper;
  }
  /** Legacy JWTs may still send INFLUENCER */
  if (upper === "INFLUENCER") {
    return "CREATOR";
  }
  return null;
}
