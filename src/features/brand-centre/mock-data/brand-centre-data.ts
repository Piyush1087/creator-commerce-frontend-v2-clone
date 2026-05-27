import type { BrandCentreData } from "../types";

export const MOCK_BRAND_CENTRE_DATA: BrandCentreData = {
  brandName: "Solv Skincare",
  website: "solvskincare.com",
  marketSetup: "IN / INR",
  industry: "Beauty & Personal Care",
  lifecycleStage: "SCALING_TIER_2",
  narrativeTitle: "Democratizing clinical skincare for the modern minimalist.",
  narrativeDescription: "Solv Skincare cuts through the noise of multi-step routines by offering highly potent, multi-active formulations that deliver dermatological results without the complexity.",
  colors: ["#FFFFFF", "#0E1214", "#34D399"],
  fonts: ["Satoshi Variable", "Source Sans 3"],
  personas: [
    {
      name: "The Efficacy Seeker",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmLmTF9D0hj5l1juU4WEc7iaUHl_W16m67BopgoHzTpXySay7XMxqrd7HYqYwgjg62VH8OJAP6L8k-_TnNdI6eVvuVGAabze-1TFmkg8pcxeHxvjHQbkPmB_RO8YimCW3qcrN-O6OwzPTAHYgCcNP08BcR3szA8DkBiEl1s9GxTBArGw0W3lstuUXXBXr5yvETQHqPTusGHQD4DnJWtt_NeokFVoBnX6YykhBfpJWfF4zuBKeJ8ZPz8fVSwjCQwOu7-XklaNDDbUc"
    }
  ],
  monthlyBudget: 85000,
  utilizedBudget: 42500,
  assetAllocation: [
    { label: "Product", value: 63, color: "#34D399" },
    { label: "Collection", value: 25, color: "#059669" },
    { label: "Brand", value: 12, color: "#E5E7EB" }
  ],
  influencerTiers: [
    { label: "Micro", value: 50, color: "#34D399" },
    { label: "Nano", value: 30, color: "#059669" },
    { label: "Mega", value: 20, color: "#E5E7EB" }
  ],
  campaignObjectives: [
    { label: "Awareness", value: 75, color: "#34D399" },
    { label: "Proof", value: 15, color: "#059669" },
    { label: "Direct", value: 10, color: "#E5E7EB" }
  ],
  escrowStatus: 'ACTIVE',
  currentPlan: "Growth Brand Tier",
  outreachQuota: { used: 42, total: 100 },
  metaConnectionStatus: 'ACTIVE',
  teamManagement: "2 Team members, 1 Agency user"
};
