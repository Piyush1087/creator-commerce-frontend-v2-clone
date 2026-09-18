export type FinalGateRole = "PUBLIC" | "BRAND_OWNER" | "FINANCE_ADMIN" |
  "CAMPAIGN_MANAGER" | "CREATOR_OWNER" | "CREATOR_MANAGER" | "CREATOR_ASSISTANT";
export type ScenarioId = `B${string}`;
export type Operation = Readonly<{ type: string; target: string; role?: FinalGateRole }>;
export type Assertion = Readonly<{ target: string; text?: string }>;
export type WriteClass = Readonly<{ name: string; min: number; max: number }>;

export type FinalGateScenario = Readonly<{
  id: ScenarioId;
  primaryRole: FinalGateRole;
  secondaryRole?: FinalGateRole;
  initialFixtureProfile: string;
  viewports: readonly number[];
  orderedOperations: readonly Operation[];
  visibleAssertions: readonly Assertion[];
  denialAssertions: readonly Assertion[];
  allowedApiInteractions: readonly string[];
  allowedWriteClasses: readonly WriteClass[];
  prohibitedWriteClasses: readonly string[];
  expectedFinalState: string;
  axeShells: readonly string[];
  keyboardFocusTarget: string;
  isolationMode: "RESET_RESEED_AUDIT";
}>;

const mobileDesktop = [390, 1440] as const;
const responsiveBoundary = [390, 767, 768, 1440] as const;
const readOnly = [] as const;
const prohibited = ["PROVIDER_MAPPING", "FINANCIAL_AUTHORITY_INSTRUCTION", "PAYOUT_RECEIPT"] as const;
const scenario = (value: Omit<FinalGateScenario, "isolationMode" | "prohibitedWriteClasses">): FinalGateScenario =>
  ({ ...value, isolationMode: "RESET_RESEED_AUDIT", prohibitedWriteClasses: prohibited });

