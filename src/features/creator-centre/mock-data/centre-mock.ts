/**
 * Static Stitch reference content for Creator Centre UI ports.
 * Source: D:\Work\cursor-repos\stitch_creator_centre\
 * Prefer these over "-" until live APIs cover the field.
 */

export const MOCK_CREATOR_PROFILE = {
  displayName: "Sarah Chen",
  firstName: "Sarah",
  handle: "@sarahchen_creates",
  tagline: "Lifestyle & Tech Storyteller",
  nicheLine: "Tech & Productivity",
  foundingBadge: "Founding Member",
  avatarInitials: "SC",
  lastUpdated: "Last updated 10 mins ago",
  subtitle: "Here's what's happening with your creator business today.",
};

/** Desktop snapshot bento — `home_daily_briefing_ai_assistant_integrated_2` */
export const MOCK_HOME_SNAPSHOT = [
  {
    id: "earnings",
    title: "Estimated Earnings Pipeline",
    emoji: "💰",
    value: "₹4.25L",
    detail: "Across active collaborations and opportunities.",
    action: "View Collaborations →",
    actionStyle: "link" as const,
  },
  {
    id: "profile",
    title: "Creator Profile",
    emoji: "📄",
    value: "92 / 100",
    badge: "Excellent",
    detail: null,
    action: "Improve Profile →",
    actionStyle: "link" as const,
  },
  {
    id: "payout",
    title: "Next Expected Payout",
    emoji: "💳",
    value: "₹48,000",
    detail: "Expected on Oct 15, 2026.",
    action: "View Payouts →",
    actionStyle: "link" as const,
  },
  {
    id: "marketplace",
    title: "Brand Marketplace",
    emoji: "🛍️",
    value: "14 Briefs",
    detail: "High-match campaigns active in your vertical.",
    action: "Browse Campaigns →",
    actionStyle: "button" as const,
  },
] as const;

export const MOCK_HERO_OPPORTUNITY = {
  title: "Biggest Opportunity",
  emoji: "🔥",
  bodyBefore: 'Your Reel "Morning Tech Routine" is performing ',
  bodyHighlight: "3.5× above average",
  bodyAfter:
    ". It's receiving significantly more shares and saves—strong signals that brands value this content style.",
  recommendation:
    "Strategic Recommendation: Pitch consumer tech brands while engagement is still growing.",
  primaryCta: "Write Brand Pitch →",
  secondaryCta: "View Content Pulse",
};

export const MOCK_ACTION_REQUIRED = [
  {
    id: "contract",
    title: "Review & Sign Contract",
    emoji: "📄",
    meta: "Sephora US • Holiday Campaign 2026",
    cta: "Review",
  },
  {
    id: "upload",
    title: "Upload Video Draft",
    emoji: "🎥",
    meta: "Nike Running • Due tomorrow",
    cta: "Upload",
  },
] as const;

export const MOCK_ACTIVE_CAMPAIGNS = [
  {
    id: "summer-tech",
    title: "Summer Tech Series",
    meta: "Status: In Production • 3 Drafts Due",
    thumbInitials: "ST",
    thumbTone: "tech" as const,
  },
  {
    id: "bio-glow",
    title: "Bio-Glow Organic",
    meta: "Status: Review Pending • 1 Message",
    thumbInitials: "BG",
    thumbTone: "organic" as const,
  },
] as const;

export const MOCK_PRIORITY_TASKS = [
  {
    id: "bio-glow-cut",
    label: 'Upload final cut for "Bio-Glow" series',
    due: "Today",
    urgent: true,
    done: false,
  },
  {
    id: "peak",
    label: 'Respond to collaboration invite from "Peak Performance"',
    due: "Tomorrow",
    urgent: false,
    done: false,
  },
  {
    id: "media-kit",
    label: "Update media kit analytics",
    due: "This Week",
    urgent: false,
    done: false,
  },
] as const;

/** Desktop assistant column — Stitch `ai_assistant_integrated_2` */
export const MOCK_ASSISTANT = {
  title: "Creator Assistant",
  status: "Active",
  greeting:
    "I've updated your daily briefing. I noticed your Tech aesthetic is trending today. Need help drafting a pitch, calculating a package rate, or reviewing a contract?",
  chips: [
    "📝 Draft a pitch for my top Reel",
    "💰 What should I charge for 2 Stories?",
    "🔍 Check my profile health",
  ],
  placeholder: "Ask your assistant anything...",
  disclaimer: "AI can make mistakes. Please verify important info.",
};

