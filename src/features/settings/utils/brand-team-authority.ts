import type { BrandSettingsRole } from "../contracts/brand-settings.contracts";

export const TEAM_ROLE_OPTIONS: Array<{
  value: BrandSettingsRole;
  label: string;
}> = [
  { value: "BRAND_OWNER", label: "Brand Owner" },
  { value: "FINANCE_ADMIN", label: "Finance Admin" },
  { value: "CAMPAIGN_MANAGER", label: "Campaign Manager" },
];

export function teamRoleOptions(actor: BrandSettingsRole) {
  if (actor === "BRAND_OWNER") return TEAM_ROLE_OPTIONS;
  if (actor === "FINANCE_ADMIN")
    return TEAM_ROLE_OPTIONS.filter((option) => option.value !== "BRAND_OWNER");
  return [];
}

export function canManageTeamTarget(
  actor: BrandSettingsRole,
  target: BrandSettingsRole,
) {
  return (
    actor === "BRAND_OWNER" ||
    (actor === "FINANCE_ADMIN" && target !== "BRAND_OWNER")
  );
}
