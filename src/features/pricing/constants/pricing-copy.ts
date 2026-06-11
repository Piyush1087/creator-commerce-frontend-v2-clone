import type { SubscriptionTier } from "../contracts/pricing.contracts";

export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  FOUNDERS_BETA: "Founder's Beta",
  GROWTH_STARTER: "Growth Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

export const TIER_TAKE_RATES: Record<SubscriptionTier, number> = {
  FOUNDERS_BETA: 0.07,
  GROWTH_STARTER: 0.06,
  PROFESSIONAL: 0.05,
  ENTERPRISE: 0.02,
};

export const TIER_MONTHLY_PRICE_LABEL: Record<SubscriptionTier, string> = {
  FOUNDERS_BETA: "$99/mo",
  GROWTH_STARTER: "$149/mo",
  PROFESSIONAL: "$399/mo",
  ENTERPRISE: "Custom",
};

export const FOUNDERS_PREVIEW_FEATURES = {
  deepIntel: [
    { icon: "✨", label: "Automated Brand DNA" },
    { icon: "🔍", label: "Competitor Gap Analysis: Deep-scan up to 3 rivals" },
    { icon: "📊", label: "Monthly Intel Refresh: 1 Full Deep-Scan per month" },
  ],
  strategic: [
    { icon: "📝", label: "AI Creative Briefs" },
    { icon: "📦", label: "Inventory Mapping: Track up to 5 Products and 3 Collections" },
    { icon: "📍", label: "Local Footprint: Manage up to 3 Locations" },
  ],
  creatorOps: [
    { icon: "🤝", label: "Persona Matching" },
    { icon: "📨", label: "Automated Outreach: 100 Managed Outreaches per month" },
    { icon: "🛡️", label: "Escrow Protection Interlock: Fixed escrow allocation caps bounded at ₹5,00,000 hold limits" },
  ],
} as const;

export const PLAN_CARD_FEATURES: Record<
  Exclude<SubscriptionTier, "FOUNDERS_BETA" | "ENTERPRISE">,
  string[]
> = {
  GROWTH_STARTER: [
    "Up to 5 Campaigns",
    "10 Brand Collaborations",
    "Basic Analytics Export",
  ],
  PROFESSIONAL: [
    "Unlimited Campaigns",
    "Priority Matching AI",
    "Advanced Revenue Reporting",
  ],
};

export const FOUNDERS_BETA_TERMS = [
  "You are granted a revocable, non-exclusive license to use the Platform during the Beta period.",
  "By participating, you agree to allow our AI to process your brand's public data and competitive landscape to generate strategy.",
  "As a Founding Member, you agree to provide occasional feedback to help us refine our YouTube and TikTok engines.",
  "All AI-generated Brand DNA and Creative Briefs are yours to keep, provided your account remains in good standing.",
] as const;

export const DATA_SECURITY_POINTS = [
  "We only analyze publicly available data from your website and social profiles.",
  "Your internal business metrics and outreach history are encrypted and never shared with third parties or used to train models for competitors.",
  "You own your Brand DNA. We never sell your data.",
  "We are GDPR and CCPA compliant, ensuring your brand's digital footprint is handled with institutional-grade security.",
] as const;

export const UPCOMING_PLANS = [
  {
    name: "Professional (Upcoming)",
    badge: "Coming in 30 Days",
    description: "YouTube & TikTok Analysis • 10 Competitors / 500 Outreach",
    price: "$399/mo",
  },
  {
    name: "Enterprise (Upcoming)",
    description: "Global Regions & Multi-Currency Routing • Unlimited Scans",
    price: "Custom",
  },
] as const;
