import { creatorBriefPackSchema } from "../contracts/c03.contracts";
import { fixtureId } from "./c03-fixtures";
export function briefPackFixture() {
  return creatorBriefPackSchema.parse({
    schemaVersion: 1,
    application: {
      applicationId: fixtureId(100),
      reference: fixtureId(100),
      submittedAt: "2030-09-01T10:00:00.000Z",
    },
    brand: {
      name: "Studio Brand",
      description: null,
      domain: "studio.example",
      logoUrl: null,
    },
    campaign: {
      name: "Everyday stories",
      objective: null,
      platforms: ["INSTAGRAM"],
      publishingStart: null,
      publishingEnd: null,
      applicationDeadline: null,
    },
    commercial: {
      compensationModel: "FIXED",
      offer: "0",
      currency: "INR",
      receivesBrandSupport: false,
      brandSupportType: null,
      brandSupportEstimatedValue: null,
    },
    asset: { kind: "BRAND", offering: null, offer: null },
    brief: {
      briefName: "Everyday story",
      creativeIntent: "Share a considered everyday routine.",
      creatorBrief: "Show an authentic everyday moment with clear disclosure.",
      briefType: "CREATOR_LED",
      platform: "INSTAGRAM",
      briefLevelGuidance: null,
      referenceContent: null,
      usageRights: null,
      creatorRequirements: null,
      deliverables: [
        {
          id: fixtureId(30),
          format: "REEL_VIDEO",
          displayOrder: 0,
          configuration: null,
          creativeGuidance: null,
          amplifyTargetDeliverableId: null,
        },
      ],
    },
  });
}
