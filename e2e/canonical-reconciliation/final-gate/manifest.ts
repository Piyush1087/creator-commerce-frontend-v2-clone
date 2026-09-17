export type FinalGateRole =
  | "PUBLIC"
  | "BRAND_OWNER"
  | "FINANCE_ADMIN"
  | "CAMPAIGN_MANAGER"
  | "CREATOR_OWNER"
  | "CREATOR_MANAGER"
  | "CREATOR_ASSISTANT";

export type FinalGateScenario = Readonly<{
  id: `B${string}`;
  role: FinalGateRole;
  secondaryRole?: FinalGateRole;
  state: string;
  scope: string;
  widths: readonly number[];
  paths: readonly string[];
}>;

const mobileDesktop = [390, 1440] as const;
const responsiveBoundary = [390, 767, 768, 1440] as const;

export const FINAL_GATE_SCENARIOS: readonly FinalGateScenario[] = [
  {
    id: "B01",
    role: "PUBLIC",
    state: "anonymous",
    scope: "Public Campaign and public Media Kit; route mounting",
    widths: mobileDesktop,
    paths: [
      "/campaigns/f1000000-0000-4000-8000-000000000101",
      "/media-kit/finalgatecreator00000001",
    ],
  },
  {
    id: "B02",
    role: "BRAND_OWNER",
    state: "verified",
    scope:
      "Verified Media Kit; Brand Home, Centre, current Brand/Product Intelligence and limited Brand Chat",
    widths: mobileDesktop,
    paths: [
      "/brand/dashboard",
      "/brand-centre",
      "/brand/media-kits/finalgatecreator00000001",
    ],
  },
  {
    id: "B03",
    role: "BRAND_OWNER",
    state: "onboarding-complete-supported-gatekeeper",
    scope: "Supported Gatekeeper to Preview to Centre; keyboard/focus",
    widths: responsiveBoundary,
    paths: ["/brand/dashboard", "/brand-centre"],
  },
  {
    id: "B04",
    role: "BRAND_OWNER",
    state: "unsupported-gatekeeper",
    scope: "Gatekeeper fail-closed/recovery; no provider escape",
    widths: mobileDesktop,
    paths: ["/brand/dashboard"],
  },
  {
    id: "B05",
    role: "BRAND_OWNER",
    state: "four-canonical-objectives",
    scope:
      "Create/edit/autosave/hydrate AWARENESS, TRUST, ASSETS and ACTION campaigns",
    widths: responsiveBoundary,
    paths: ["/brand/uce/campaigns", "/brand/uce/campaigns/create"],
  },
  {
    id: "B06",
    role: "BRAND_OWNER",
    state: "campaign-workspaces",
    scope:
      "Campaign workspace, three workspace tabs, Add Product and Add Brief",
    widths: mobileDesktop,
    paths: ["/brand/uce/campaigns/f1000000-0000-4000-8000-000000000101"],
  },
  {
    id: "B07",
    role: "BRAND_OWNER",
    state: "legacy-objective",
    scope: "Objective unavailable; Reporting remains fail-closed",
    widths: mobileDesktop,
    paths: ["/brand/uce/campaigns/f1000000-0000-4000-8000-000000000105"],
  },
  {
    id: "B08",
    role: "CREATOR_OWNER",
    secondaryRole: "BRAND_OWNER",
    state: "canonical-c03-c04",
    scope:
      "Opportunity to C03 application to canonical C04 collaboration handoff",
    widths: responsiveBoundary,
    paths: [
      "/creator/campaigns/opportunities/f1000000-0000-4000-8000-000000000101",
      "/creator/collaborations",
    ],
  },
  {
    id: "B09",
    role: "BRAND_OWNER",
    secondaryRole: "FINANCE_ADMIN",
    state: "provider-disabled-brand-payout",
    scope: "Provider-disabled Brand Payout; no execution/write",
    widths: mobileDesktop,
    paths: ["/brand/payouts"],
  },
  {
    id: "B10",
    role: "CAMPAIGN_MANAGER",
    state: "read-only-brand-payout",
    scope: "Read-only/no-financial-row payout behavior and denied action",
    widths: mobileDesktop,
    paths: ["/brand/payouts"],
  },
  {
    id: "B11",
    role: "CREATOR_OWNER",
    state: "creator-platform",
    scope:
      "Onboarding, Home, Centre, Settings and disabled Creator Payout; Creator Chat absent",
    widths: mobileDesktop,
    paths: ["/creator/home", "/creator/settings/account", "/creator/payouts"],
  },
  {
    id: "B12",
    role: "CREATOR_MANAGER",
    secondaryRole: "CREATOR_ASSISTANT",
    state: "creator-role-boundaries",
    scope:
      "C04/settings visibility; Assistant payout denial; Instagram disconnected/connected/provider-unavailable",
    widths: mobileDesktop,
    paths: [
      "/creator/collaborations",
      "/creator/settings/instagram",
      "/creator/payouts",
    ],
  },
] as const;

export const FINAL_GATE_EXECUTIONS = FINAL_GATE_SCENARIOS.flatMap((scenario) =>
  scenario.widths.map((width) => ({ scenario, width })),
);

if (FINAL_GATE_SCENARIOS.length !== 12 || FINAL_GATE_EXECUTIONS.length !== 30) {
  throw new Error("FINAL_GATE_SCENARIO_OR_VIEWPORT_COUNT_MISMATCH");
}

export const ROLE_EMAILS: Record<Exclude<FinalGateRole, "PUBLIC">, string> = {
  BRAND_OWNER: "final-gate-brand-owner@example.test",
  FINANCE_ADMIN: "final-gate-brand-finance@example.test",
  CAMPAIGN_MANAGER: "final-gate-brand-manager@example.test",
  CREATOR_OWNER: "final-gate-creator-owner@example.test",
  CREATOR_MANAGER: "final-gate-creator-manager@example.test",
  CREATOR_ASSISTANT: "final-gate-creator-assistant@example.test",
};
