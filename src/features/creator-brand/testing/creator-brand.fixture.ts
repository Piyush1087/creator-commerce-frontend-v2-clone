import { CreatorBrandConsumerSchema } from "../contracts/creator-brand-consumer.schema";
import { emptyCreatorBrandProfile } from "../contracts/creator-brand-profile.contract";
export function creatorBrandFixture(
  role: "OWNER" | "MANAGER" | "ASSISTANT" = "OWNER",
  configured = false,
) {
  const family = () => ({
    availability: "INSUFFICIENT_EVIDENCE",
    candidates: [],
  });
  return CreatorBrandConsumerSchema.parse({
    contractVersion: "creator-brand-v0.1",
    identity: {
      creatorName: "Synthetic Creator",
      avatarImageReference: null,
      primaryInstagramHandle: null,
    },
    state: configured ? "CONFIGURED" : "UNCONFIGURED",
    profile: configured
      ? {
          ...emptyCreatorBrandProfile(),
          headline: "Confirmed positioning",
          commercialBio: "Manual bio",
        }
      : null,
    currentRevision: configured ? 1 : 0,
    context: {
      role,
      allowedActions:
        role === "ASSISTANT"
          ? ["CREATOR_BRAND_READ"]
          : [
              "CREATOR_BRAND_READ",
              "CREATOR_BRAND_EDIT",
              "CREATOR_BRAND_CONFIRM_SUGGESTION",
            ],
      manualFirst: true,
      sourceIndependent: true,
    },
    suggestions: {
      contractVersion: "creator-brand-suggestions-v0.1",
      state: "UNAVAILABLE",
      freshness: "UNKNOWN",
      processing: "IDLE",
      objectGenerationId: null,
      autoApply: false,
      coverage: 0,
      eligiblePosts: 0,
      limitations: ["NO_CURRENT_AUTHORIZED_CONTENT_BASIS"],
      families: {
        positioning: family(),
        voice_personality: family(),
        creator_style: family(),
        visual_identity: family(),
        languages: family(),
      },
    },
  });
}
export function supportedFixture() {
  const data = creatorBrandFixture("OWNER", true);
  data.suggestions.state = "AVAILABLE";
  data.suggestions.freshness = "CURRENT";
  data.suggestions.objectGenerationId = "11111111-1111-4111-8111-111111111111";
  data.suggestions.families.positioning = {
    availability: "AVAILABLE",
    candidates: [
      {
        candidateId: "a".repeat(64),
        field: "headline",
        value: "Suggested positioning",
        confidence: "LOW",
        supportingPosts: 3,
        componentGenerationId: "22222222-2222-4222-8222-222222222222",
        confirmable: true,
      },
    ],
  };
  return data;
}
