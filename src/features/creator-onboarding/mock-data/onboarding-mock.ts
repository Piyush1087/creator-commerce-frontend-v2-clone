export type CreatorModuleOption = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const CREATOR_MODULE_OPTIONS: CreatorModuleOption[] = [
  {
    id: "brand_deals",
    title: "Land Better Brand Deals",
    description: "Gated inbox and pitch templates for inbound collabs.",
    icon: "📬",
  },
  {
    id: "media_kit",
    title: "Build My AI Media Kit",
    description: "Live-sync storefront brands can browse without a DM.",
    icon: "🖼️",
  },
  {
    id: "performance",
    title: "Understand My Performance",
    description: "Post pulse analytics and rate guidance from your IG data.",
    icon: "📊",
  },
  {
    id: "payments",
    title: "Get Paid Securely",
    description: "Escrow-ready payouts and contract milestones.",
    icon: "🔒",
  },
];

export const LANDING_MARQUEE_HANDLES = [
  "#travelwithme",
  "#foodstories",
  "#techbytes",
  "#fashiondaily",
  "#fitnessmotivation",
  "#vloglife",
] as const;

export const SIGNUP_WORKSPACE_WIDGETS = [
  { label: "AI Media Kit", status: "Ready", tone: "success" as const },
  { label: "Brand Deals Inbox", status: "Live", tone: "success" as const },
  { label: "Performance Insights", status: "Pending Sync", tone: "pending" as const },
  { label: "Secure Payments", status: "Securing", tone: "pending" as const },
];

export type InstagramAccountOption = {
  id: string;
  displayName: string;
  handle: string;
  accountType: string;
  followersLabel: string;
};

export const MOCK_INSTAGRAM_ACCOUNTS: InstagramAccountOption[] = [
  {
    id: "primary",
    displayName: "Sarah Jenkins",
    handle: "@sarahjenkins",
    accountType: "Creator",
    followersLabel: "142K Followers",
  },
  {
    id: "secondary",
    displayName: "Sarah Travels",
    handle: "@sarahtravels",
    accountType: "Business",
    followersLabel: "28K Followers",
  },
];

export const WORKSPACE_BUILD_STEPS = [
  { id: "insights", label: "Connecting Instagram insights", state: "done" as const },
  { id: "media_kit", label: "Building AI Media Kit", state: "active" as const },
  { id: "audience", label: "Organizing audience insights", state: "pending" as const },
  { id: "inbox", label: "Brand Deals Inbox", state: "pending" as const },
  { id: "payments", label: "Secure payments", state: "pending" as const },
];

export const WORKSPACE_AI_INSIGHT =
  "Reels get 2.3× more engagement than photo posts in your last 30-day window.";
