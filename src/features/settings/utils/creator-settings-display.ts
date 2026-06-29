import type {
  CreatorShippingAddress,
  CreatorTeamRole,
  CreatorWorkspaceResponse,
  SocialPlatform,
} from "../contracts/creator-settings.contracts";
import type { SettingsTeamMemberRow } from "../components/settings-team-table";
import { settingsDisplayText } from "./brand-settings-display";

export { settingsDisplayText, SETTINGS_EMPTY_DISPLAY } from "./brand-settings-display";
export { initialsFromName } from "./brand-settings-display";

const ROLE_LABELS: Record<CreatorTeamRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  ASSISTANT: "Assistant",
};

export function creatorRoleLabel(role: CreatorTeamRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function isCreatorAssistantReadOnly(role: CreatorTeamRole): boolean {
  return role === "ASSISTANT";
}

export function isCreatorWorkspaceAdmin(role: CreatorTeamRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function mapCreatorTeamRows(data: CreatorWorkspaceResponse): SettingsTeamMemberRow[] {
  const activeRows: SettingsTeamMemberRow[] = data.team.members.map((member) => ({
    id: member.member_id,
    name: settingsDisplayText(member.name),
    email: member.email,
    initials: member.name
      ? member.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("")
      : settingsDisplayText(null),
    roleLabel: creatorRoleLabel(member.role),
    status: "ACTIVE",
    isCurrentUser: member.is_current_user,
  }));

  const pendingRows: SettingsTeamMemberRow[] = data.team.pending_invitations.map(
    (invite) => ({
      id: invite.invitation_id,
      name: settingsDisplayText(invite.email.split("@")[0]),
      email: invite.email,
      initials: invite.email[0]?.toUpperCase() ?? settingsDisplayText(null),
      roleLabel: creatorRoleLabel(invite.role),
      status: "PENDING",
    }),
  );

  return [...activeRows, ...pendingRows];
}

export function emptyShippingForm(): {
  recipientLegalName: string;
  streetAddressLine1: string;
  streetAddressLine2: string;
  city: string;
  stateProvince: string;
  postalCodeZip: string;
  countryIsoCode: string;
  deliveryInstructions: string;
} {
  return {
    recipientLegalName: "",
    streetAddressLine1: "",
    streetAddressLine2: "",
    city: "",
    stateProvince: "",
    postalCodeZip: "",
    countryIsoCode: "",
    deliveryInstructions: "",
  };
}

export function shippingFormFromApi(address: CreatorShippingAddress | null) {
  if (!address) {
    return emptyShippingForm();
  }
  return {
    recipientLegalName: address.recipient_legal_name,
    streetAddressLine1: address.street_address_line1,
    streetAddressLine2: address.street_address_line2 ?? "",
    city: address.city,
    stateProvince: address.state_province ?? "",
    postalCodeZip: address.postal_code_zip,
    countryIsoCode: address.country_iso_code,
    deliveryInstructions: address.delivery_instructions_narrative ?? "",
  };
}

export const SOCIAL_PLATFORM_CATALOG: Array<{
  platform: SocialPlatform;
  title: string;
  description: string;
  icon: "instagram" | "tiktok" | "youtube";
  connectHint: string;
}> = [
  {
    platform: "INSTAGRAM",
    title: "Instagram professional account",
    description:
      "Link your Instagram creator account to sync live performance metrics and unlock escrow-backed campaign reporting.",
    icon: "instagram",
    connectHint: "OAuth connection flow will open in a secure window when available.",
  },
  {
    platform: "TIKTOK",
    title: "TikTok creator profile",
    description:
      "Connect TikTok to ingest short-form engagement signals for brand matching and campaign verification.",
    icon: "tiktok",
    connectHint: "TikTok linking is rolling out after Instagram parity is verified.",
  },
  {
    platform: "YOUTUBE",
    title: "YouTube channel",
    description:
      "Authorize YouTube analytics to support long-form sponsorship workflows and audience demographic insights.",
    icon: "youtube",
    connectHint: "YouTube channel OAuth is scheduled for a later platform release.",
  },
];

export function formatSettingsDate(iso: string | null | undefined): string {
  if (!iso) {
    return settingsDisplayText(null);
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return settingsDisplayText(null);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrencyAmount(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return settingsDisplayText(null);
  }
  const code = currency?.trim() || "INR";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(amount);
}
