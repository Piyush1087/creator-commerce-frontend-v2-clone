import type { BrandGeneralResponse, BrandSettingsRole } from "../contracts/brand-settings.contracts";
import type { SettingsTeamMemberRow } from "../components/settings-team-table";

export const SETTINGS_EMPTY_DISPLAY = "—";

export function settingsDisplayText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : SETTINGS_EMPTY_DISPLAY;
}

export function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) {
    return SETTINGS_EMPTY_DISPLAY;
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return SETTINGS_EMPTY_DISPLAY;
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const ROLE_LABELS: Record<BrandSettingsRole, string> = {
  BRAND_OWNER: "Admin",
  FINANCE_ADMIN: "Finance Admin",
  CAMPAIGN_MANAGER: "Campaign Manager",
};

export function brandRoleLabel(role: BrandSettingsRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function mapBrandTeamRows(data: BrandGeneralResponse): SettingsTeamMemberRow[] {
  const activeRows: SettingsTeamMemberRow[] = data.team.members.map((member) => ({
    id: member.membership_id,
    name: settingsDisplayText(member.name),
    email: member.email,
    initials: initialsFromName(member.name),
    roleLabel: brandRoleLabel(member.role),
    status: "ACTIVE",
    isCurrentUser: member.is_current_user,
    isExternal: !member.email.includes("@"),
  }));

  const pendingRows: SettingsTeamMemberRow[] = data.team.pending_invitations.map(
    (invite) => ({
      id: invite.invitation_id,
      name: settingsDisplayText(invite.email.split("@")[0]),
      email: invite.email,
      initials: initialsFromName(invite.email.split("@")[0]),
      roleLabel: brandRoleLabel(invite.role),
      status: "PENDING",
      isExternal: !invite.email.includes("@"),
    }),
  );

  return [...activeRows, ...pendingRows];
}

export function isBrandFinancialReadOnly(role: BrandSettingsRole): boolean {
  return role === "CAMPAIGN_MANAGER";
}

export function isBrandTeamAdmin(role: BrandSettingsRole): boolean {
  return role === "BRAND_OWNER" || role === "FINANCE_ADMIN";
}
