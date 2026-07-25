/** Static Brand Home briefing — mirrors Creator Daily Briefing structure. */

export const MOCK_BRAND_PROFILE = {
  displayName: "Aurora Beauty",
  firstName: "Alex",
  lastUpdated: "Last updated 10 mins ago",
  subtitle: "Here's what's happening with your brand today.",
};

export const MOCK_BRAND_HOME_SNAPSHOT = [
  {
    id: "spend",
    title: "Active Campaign Spend",
    emoji: "💰",
    value: "₹6.8L",
    detail: "Across live UCE campaigns this quarter.",
    action: "View Campaigns →",
    actionStyle: "link" as const,
  },
  {
    id: "dna",
    title: "Brand DNA Health",
    emoji: "🧬",
    value: "88 / 100",
    badge: "Strong",
    detail: null,
    action: "Open Brand Centre →",
    actionStyle: "link" as const,
  },
  {
    id: "escrow",
    title: "Escrow Ready to Release",
    emoji: "💳",
    value: "₹1.2L",
    detail: "Pending creator deliverable approvals.",
    action: "View Payouts →",
    actionStyle: "link" as const,
  },
  {
    id: "creators",
    title: "Creator Matches",
    emoji: "✨",
    value: "23 Creators",
    detail: "High-fit creators for open briefs.",
    action: "Browse Matches →",
    actionStyle: "button" as const,
  },
] as const;

export const MOCK_BRAND_HERO = {
  title: "Biggest Opportunity",
  emoji: "🔥",
  bodyBefore: "Your intelligence scan flagged a ",
  bodyHighlight: "retinol funnel leak",
  bodyAfter:
    " with strong competitor creative streaks. Brands in your vertical are booking creators this week.",
  recommendation:
    "Strategic Recommendation: Move the leak into Campaign Planner and launch a draft UCE brief.",
  primaryCta: "Send Leak to Planner →",
  secondaryCta: "Open Brand Centre",
};

export const MOCK_BRAND_ACTION_REQUIRED = [
  {
    id: "approve",
    title: "Approve Creator Deliverable",
    emoji: "📄",
    meta: "Sarah Chen • Summer Tech Series",
    cta: "Review",
  },
  {
    id: "brief",
    title: "Finalize Campaign Brief",
    emoji: "🎯",
    meta: "Retinol Serum Launch • Due tomorrow",
    cta: "Edit",
  },
] as const;

export const MOCK_BRAND_ACTIVE_CAMPAIGNS = [
  {
    id: "summer-tech",
    title: "Summer Tech Series",
    meta: "Status: In Production • 3 Creators",
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

export const MOCK_BRAND_PRIORITY_TASKS = [
  {
    id: "release",
    label: "Release escrow for Bio-Glow deliverable",
    due: "Today",
    urgent: true,
  },
  {
    id: "invite",
    label: "Invite 3 creators to Retinol draft campaign",
    due: "Tomorrow",
    urgent: false,
  },
  {
    id: "dna",
    label: "Update Brand DNA compliance word list",
    due: "This Week",
    urgent: false,
  },
] as const;
