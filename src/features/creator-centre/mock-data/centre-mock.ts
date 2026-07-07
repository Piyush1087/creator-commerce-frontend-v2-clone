export const MOCK_CREATOR_PROFILE = {
  displayName: "Sarah Chen",
  handle: "@sarahchen_creates",
  tagline: "Lifestyle & Tech Storyteller",
  foundingBadge: "Founding Member",
  avatarInitials: "SC",
};

export const MOCK_HOME_KPIS = [
  { label: "Total Reach", value: "1.2M", delta: "+12%" },
  { label: "Engagements", value: "45.8K", delta: "+8%" },
  { label: "Est. Payout", value: "$3,420", delta: "Pending" },
] as const;

export const MOCK_ACTIVE_CAMPAIGNS = [
  {
    id: "summer-tech",
    title: "Summer Tech Series",
    meta: "In Production • 3 Drafts Due",
  },
  {
    id: "bio-glow",
    title: "Bio-Glow Organic",
    meta: "Review Pending • 1 Message",
  },
] as const;

export const MOCK_PRIORITY_TASKS = [
  "Upload final cut for Bio-Glow",
  'Respond to "Peak Performance"',
  "Update media kit analytics",
] as const;

export const MOCK_ASSISTANT_INSIGHT = {
  headline: "24% higher engagement 6–8PM EST",
  body: "Your audience saves tutorial Reels at nearly double the weekday average.",
  ideas: [
    { title: "A Day in the Life Refresh", match: "High save velocity" },
    { title: "LAVENTO collab pitch", match: "89% demographic match" },
  ],
};

export const MOCK_ANALYTICS_SUMMARY = {
  totalReach: "2.4M",
  reachDelta: "+12.5%",
  engagementRate: "6.8%",
  engagementDelta: "+0.4%",
  estimatedValue: "$42.1K",
};

export const MOCK_TOP_POSTS = [
  {
    id: "1",
    title: "Summer Glow Up",
    handle: "@arivera_vlogs",
    reach: "842.1K",
    ctr: "3.2%",
    status: "Live",
  },
  {
    id: "2",
    title: "Pro Setup Series",
    handle: "@chentech_",
    reach: "1.1M",
    ctr: "4.8%",
    status: "Live",
  },
  {
    id: "3",
    title: "Sustainable Threads",
    handle: "@jordan_style",
    reach: "452.8K",
    ctr: "2.1%",
    status: "Pending",
  },
];

export const MOCK_MEDIA_KIT = {
  bio: "Tech reviewer and productivity optimizer helping creators build sustainable studio workflows.",
  niches: ["Technology", "Productivity", "Lifestyle", "Creator Education"],
  totalReach: "1.2M+",
  engagementRate: "4.8%",
  brandCollabs: "85+",
  shortFormRate: 1500,
  storyBundleRate: 450,
  primaryCategory: "Tech & Gadgets",
  healthScore: 92,
  checklist: [
    { label: "Instagram Connected", done: true },
    { label: "Portfolio Added", done: true },
    { label: "Audience Insights Synced", done: true },
    { label: "Pricing Available", done: true },
    { label: "Add Testimonials", done: false },
  ],
  portfolio: [
    "Next-Gen Workspace Series",
    "Sustainable Style",
    "Tech Hardware Review",
    "Urban Architecture Vlog",
  ],
};
