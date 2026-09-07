import type {
  AuthorizedOpportunity,
  ApplicationDetail,
  Receipt,
} from "../contracts/c03.contracts";
export const fixtureId = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function opportunityFixture(count = 1): AuthorizedOpportunity {
  return {
    schemaVersion: 1,
    state: "AUTHORIZED",
    applicationsOpen: true,
    canApply: true,
    applyBlockedReason: null,
    applicationDeadline: "2030-10-01T00:00:00.000Z",
    campaign: {
      id: fixtureId(1),
      name: "Everyday stories",
      platforms: ["INSTAGRAM"],
      brand: {
        name: "Studio Brand",
        description: "Thoughtful everyday essentials.",
        domain: "studio.example",
        logoUrl: null,
      },
      objective: "AWARENESS",
      publishingStart: "2030-10-02T00:00:00.000Z",
      publishingEnd: "2030-11-01T00:00:00.000Z",
      commercial: {
        compensationModel: "FIXED",
        offer: "0",
        currency: "INR",
        receivesBrandSupport: true,
        brandSupportType: "PRODUCT",
        brandSupportEstimatedValue: null,
      },
    },
    assets: [
      {
        id: fixtureId(2),
        campaignId: fixtureId(1),
        kind: "BRAND",
        status: "ACTIVE",
        offering: null,
        offer: null,
        briefs: Array.from({ length: count }, (_, i) => ({
          id: fixtureId(3 + i),
          campaignAssetId: fixtureId(2),
          status: "PUBLISHED",
          creationSource: "MANUAL",
          applicationSelection: { state: "AVAILABLE" },
          definition: {
            briefName: `Everyday story ${i + 1}`,
            creativeIntent: "Share a considered everyday routine.",
            creatorBrief:
              "Show an authentic everyday moment with clear disclosure.",
            briefType: "CREATOR_LED",
            platform: "INSTAGRAM",
            briefLevelGuidance: { tone: "Warm and natural" },
            referenceContent: { links: ["https://studio.example/reference"] },
            usageRights: { duration: "30 days" },
            creatorRequirements: "Follow the supplied creative guidance.",
            deliverables: [
              {
                id: fixtureId(30 + i),
                format: "REEL_VIDEO",
                displayOrder: i,
                configuration: { duration: "30 seconds" },
                creativeGuidance: { note: "Use natural light" },
                amplifyTargetDeliverableId: null,
              },
            ],
          },
        })),
      },
    ],
  };
}
export function applicationFixture(
  status: ApplicationDetail["status"] = "PENDING",
  n = 100,
): ApplicationDetail {
  const opportunity = opportunityFixture();
  const { commercial, ...campaign } = opportunity.campaign;
  if ("state" in commercial)
    throw new Error("Fixture requires commercial evidence");
  const { briefs, status: assetStatus, ...asset } = opportunity.assets[0];
  void assetStatus;
  return {
    schemaVersion: 1,
    applicationId: fixtureId(n),
    referenceAuthority: "C03_CANONICAL",
    campaignId: campaign.id,
    canonicalCampaignAssetId: asset.id,
    canonicalBriefId: briefs[0].id,
    status,
    statusVersion: status === "PENDING" ? 1 : 2,
    appliedAt: "2030-09-01T10:00:00.000Z",
    terminalAt: status === "PENDING" ? null : "2030-09-02T10:00:00.000Z",
    campaign: {
      ...campaign,
      applicationDeadline: opportunity.applicationDeadline,
    },
    asset,
    brief: {
      id: briefs[0].id,
      campaignAssetId: asset.id,
      ...briefs[0].definition,
    },
    creator: { displayName: "Creator", avatarUrl: null },
    commercial,
    canWithdrawPending: status === "PENDING",
    collaborationId: status === "APPROVED" ? fixtureId(200) : null,
  };
}
export const receiptFixture: Receipt = {
  applicationId: fixtureId(100),
  transitionId: fixtureId(101),
  status: "PENDING",
  statusVersion: 1,
  occurredAt: "2030-09-01T10:00:00.000Z",
};
