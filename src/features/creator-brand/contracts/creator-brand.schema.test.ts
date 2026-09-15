import { describe, expect, it } from "vitest";
import { CreatorBrandConsumerSchema } from "./creator-brand-consumer.schema";
import {
  CreatorBrandProfileInputSchema,
  CreatorBrandMutationRequestSchema,
  emptyCreatorBrandProfile,
} from "./creator-brand-profile.contract";
import {
  creatorBrandFixture,
  supportedFixture,
} from "../testing/creator-brand.fixture";
import {
  CREATOR_ARCHETYPES,
  CREATOR_ARCHETYPE_MAX,
} from "../../uce/components/creator-strategy/creator-strategy-model";
describe("Creator Brand strict contracts", () => {
  it("accepts the exact P2 consumer", () =>
    expect(
      CreatorBrandConsumerSchema.safeParse(creatorBrandFixture()).success,
    ).toBe(true));
  it.each(["token", "providerPayload", "prompt", "reasoning", "workspaceId"])(
    "rejects unknown %s",
    (key) =>
      expect(
        CreatorBrandConsumerSchema.safeParse({
          ...creatorBrandFixture(),
          [key]: "forbidden",
        }).success,
      ).toBe(false),
  );
  it("rejects HIGH", () => {
    const data = supportedFixture();
    expect(
      CreatorBrandConsumerSchema.safeParse({
        ...data,
        suggestions: {
          ...data.suggestions,
          families: {
            ...data.suggestions.families,
            positioning: {
              availability: "AVAILABLE",
              candidates: [
                {
                  ...data.suggestions.families.positioning.candidates[0],
                  confidence: "HIGH",
                },
              ],
            },
          },
        },
      }).success,
    ).toBe(false);
  });
  it("rejects auto-apply", () => {
    const data = creatorBrandFixture();
    expect(
      CreatorBrandConsumerSchema.safeParse({
        ...data,
        suggestions: { ...data.suggestions, autoApply: true },
      }).success,
    ).toBe(false);
  });
  it("rejects sixth family", () => {
    const data = creatorBrandFixture();
    expect(
      CreatorBrandConsumerSchema.safeParse({
        ...data,
        suggestions: {
          ...data.suggestions,
          families: { ...data.suggestions.families, bio: {} },
        },
      }).success,
    ).toBe(false);
  });
  it("rejects canonical configuration mismatch", () =>
    expect(
      CreatorBrandConsumerSchema.safeParse({
        ...creatorBrandFixture(),
        currentRevision: 1,
      }).success,
    ).toBe(false));
  it("normalizes hex and BCP47", () =>
    expect(
      CreatorBrandProfileInputSchema.parse({
        ...emptyCreatorBrandProfile(),
        palette: ["#aabbcc"],
        languages: ["en-us"],
      }),
    ).toMatchObject({ palette: ["#AABBCC"], languages: ["en-US"] }));
  it.each([
    ["headline", "x".repeat(161)],
    ["commercialBio", "x".repeat(1001)],
    ["voiceDescription", "x".repeat(301)],
    ["visualStyleDescriptors", ["x".repeat(101)]],
    ["palette", ["green"]],
    ["languages", ["not_a_language"]],
    ["primaryNicheIds", ["CUSTOM"]],
    ["voiceDescriptorIds", ["CUSTOM"]],
    ["creatorArchetypeIds", ["CUSTOM"]],
  ])("rejects invalid %s", (field, value) =>
    expect(
      CreatorBrandProfileInputSchema.safeParse({
        ...emptyCreatorBrandProfile(),
        [field]: value,
      }).success,
    ).toBe(false),
  );
  it.each([
    ["primaryNicheIds", ["BEAUTY", "FASHION", "LIFESTYLE", "FITNESS"]],
    ["voiceDescriptorIds", ["WARM", "DIRECT", "CALM", "BOLD"]],
    ["creatorArchetypeIds", CREATOR_ARCHETYPES.slice(0, 4).map(([id]) => id)],
    ["palette", Array.from({ length: 6 }, (_, i) => `#00000${i}`)],
    [
      "languages",
      ["en", "hi", "fr", "de", "it", "es", "pt", "ja", "zh", "ar", "ko"],
    ],
  ])("rejects exceeded %s", (field, value) =>
    expect(
      CreatorBrandProfileInputSchema.safeParse({
        ...emptyCreatorBrandProfile(),
        [field]: value,
      }).success,
    ).toBe(false),
  );
  it("rejects normalized duplicates", () =>
    expect(
      CreatorBrandProfileInputSchema.safeParse({
        ...emptyCreatorBrandProfile(),
        languages: ["en-us", "en-US"],
      }).success,
    ).toBe(false));
  it("requires confirmed archetypes for nonempty selection", () =>
    expect(
      CreatorBrandProfileInputSchema.safeParse({
        ...emptyCreatorBrandProfile(),
        creatorArchetypeIds: ["EDUCATOR"],
      }).success,
    ).toBe(false));
  it("accepts full manual progressive command", () =>
    expect(
      CreatorBrandMutationRequestSchema.safeParse({
        intent: "MANUAL",
        expectedRevision: 0,
        idempotencyKey: crypto.randomUUID(),
        values: emptyCreatorBrandProfile(),
      }).success,
    ).toBe(true));
  it("USE has refs but no values/provenance", () => {
    const candidate =
      supportedFixture().suggestions.families.positioning.candidates[0];
    const command = {
      intent: "USE_SUGGESTION",
      expectedRevision: 1,
      idempotencyKey: crypto.randomUUID(),
      suggestionReference: {
        objectGenerationId: crypto.randomUUID(),
        componentGenerationId: candidate.componentGenerationId,
        candidateId: candidate.candidateId,
      },
    };
    expect(CreatorBrandMutationRequestSchema.safeParse(command).success).toBe(
      true,
    );
    expect(
      CreatorBrandMutationRequestSchema.safeParse({
        ...command,
        values: emptyCreatorBrandProfile(),
      }).success,
    ).toBe(false);
  });
  it("keeps Campaign's same 30 IDs and max five, including UGC style only", () => {
    expect(CREATOR_ARCHETYPES).toHaveLength(30);
    expect(CREATOR_ARCHETYPE_MAX).toBe(5);
    const profile = CreatorBrandProfileInputSchema.parse({
      ...emptyCreatorBrandProfile(),
      creatorArchetypeIds: ["UGC_CREATOR"],
      archetypeState: "CONFIRMED",
    });
    expect(profile).not.toHaveProperty("openToUgcProjects");
  });
});