/**
 * Mobile Home composition — layout from `home_daily_briefing_mobile`,
 * persona/copy aligned to desktop Sarah Chen (not Alex Rivera).
 */
export const MOCK_HOME_MOBILE = {
  greeting: "Morning, Sarah.",
  subtitle: "Here's your pulse for today, Oct 24.",
  pulse: [
    {
      id: "engagement",
      label: "Engagement",
      value: "+12.4%",
      tone: "surface" as const,
      icon: "↑",
    },
    {
      id: "payout",
      label: "Pending Payout",
      value: "₹48,000",
      tone: "primary" as const,
      icon: "₹",
    },
  ],
  insight: {
    badge: "AI Assistant",
    title: "Content Pulse Insight",
    body: 'Your Reel "Morning Tech Routine" is peaking. We suggest pitching consumer tech brands while engagement is still growing.',
    cta: "Generate Brief",
  },
  collabsHeading: "Active Collabs",
  collabs: [
    {
      id: "summer-tech",
      brand: "Summer Tech Series",
      title: "Summer Tech Series",
      status: "Draft Due",
      statusTone: "pending" as const,
      meta: ["Oct 28", "₹45,000"],
      featured: true,
    },
    {
      id: "bio-glow",
      brand: "Bio-Glow Organic",
      title: "Bio-Glow Organic",
      status: null,
      statusTone: null,
      meta: ["Waiting for approval"],
      featured: false,
    },
  ],
  tasks: [
    { id: "lavento", label: "Upload final cut for Bio-Glow series", done: false },
    { id: "payout", label: "Update payout bank details", done: false },
    {
      id: "hydro",
      label: "Review campaign brief: HydroBase",
      done: true,
    },
  ],
} as const;

export const MOCK_INSIGHTS_HEADER = {
  title: "Content Pulse",
  subtitle:
    "Understand what's working, what's changing, and where your next opportunity is.",
  lastUpdated: "Last updated 2 hours ago",
  rangeLabel: "Last 30 Days",
};

export const MOCK_INSIGHTS_OPPORTUNITY = {
  title: "Your Biggest Opportunity Today",
  emoji: "🔥",
  bodyBefore: "Your Reel 'Studio Desk Tour' is performing ",
  bodyHighlight: "2.4× better",
  bodyAfter:
    " than your recent average. It's receiving significantly more shares and saves—strong signals that brands value this content style.",
  recommendation:
    "Recommended Action: Pitch technology brands while engagement is still growing.",
  primaryCta: "Write Brand Pitch →",
  secondaryCta: "View Post",
};

export const MOCK_INSIGHTS_PULSE_KPIS = [
  {
    id: "er",
    emoji: "📈",
    label: "Engagement Rate",
    value: "8.4%",
    detail: "↑ 12% vs last month",
    detailTone: "up" as const,
  },
  {
    id: "growth",
    emoji: "🌱",
    label: "Audience Growth",
    value: "+328",
    detail: "Last 7 days",
    detailTone: "muted" as const,
  },
  {
    id: "avg",
    emoji: "💬",
    label: "Average Engagement",
    value: "6.8%",
    detail: "Across your last 10 posts",
    detailTone: "muted" as const,
  },
  {
    id: "rate",
    emoji: "💰",
    label: "Estimated Brand Rate",
    value: "₹90K–₹1.1L",
    detail: "Based on your current performance",
    detailTone: "muted" as const,
  },
] as const;

export const MOCK_LATEST_POSTS = [
  {
    id: "morning",
    title: "Morning Routine VLOG",
    metrics: "12.4K · 340 · 1.2K",
    score: 92,
    status: "Trending" as const,
    statusTone: "error" as const,
  },
  {
    id: "unboxing",
    title: "Unboxing the new gear",
    metrics: "4.1K · 89 · 112",
    score: 78,
    status: "Performing Well" as const,
    statusTone: "success" as const,
  },
] as const;

export const MOCK_ANALYTICS_SUMMARY = {
  totalReach: "2.4M",
  reachDelta: "+12.5%",
  engagementRate: "6.8%",
  engagementDelta: "+0.4%",
  estimatedValue: "$42.1K",
  estimatedNote: "Calculated based on average CPC/CPM metrics.",
  chartHeights: [40, 60, 45, 80, 70, 95, 55] as const,
};

