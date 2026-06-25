import type {
  CoPilotIntentTemplate,
  PlatformScopeContext,
} from "../types";

export const BRAND_CO_PILOT_DEFAULT_SCOPE: PlatformScopeContext = "BRAND_CENTRE";

/** First chips shown by default — one per module/goal for variety. */
export const BRAND_CO_PILOT_INTENT_TEMPLATES: CoPilotIntentTemplate[] = [
  {
    id: "brand-centre-overview",
    label: "Brand Centre overview",
    templateString:
      "Give me a read-only overview of Brand Centre — Brand DNA and Intelligence & Gaps together — before we plan campaigns.",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "escrow-audit",
    label: "Escrow audit",
    templateString: "Give me a full financial audit report for my campaign ledger.",
    associatedScope: "ESCROW",
  },
  {
    id: "collab-pipeline",
    label: "Collaboration status",
    templateString:
      "Show me all creators currently stuck in Stage 3 Logistics or Stage 4 Production.",
    associatedScope: "GLOBAL",
  },
  {
    id: "campaign-launch",
    label: "Launch campaign",
    templateString: "Launch a campaign for retinol serum",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "planner-status",
    label: "Campaign Planner",
    templateString:
      "How many campaign blueprints are pending approval in my planner?",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "move-leak-planner",
    label: "Send leak to planner",
    templateString:
      "Send the first active intelligence leak to Campaign Planner.",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "launch-planner-card",
    label: "Launch planner card",
    templateString: "Approve and launch my planner card as a draft campaign.",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "draft-campaigns",
    label: "List draft campaigns",
    templateString: "List my draft campaigns.",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "funnel-leaks",
    label: "Funnel leaks",
    templateString: "Where are our primary funnel leaks and what buckets are flagged?",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "persona-breakdown",
    label: "Persona breakdown",
    templateString:
      "Show me a breakdown of the psychographics for our audience personas.",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "competitor-streaks",
    label: "Competitor streaks",
    templateString:
      "Summarize the winning creative streaks found from scanning our top rivals.",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "profile-completeness",
    label: "Profile completeness",
    templateString:
      "What is incomplete or flagged across Brand DNA and Intelligence & Gaps?",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "launch-readiness",
    label: "Launch readiness",
    templateString:
      "What should we fix in Brand DNA and Intelligence & Gaps before UCE launch?",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "dna-compliance",
    label: "Compliance words",
    templateString:
      "What are the compliance do-not-say words assigned to our brand profile?",
    associatedScope: "BRAND_CENTRE",
  },
  {
    id: "dna-identity",
    label: "Update visual DNA",
    templateString:
      "Add a modern minimalist look to our aesthetic styles and restrict the font to Inter.",
    associatedScope: "BRAND_CENTRE",
  },
];

export const BRAND_CO_PILOT_INPUT_PLACEHOLDER =
  "Ask about Brand Centre, escrow, collaborations, or staged changes…";