export const FINAL_GATE_SCENARIOS: readonly FinalGateScenario[] = [
  scenario({ id: "B01", primaryRole: "PUBLIC", initialFixtureProfile: "anonymous-public",
    viewports: mobileDesktop,
    orderedOperations: [{ type: "OPEN_PUBLIC_CAMPAIGN", target: "/campaigns/f1000000-0000-4000-8000-000000000101" }, { type: "OPEN_PUBLIC_MEDIA_KIT", target: "/media-kit/finalgatecreator00000001" }],
    visibleAssertions: [{ target: "campaign", text: "Final Gate AWARENESS Campaign" }, { target: "media-kit", text: "Final Gate Creator" }],
    denialAssertions: [{ target: "private-controls" }], allowedApiInteractions: ["GET /api/v1/public/**"], allowedWriteClasses: readOnly,
    expectedFinalState: "PUBLIC_CONTENT_WITHOUT_PRIVATE_CONTROLS", axeShells: ["campaign", "media-kit"], keyboardFocusTarget: "public-primary-link" }),
  scenario({ id: "B02", primaryRole: "BRAND_OWNER", initialFixtureProfile: "verified-brand",
    viewports: mobileDesktop,
    orderedOperations: [{ type: "OPEN_BRAND_HOME", target: "/brand/dashboard" }, { type: "OPEN_BRAND_CENTRE", target: "/brand-centre" }, { type: "OPEN_VERIFIED_MEDIA_KIT", target: "/brand/media-kits/finalgatecreator00000001" }],
    visibleAssertions: [{ target: "identity", text: "Final Gate Brand Owner" }, { target: "brand-centre" }, { target: "media-kit" }], denialAssertions: [],
    allowedApiInteractions: ["GET /api/v1/brand/**", "GET /api/v1/brand-centre/**"], allowedWriteClasses: readOnly,
    expectedFinalState: "VERIFIED_BRAND_CURRENT_PROJECTIONS", axeShells: ["brand-home", "brand-centre"], keyboardFocusTarget: "brand-navigation" }),
  scenario({ id: "B03", primaryRole: "BRAND_OWNER", initialFixtureProfile: "supported-gatekeeper",
    viewports: responsiveBoundary,
    orderedOperations: [{ type: "CONTINUE_SUPPORTED_GATEKEEPER", target: "/brand/onboarding/scan" }, { type: "ASSERT_PREVIEW", target: "Your Brand Preview" }, { type: "NAVIGATE_BRAND_CENTRE", target: "/brand-centre" }],
    visibleAssertions: [{ target: "preview", text: "Your Brand Preview" }, { target: "brand-centre" }], denialAssertions: [],
    allowedApiInteractions: ["GET /api/v1/discovery/*/preview", "GET /api/v1/brand-centre/**"], allowedWriteClasses: readOnly,
    expectedFinalState: "SUPPORTED_PREVIEW_TO_CURRENT_CENTRE", axeShells: ["preview", "brand-centre"], keyboardFocusTarget: "preview-cta" }),
  scenario({ id: "B04", primaryRole: "BRAND_OWNER", initialFixtureProfile: "unsupported-gatekeeper",
    viewports: mobileDesktop,
    orderedOperations: [{ type: "SUBMIT_UNSUPPORTED_GATEKEEPER", target: "/" }, { type: "RETURN_FROM_DENIAL", target: "Back" }],
    visibleAssertions: [{ target: "unsupported", text: "coming soon" }], denialAssertions: [{ target: "preview-centre-progression" }],
    allowedApiInteractions: ["POST /api/v1/discovery/resolve"], allowedWriteClasses: readOnly,
    expectedFinalState: "UNSUPPORTED_FAIL_CLOSED", axeShells: ["gatekeeper-denial"], keyboardFocusTarget: "recovery-action" }),
  scenario({ id: "B05", primaryRole: "BRAND_OWNER", initialFixtureProfile: "objective-drafts",
    viewports: responsiveBoundary,
    orderedOperations: ["AWARENESS", "TRUST", "ASSETS", "ACTION"].flatMap((objective) => [{ type: "CREATE_OBJECTIVE_DRAFT", target: objective }, { type: "AUTOSAVE_RELOAD_EDIT", target: objective }]),
    visibleAssertions: [{ target: "canonical-objectives" }, { target: "autosave", text: "Saved" }], denialAssertions: [{ target: "legacy-objectives" }],
    allowedApiInteractions: ["POST /api/v1/brand-uce/campaigns/canonical-drafts", "PATCH /api/v1/brand-uce/campaigns/canonical-drafts/*/field"],
    allowedWriteClasses: [{ name: "CANONICAL_CAMPAIGN_DRAFT", min: 4, max: 4 }], expectedFinalState: "FOUR_CANONICAL_HASHED_DRAFTS",
    axeShells: ["campaign-create"], keyboardFocusTarget: "objective-choice" }),
  scenario({ id: "B06", primaryRole: "BRAND_OWNER", initialFixtureProfile: "unlinked-brand-centre-offering",
    viewports: mobileDesktop,
    orderedOperations: [{ type: "TRAVERSE_THREE_WORKSPACES", target: "/brand/uce/campaigns/f1000000-0000-4000-8000-000000000102" }, { type: "LINK_CAMPAIGN_ASSET", target: "Final Gate Unlinked Product" }, { type: "CREATE_CANONICAL_BRIEF", target: "Final Gate Linked Brief" }],
    visibleAssertions: [{ target: "drawer", text: "Brand Centre" }, { target: "asset", text: "Final Gate Unlinked Product" }, { target: "brief", text: "Final Gate Linked Brief" }], denialAssertions: [{ target: "legacy-product-write" }],
    allowedApiInteractions: ["GET /api/v1/brand-uce/campaign-assets/selectable", "POST /api/v1/brand-uce/campaigns/*/assets", "POST /api/v1/brand-uce/campaigns/*/canonical-briefs"],
    allowedWriteClasses: [{ name: "CANONICAL_CAMPAIGN_ASSET_REFERENCE", min: 1, max: 1 }, { name: "CANONICAL_CAMPAIGN_BRIEF", min: 1, max: 1 }],
    expectedFinalState: "ADD_PRODUCT_CANONICAL_CAMPAIGN_ASSET_REFERENCE_FLOW", axeShells: ["campaign-workspace", "asset-drawer", "brief-drawer"], keyboardFocusTarget: "link-campaign-asset" }),
  scenario({ id: "B07", primaryRole: "BRAND_OWNER", initialFixtureProfile: "legacy-objective",
    viewports: mobileDesktop, orderedOperations: [{ type: "OPEN_LEGACY_CAMPAIGN", target: "/brand/uce/campaigns/f1000000-0000-4000-8000-000000000105" }, { type: "ASSERT_REPORTING_CONTROL_ABSENT", target: "legacy Campaign" }, { type: "GET_CANONICAL_REPORTING_FAIL_CLOSED", target: "/api/v1/brand-uce/campaigns/f1000000-0000-4000-8000-000000000101/reporting" }, { type: "POST_CANONICAL_REPORTING_REFRESH_FAIL_CLOSED", target: "/api/v1/brand-uce/campaigns/f1000000-0000-4000-8000-000000000101/reporting/refresh-sync" }],
    visibleAssertions: [{ target: "objective", text: "Objective unavailable" }], denialAssertions: [{ target: "legacy-objective-as-current" }, { target: "reachable-reporting-control" }, { target: "fabricated-performance" }],
    allowedApiInteractions: ["GET /api/v1/brand-uce/campaigns/*/page", "GET /api/v1/brand-uce/campaigns/*/reporting", "POST /api/v1/brand-uce/campaigns/*/reporting/refresh-sync"], allowedWriteClasses: readOnly,
    expectedFinalState: "LEGACY_PRESENTATION_AND_CANONICAL_REPORTING_FAIL_CLOSED", axeShells: ["legacy-campaign"], keyboardFocusTarget: "campaign-navigation" }),
  scenario({ id: "B08", primaryRole: "CREATOR_OWNER", secondaryRole: "BRAND_OWNER", initialFixtureProfile: "c03-c04-preaction",
    viewports: responsiveBoundary, orderedOperations: [{ type: "SUBMIT_APPLICATION", target: "CREATOR_OWNER", role: "CREATOR_OWNER" }, { type: "APPROVE_APPLICATION", target: "BRAND_OWNER", role: "BRAND_OWNER" }, { type: "ASSERT_COLLABORATION", target: "CREATOR_OWNER", role: "CREATOR_OWNER" }],
    visibleAssertions: [{ target: "application", text: "Submitted" }, { target: "collaboration" }], denialAssertions: [{ target: "duplicate-collaboration" }],
    allowedApiInteractions: ["POST /api/v1/creator/campaign-opportunities/*/applications", "POST /api/v1/brand/uce/campaigns/*/applications/*/approve"],
    allowedWriteClasses: [{ name: "C03_APPLICATION", min: 1, max: 1 }, { name: "C04_HANDOFF", min: 1, max: 1 }], expectedFinalState: "ONE_APPROVED_APPLICATION_ONE_LINKED_COLLABORATION",
    axeShells: ["opportunity", "applicants", "collaborations"], keyboardFocusTarget: "apply-action" }),
  scenario({ id: "B09", primaryRole: "BRAND_OWNER", secondaryRole: "FINANCE_ADMIN", initialFixtureProfile: "provider-disabled-payout",
    viewports: mobileDesktop, orderedOperations: [{ type: "VIEW_PAYOUT", target: "/brand/payouts", role: "BRAND_OWNER" }, { type: "VIEW_PAYOUT", target: "/brand/payouts", role: "FINANCE_ADMIN" }],
    visibleAssertions: [{ target: "provider-disabled" }], denialAssertions: [{ target: "execution-retry-trigger" }], allowedApiInteractions: ["GET /api/v1/brand/payouts/**"], allowedWriteClasses: readOnly,
    expectedFinalState: "TWO_ROLE_PROVIDER_DISABLED_READ_ONLY", axeShells: ["brand-payouts"], keyboardFocusTarget: "payout-navigation" }),
  scenario({ id: "B10", primaryRole: "CAMPAIGN_MANAGER", initialFixtureProfile: "campaign-manager-payout-denial",
    viewports: mobileDesktop, orderedOperations: [{ type: "VIEW_READ_ONLY_PAYOUT", target: "/brand/payouts" }], visibleAssertions: [{ target: "read-only" }], denialAssertions: [{ target: "sensitive-financial-rows" }, { target: "financial-action" }],
    allowedApiInteractions: ["GET /api/v1/brand/payouts/**"], allowedWriteClasses: readOnly, expectedFinalState: "NON_ENUMERATING_READ_ONLY_PAYOUT",
    axeShells: ["brand-payouts"], keyboardFocusTarget: "payout-navigation" }),
  scenario({ id: "B11", primaryRole: "CREATOR_OWNER", initialFixtureProfile: "creator-platform-complete",
    viewports: mobileDesktop, orderedOperations: [{ type: "OPEN_CREATOR_HOME", target: "/creator/home" }, { type: "OPEN_CREATOR_CENTRE", target: "/creator/centre" }, { type: "OPEN_CREATOR_SETTINGS", target: "/creator/settings/account" }, { type: "OPEN_CREATOR_PAYOUT", target: "/creator/payouts" }],
    visibleAssertions: [{ target: "creator-platform" }, { target: "provider-disabled" }], denialAssertions: [{ target: "creator-chat" }, { target: "payout-execution" }],
    allowedApiInteractions: ["GET /api/v1/creator/**"], allowedWriteClasses: readOnly, expectedFinalState: "LIMITED_CREATOR_PLATFORM_PROVIDER_DISABLED",
    axeShells: ["creator-home", "creator-centre", "creator-settings", "creator-payouts"], keyboardFocusTarget: "creator-navigation" }),
  scenario({ id: "B12", primaryRole: "CREATOR_MANAGER", secondaryRole: "CREATOR_ASSISTANT", initialFixtureProfile: "creator-role-instagram-states",
    viewports: mobileDesktop, orderedOperations: [{ type: "VIEW_MANAGER_SETTINGS", target: "/creator/settings/instagram", role: "CREATOR_MANAGER" }, { type: "VIEW_ASSISTANT_SETTINGS", target: "/creator/settings/account", role: "CREATOR_ASSISTANT" }, { type: "ASSERT_INSTAGRAM_STATES", target: "DISCONNECTED|CONNECTED_SYNTHETIC|PROVIDER_UNAVAILABLE" }, { type: "ASSERT_ASSISTANT_PAYOUT_DENIAL", target: "/creator/payouts", role: "CREATOR_ASSISTANT" }],
    visibleAssertions: [{ target: "manager-c04-settings" }, { target: "three-instagram-states" }], denialAssertions: [{ target: "assistant-payout-non-enumerating" }],
    allowedApiInteractions: ["GET /api/v1/creator/settings/**", "GET /api/v1/creator/collaborations/**"], allowedWriteClasses: readOnly,
    expectedFinalState: "SCOPED_ROLES_THREE_LOCAL_INSTAGRAM_STATES", axeShells: ["creator-settings", "creator-collaborations"], keyboardFocusTarget: "settings-navigation" }),
] as const;

export const FINAL_GATE_EXECUTIONS = FINAL_GATE_SCENARIOS.flatMap((entry) => entry.viewports.map((width) => ({ scenario: entry, width })));
export const REPRESENTATIVE_WIDTHS: Record<ScenarioId, number> = { B01: 390, B02: 1440, B03: 767, B04: 390, B05: 768, B06: 1440, B07: 390, B08: 1440, B09: 390, B10: 1440, B11: 390, B12: 1440 };
export const ROLE_EMAILS: Record<Exclude<FinalGateRole, "PUBLIC">, string> = {
  BRAND_OWNER: "final-gate-brand-owner@example.test", FINANCE_ADMIN: "final-gate-brand-finance@example.test", CAMPAIGN_MANAGER: "final-gate-brand-manager@example.test",
  CREATOR_OWNER: "final-gate-creator-owner@example.test", CREATOR_MANAGER: "final-gate-creator-manager@example.test", CREATOR_ASSISTANT: "final-gate-creator-assistant@example.test",
};

if (FINAL_GATE_SCENARIOS.length !== 12 || FINAL_GATE_EXECUTIONS.length !== 30)
  throw new Error("FINAL_GATE_SCENARIO_OR_VIEWPORT_COUNT_MISMATCH");