export const MOCK_TOP_POSTS = [
  {
    id: "1",
    creator: "Alex Rivera",
    handle: "@arivera_vlogs",
    campaign: "Summer Glow Up",
    impressions: "842.1K",
    ctr: "3.2%",
    status: "Active" as const,
  },
  {
    id: "2",
    creator: "Sarah Chen",
    handle: "@chentech_",
    campaign: "Pro Setup Series",
    impressions: "1.1M",
    ctr: "4.8%",
    status: "Active" as const,
  },
  {
    id: "3",
    creator: "Jordan Smith",
    handle: "@jordan_style",
    campaign: "Sustainable Threads",
    impressions: "452.8K",
    ctr: "2.1%",
    status: "Pending" as const,
  },
];

export const MOCK_VISUAL_IMPACT = {
  title: "Visual Impact Analysis",
  subtitle: "AI-driven creative fatigue monitoring.",
  tiles: [
    { label: "High Impact", detail: "+18% Reach", tone: "good" as const },
    { label: "Mid Impact", detail: "+5% Reach", tone: "mid" as const },
    { label: "Fatigue Risk", detail: "Review creative", tone: "risk" as const },
  ],
  quote:
    "Your audience is responding 40% better to Urban Community themes this week.",
};

export const MOCK_STRATEGIC_RECOMMENDATION = {
  title: "Strategic recommendation",
  body: 'Based on your current Content Pulse, we suggest increasing allocation to Short-form Video by 15% for the "Sustainable Threads" campaign. Engagement metrics indicate high conversion potential in the 18-24 demographic.',
  cta: "Implement Shift",
};

export const MOCK_MEDIA_KIT = {
  bio: "Tech reviewer and productivity optimizer crafting clean content for modern work spaces.",
  niches: ["Technology", "Productivity", "Lifestyle", "Creator Education"],
  totalReach: "1.2M+",
  followers: "54K",
  engagementRate: "4.8%",
  avgReelViews: "42K",
  avgSaves: "1.4K",
  responseRate: "98%",
  repeatCollabs: "35%",
  brandCollabs: "85+",
  rates: {
    reel: "45,000",
    story: "15,000",
    carousel: "30,000",
    bundle: "75,000",
    currency: "₹",
  },
  rateSuggestion:
    "Your engagement has increased recently. You could likely increase your Reel pricing by 15%.",
  primaryCategory: "Tech & Gadgets",
  healthScore: 92,
  healthLabel: "Your profile is complete and ready to share with brands.",
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
  collaborations: [
    {
      brand: "Sephora US Holiday Launch",
      completed: "Completed Oct 2026",
      quote:
        "Sarah delivered ahead of schedule and the content performance exceeded our benchmark targets.",
    },
    {
      brand: "Sony Audio Campaign",
      completed: "Completed June 2026",
      quote: null,
    },
  ],
  brandLogos: ["Sephora", "Sony", "Nike", "LAVENTO"],
  visibility: "Public" as const,
  acceptingCollabs: "Accepting collaborations",
  idealIndustries: "Consumer tech, Beauty, Productivity tools",
  discoveryNote: "Public — discoverable in brand marketplace",
  acceptingTypes: [
    { id: "brand", label: "Brand Collaborations", on: true },
    { id: "reviews", label: "Product Reviews", on: true },
    { id: "affiliate", label: "Affiliate Partnerships", on: false },
    { id: "ugc", label: "UGC Projects", on: true },
    { id: "events", label: "Event Invitations", on: false },
    { id: "travel", label: "Travel Collaborations", on: false },
  ],
  idealPartnerships: [
    "Beauty",
    "Technology",
    "Fashion",
    "Travel",
    "Food",
    "Finance",
    "Education",
    "Health",
    "Creator Economy",
  ],
  selectedPartnerships: ["Technology", "Beauty", "Education"],
  minBudget: "₹50,000",
  preferredRegions: "India · US · UK",
  languages: "English · Hindi",
  visibilityOptions: ["Public", "Invite Only", "Private"] as const,
  suggestedImprovements: [
    {
      id: "portfolio",
      icon: "✨",
      body: "Add two more featured Reels. Profiles with six featured projects receive significantly more brand inquiries.",
      cta: "Update Portfolio →",
    },
    {
      id: "bio",
      icon: "📄",
      body: "Your bio could better highlight your niche.",
      cta: "Rewrite with AI →",
    },
    {
      id: "testimonials",
      icon: "⭐",
      body: "Add testimonials from previous collaborations.",
      cta: "Request Testimonials →",
    },
  ],
  recentUpdates: [
    { when: "Today", text: "Profile viewed by three brands" },
    { when: "Yesterday", text: "Bio updated" },
    { when: "Last Week", text: "Media Kit shared twice" },
  ],
  footerBanner:
    "Your Creator Profile updates automatically as your audience grows. Keep it current so brands always see your best work.",
};
