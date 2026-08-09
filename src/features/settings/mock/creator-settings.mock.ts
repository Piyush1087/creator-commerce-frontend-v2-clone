export type CreatorTeamRole = "OWNER" | "MANAGER" | "ASSISTANT";

export type CreatorTeamMemberMock = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: CreatorTeamRole;
  roleLabel: string;
  status: "ACTIVE" | "PENDING";
  isCurrentUser?: boolean;
  isExternal?: boolean;
};

export const CREATOR_SETTINGS_MOCK = {
  profile: {
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah.jenkins@creatorspace.com",
    displayName: "Sarah Jenkins",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxVGxBQBHr5IzyMktFWkE_M54IqqRAdZQdH2t677enjMhACE5iUyoQ6bnQgCUak8EI2sOnCTelQf8yntwcfZftlDadfqwEc7nOQNP44zQ1GjW3T6V1KuGli_GMK6-WZL0BziHT252DkKVCLnZho0mcvBnTjG_wAZt-PPLIJM0ecV8kOt9gLZIqWgRhYQtNST7qPp6f6Jtxkz84iSkqQTY0wMy4jyy56hs6UXn_sknWgVXSJNn7baoc0SFJxKxnSB5Kk15SHySOsdU",
    workspaceName: "Sarah Jenkins Media Group",
  },
  shipping: {
    recipientLegalName: "Sarah Jenkins",
    streetAddressLine1: "742 Creative Studio Way, Apt 4B",
    streetAddressLine2: "",
    city: "Los Angeles",
    stateProvince: "California",
    postalCodeZip: "90028",
    countryIsoCode: "US",
    deliveryInstructions: "Leave package with the front desk concierge or call box #402.",
  },
  team: {
    maxSeats: 5,
    members: [
      {
        id: "c1",
        name: "Sarah Jenkins (You)",
        email: "sarah.jenkins@creatorspace.com",
        initials: "SJ",
        role: "OWNER" as const,
        roleLabel: "Owner",
        status: "ACTIVE" as const,
        isCurrentUser: true,
      },
      {
        id: "c2",
        name: "Tom Matthews",
        email: "tom@vanguard-talent.com",
        initials: "TM",
        role: "MANAGER" as const,
        roleLabel: "Manager",
        status: "ACTIVE" as const,
        isExternal: true,
      },
      {
        id: "c3",
        name: "Alex Lee",
        email: "alex.assistant@gmail.com",
        initials: "AL",
        role: "ASSISTANT" as const,
        roleLabel: "Assistant",
        status: "PENDING" as const,
      },
    ] satisfies CreatorTeamMemberMock[],
  },
  socialChannels: [
    {
      id: "instagram",
      platform: "Instagram Business Channel",
      icon: "instagram" as const,
      description:
        "Link your Instagram Professional or Creator account via Meta OAuth to verify audience demographics, track content reach, and unlock brand campaign access.",
      status: "CONNECTED" as const,
      handle: "@sarah_jenkins_creates",
      lastUpdated: "Today at 14:22 UTC",
      tokenStatus: "Verified Valid",
    },
    {
      id: "tiktok",
      platform: "TikTok Creator Profile",
      icon: "tiktok" as const,
      description:
        "Authenticate your TikTok Creator account to automatically feed post performance, video views, and video engagement rates directly to active brand brief tracking systems.",
      status: "DISCONNECTED" as const,
      hint: "Authorize data sharing via TikTok Login Kit to verify organic profile engagement trends.",
    },
    {
      id: "youtube",
      platform: "YouTube Channel Node",
      icon: "youtube" as const,
      description:
        "Establish secure Read-Only infrastructure paths to your YouTube Content Studio. Enables tracking for video duration, long-form viewer retention, and YouTube Shorts monetization performance.",
      status: "DISCONNECTED" as const,
      hint: "Connect your Google Workspace or YouTube brand channel account.",
    },
  ],
  payouts: {
    availableBalance: "₹1,42,850.00",
    pendingEscrow: "₹58,000.00",
    lifetimeEarnings: "₹12,04,500.00",
    nextPayoutDate: "June 15, 2026",
    bank: {
      bankName: "HDFC Bank Limited",
      beneficiaryName: "Sarah Jenkins Media Group",
      accountLast4: "6842",
      ifscMasked: "HDFC000••••",
      status: "VERIFIED" as const,
    },
    tax: {
      panMasked: "ABCDE••••F",
      isVerified: true,
    },
  },
};
