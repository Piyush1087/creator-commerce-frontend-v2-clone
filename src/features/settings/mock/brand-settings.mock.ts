export type BrandTeamRole = "BRAND_OWNER" | "FINANCE_ADMIN" | "CAMPAIGN_MANAGER" | "EXECUTIVE";

export type BrandTeamMemberMock = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: BrandTeamRole;
  roleLabel: string;
  status: "ACTIVE" | "PENDING";
  isCurrentUser?: boolean;
  isExternal?: boolean;
};

export const BRAND_SETTINGS_MOCK = {
  personalProfile: {
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah.jenkins@thecreatorshop.com",
    avatarUrl: null as string | null,
  },
  organization: {
    companyLegalName: "Creator Shop Group LLC",
    corporateAddress: "442 Workspace Avenue, Suite 100, New York, NY",
    country: "United States (USD)",
    currency: "USD ($)",
    taxId: "EIN 12-3456789",
  },
  brandIdentity: {
    displayName: "The Creator Shop",
    websiteUrl: "thecreatorshop.com",
    logoInitials: "TCS",
  },
  team: {
    maxSeats: 5,
    members: [
      {
        id: "m1",
        name: "Sarah Jenkins (You)",
        email: "sarah.jenkins@thecreatorshop.com",
        initials: "SJ",
        role: "BRAND_OWNER" as const,
        roleLabel: "Admin",
        status: "ACTIVE" as const,
        isCurrentUser: true,
      },
      {
        id: "m2",
        name: "Marcus Thorne",
        email: "marcus.t@thecreatorshop.com",
        initials: "MT",
        role: "CAMPAIGN_MANAGER" as const,
        roleLabel: "Campaign Manager",
        status: "ACTIVE" as const,
      },
      {
        id: "m3",
        name: "Agency Partner Link",
        email: "collab@vanguard-agency.com",
        initials: "AG",
        role: "EXECUTIVE" as const,
        roleLabel: "Executive",
        status: "PENDING" as const,
        isExternal: true,
      },
    ] satisfies BrandTeamMemberMock[],
  },
  integrations: {
    discoveredHandle: "@thecreatorshop",
    meta: {
      status: "CONNECTED" as "CONNECTED" | "DISCONNECTED" | "EXPIRED",
      handle: "@thecreatorshop",
      authLevel: "Meta Business Manager Integration (Full Automation Mode Active)",
      syncedMetrics: "1.4M+",
      activeCreators: "142",
      permissions: {
        syncMetrics: true,
        enableDmOutreach: true,
        profileDiscovery: false,
      },
      identityConflict: {
        activeHandle: "@thecreatorshop",
        inboundHandle: "@creatorshop_global",
      },
    },
  },
};
