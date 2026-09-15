import { Test, type TestingModule } from "@nestjs/testing";
import {
  AuthMethodType,
  CreatorTeamRole,
  OrganizationKind,
  PrismaClient,
  UserAuthState,
  UserRole,
} from "@prisma/client";
import { AppModule } from "../../backend/src/app.module";
import { CreatorContentPipelineService } from "../../backend/src/features/creator-content/creator-content-pipeline.service";
import { CreatorContentGroundedModelPort } from "../../backend/src/features/creator-content/creator-content-multimodal.service";
import { creatorContentExternalFixture } from "../../backend/src/features/creator-content/testing/creator-content-external.fixture";
import { InstagramImageLocatorClient } from "../../backend/src/features/instagram/media/instagram-contained-image-acquisition.service";
import { InstagramImageTemporaryStore } from "../../backend/src/features/instagram/media/instagram-image-temporary-store";
import {
  NodeInstagramImageDnsResolver,
  NodeInstagramPinnedHttpsTransport,
} from "../../backend/src/features/instagram/media/instagram-secure-image-downloader";
import { InstagramVideoTemporaryStore } from "../../backend/src/features/instagram/media/video/instagram-video-temporary-store";
import { InstagramVideoLocatorClient } from "../../backend/src/features/instagram/media/video/instagram-video-locator.client";
import { InstagramVideoDecoderPort } from "../../backend/src/features/instagram/media/video/instagram-video-decoder";
import { InstagramAudioExtractorPort } from "../../backend/src/features/instagram/media/video/instagram-audio-extractor";
import { InstagramB3aVisualModelPort } from "../../backend/src/features/instagram-intelligence/media/instagram-b3a-visual-observation";
import { InstagramW1VideoFrameModelPort } from "../../backend/src/features/instagram-intelligence/media/instagram-w1-video-frame-observation";
import { InstagramVisualTextModelPort } from "../../backend/src/features/instagram/media/instagram-visual-text";
import { InstagramSpeechTranscriptionPort } from "../../backend/src/features/instagram/media/video/instagram-speech";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import {
  INSTAGRAM_INTELLIGENCE_PROVIDER_READ_CLIENT,
  type InstagramIntelligenceProviderReadClient,
} from "../../backend/src/features/instagram/instagram-intelligence-provider.types";
import { encryptField } from "../../backend/src/shared/crypto/field-encryption.util";
import { hashPasswordAsync } from "../../backend/src/shared/crypto/password.util";

import {
  CREATOR_BRAND_SEMANTIC_PORT,
  type CreatorBrandSemanticPort,
} from "../../backend/src/features/creator-brand/creator-brand-suggestions.processor";
import { CreatorBrandSuggestionsPipeline } from "../../backend/src/features/creator-brand/creator-brand-suggestions.pipeline";
import { CreatorWorkspaceActorService } from "../../backend/src/features/creator-settings/team/creator-workspace-actor.service";
const model: CreatorBrandSemanticPort = {
  identity: () => ({
    provider: "LOCAL_FIXTURE",
    model: "grounded-fixture",
    profileVersion: "1.0",
  }),
  observe: async ({ posts }) => {
    const support = posts
      .filter((post) => post.semantic.state === "AVAILABLE" && post.caption)
      .slice(0, 5)
      .map((post) => ({
        providerMediaId: post.providerMediaId,
        modality: "caption",
        excerpt: post.caption!.slice(0, 200),
      }));
    const visual = posts
      .filter(
        (post) =>
          post.semantic.state === "AVAILABLE" &&
          post.semantic.visualExecution.length,
      )
      .slice(0, 5);
    return {
      contractVersion: "1.0",
      candidates: [
        { field: "primaryNicheIds", value: ["EDUCATION"], support },
        { field: "headline", value: "Tutorial creator", support },
        { field: "voiceDescriptorIds", value: ["EDUCATIONAL"], support },
        {
          field: "voiceDescription",
          value: "Source-supported tutorial delivery",
          support,
        },
        { field: "creatorArchetypeIds", value: ["EDUCATOR"], support },
        { field: "languageTags", value: ["en"], support },
        ...(visual.length >= 3
          ? [
              {
                field: "visualStyleDescriptors",
                value: [visual[0].semantic.visualExecution[0].slice(0, 100)],
                support: visual.map((post) => ({
                  providerMediaId: post.providerMediaId,
                  modality: "visualExecution",
                  excerpt: post.semantic.visualExecution[0],
                })),
              },
            ]
          : []),
      ],
    };
  },
};
const EMAIL = "creator-brand-p3@example.test";
const ACCOUNT = "creator-brand-p3-provider-account";
const TEAM = [
  ["creator-brand-p3-manager@example.test", CreatorTeamRole.MANAGER, true],
  ["creator-brand-p3-assistant@example.test", CreatorTeamRole.ASSISTANT, true],
  ["creator-brand-p3-inactive@example.test", CreatorTeamRole.ASSISTANT, false],
] as const;

async function main() {
  if (
    process.env.CREATOR_BRAND_P3_FIXTURE !== "true" ||
    !process.env.CREATOR_BRAND_P3_PASSWORD ||
    !process.env.CREATOR_BRAND_P3_PROVIDER_TOKEN
  )
    throw new Error("P4 fixture guard and synthetic inputs are required");
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.pathname !== "/creator_content_p4_clean"
  )
    throw new Error("P4 fixture requires the exact disposable local database");
  const failProvider = false;
  let providerCalls = 0;
  const external = await creatorContentExternalFixture(
    `p3-brand-c1-${process.pid}`,
  );
  const cleanupRoot = dirname(external.imageStore.getRootForDiagnostics());
  if (
    !cleanupRoot.endsWith(
      `creator-content-correction-p3-brand-c1-${process.pid}`,
    )
  )
    throw new Error("UNSAFE_FIXTURE_CLEANUP_TARGET");
  const capturedAt = new Date();
  const provider: InstagramIntelligenceProviderReadClient = {
    readProfile: async () => {
      throw new Error("UNEXPECTED_PROVIDER_METHOD");
    },
    readAudienceInsights: async () => {
      throw new Error("UNEXPECTED_PROVIDER_METHOD");
    },
    readCarouselChildren: async () => {
      providerCalls += 1;
      return {
        availability: "AVAILABLE",
        stopReason: "EXHAUSTED",
        children: [0, 1].map((ordinal) => ({
          providerMediaId: `carousel-child-${ordinal}`,
          ordinal,
          mediaType: { state: "OBSERVED", value: "IMAGE" },
          mediaProductType: { state: "OBSERVED", value: "FEED" },
        })),
      };
    },
    readMediaInventory: async (_credential, end, days) => {
      if (days !== 90 || end.toISOString() !== capturedAt.toISOString())
        throw new Error("CONTENT_WINDOW_REQUEST_MISMATCH");
      providerCalls += 1;
      if (failProvider) throw new Error("SYNTHETIC_PROVIDER_FAILURE");
      const items = Array.from({ length: 8 }, (_, index) => ({
        providerMediaId: `content-media-${index}`,
        mediaType: {
          state: "OBSERVED" as const,
          value: index === 0 ? "CAROUSEL_ALBUM" : "IMAGE",
        },
        mediaProductType: {
          state: "OBSERVED" as const,
          value:
            index === 1 ? "REELS" : index === 0 ? "CAROUSEL_ALBUM" : "IMAGE",
        },
        permalink: {
          state: "OBSERVED" as const,
          value: `https://www.instagram.com/p/content-media-${index}/`,
        },
        caption: {
          state: "OBSERVED" as const,
          value: "English tutorial",
        },
        timestamp: {
          state: "OBSERVED" as const,
          value: new Date(
            capturedAt.getTime() - (index === 7 ? 45 : index) * 86_400_000,
          ).toISOString(),
        },
      }));
      return {
        availability: "AVAILABLE" as const,
        items,
        coverage: {
          windowStart: new Date(
            capturedAt.getTime() - 90 * 86_400_000,
          ).toISOString(),
          windowEnd: capturedAt.toISOString(),
          pagesAttempted: 1,
          pagesCompleted: 1,
          rowsReturned: items.length,
          rowsEligible: items.length,
          rowsMissingTimestamp: 0,
          duplicatesDiscarded: 0,
          oldestObservedTimestamp: items.at(-1)!.timestamp.value,
          newestObservedTimestamp: items[0].timestamp.value,
          stopReason: "EXHAUSTED" as const,
        },
      };
    },
    readMediaInsights: async (_, mediaId) => {
      providerCalls += 1;
      const high = Number(mediaId.slice(-1)) < 4;
      const metric = (value: number) =>
        value === 0
          ? ({ state: "OBSERVED_ZERO", value: 0 } as const)
          : ({ state: "OBSERVED", value } as const);
      const unavailable = {
        state: "UNAVAILABLE" as const,
        reason: "NO_PROVIDER_DENOMINATOR" as const,
      };
      return {
        availability: "AVAILABLE" as const,
        mediaType: "IMAGE",
        metrics: {
          comments: metric(1),
          likes: metric(high ? 20 : 5),
          reach: metric(100),
          saved: metric(1),
          shares: metric(1),
          total_interactions: metric(high ? 20 : 5),
          views: metric(100),
        },
        units: {
          comments: "COUNT" as const,
          likes: "COUNT" as const,
          reach: "COUNT" as const,
          saved: "COUNT" as const,
          shares: "COUNT" as const,
          total_interactions: "COUNT" as const,
          views: "COUNT" as const,
        },
        denominators: {
          comments: unavailable,
          likes: unavailable,
          reach: unavailable,
          saved: unavailable,
          shares: unavailable,
          total_interactions: unavailable,
          views: unavailable,
        },
        providerObservationTime: {
          state: "UNAVAILABLE" as const,
          reason: "PROVIDER_DOES_NOT_RETURN_OBSERVATION_TIME" as const,
        },
        providerLagLimitHours: 48 as const,
      };
    },
  };
  const db = new PrismaClient();
  let module: TestingModule | undefined;
  try {
    if (await db.user.count({ where: { email: EMAIL } }))
      throw new Error("P4 fixture database must begin clean");
    const passwordHash = await hashPasswordAsync(
      process.env.CREATOR_BRAND_P3_PASSWORD,
    );
    const organization = await db.organization.create({
      data: {
        name: "Creator Content P4 Fixture",
        kind: OrganizationKind.CREATOR,
      },
    });
    const user = await db.user.create({
      data: {
        email: EMAIL,
        name: "Content Fixture Owner",
        role: UserRole.CREATOR,
        authState: UserAuthState.ACTIVE,
        emailVerifiedAt: new Date(),
        organizationId: organization.id,
        hashedPassword: passwordHash,
        authMethods: {
          create: {
            type: AuthMethodType.PASSWORD,
            credentialHash: passwordHash,
          },
        },
        creatorProfile: { create: {} },
      },
      include: { creatorProfile: true },
    });
    if (!user.creatorProfile)
      throw new Error("Creator profile was not created");
    const workspace = await db.creatorWorkspace.create({
      data: {
        ownerProfileId: user.creatorProfile.id,
        organizationId: organization.id,
        members: {
          create: {
            assignedProfileId: user.creatorProfile.id,
            userId: user.id,
            associatedEmail: EMAIL,
            securityRole: CreatorTeamRole.OWNER,
            joinedAt: new Date(),
          },
        },
      },
    });
    for (const [email, securityRole, isActive] of TEAM) {
      const memberOrganization = await db.organization.create({
        data: { name: `Content ${securityRole} Fixture`, kind: "CREATOR" },
      });
      const member = await db.user.create({
        data: {
          email,
          name: `Content ${securityRole} Fixture`,
          role: UserRole.CREATOR,
          authState: UserAuthState.ACTIVE,
          emailVerifiedAt: new Date(),
          organizationId: memberOrganization.id,
          hashedPassword: passwordHash,
          authMethods: {
            create: {
              type: AuthMethodType.PASSWORD,
              credentialHash: passwordHash,
            },
          },
        },
      });
      await db.creatorWorkspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: member.id,
          associatedEmail: email,
          securityRole,
          isActive,
          joinedAt: isActive ? new Date() : null,
        },
      });
    }
    const integration = await db.creatorSocialIntegration.create({
      data: {
        creatorProfileId: user.creatorProfile.id,
        platformNetwork: "INSTAGRAM",
        nativePlatformUserId: ACCOUNT,
        channelHandleString: "creator_content_p4",
        oauthAccessTokenEncrypted: encryptField(
          process.env.CREATOR_BRAND_P3_PROVIDER_TOKEN,
        ),
        tokenScopePermissions: [
          "instagram_business_basic",
          "instagram_business_manage_insights",
        ],
        tokenStateCondition: "ACTIVE",
        authorizationGeneration: 1,
        authorizationHealth: "USABLE",
        basicAuthorizationCapability: "AVAILABLE",
        insightsCapability: "AVAILABLE",
        professionalAccountType: "CREATOR",
        lastAuthorizationValidatedAt: new Date(),
      },
    });
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CREATOR_BRAND_SEMANTIC_PORT)
      .useValue(model)
      .overrideProvider(INSTAGRAM_INTELLIGENCE_PROVIDER_READ_CLIENT)
      .useValue(provider)
      .overrideProvider(InstagramImageLocatorClient)
      .useValue(external.imageLocator)
      .overrideProvider(InstagramVideoLocatorClient)
      .useValue(external.videoLocator)
      .overrideProvider(NodeInstagramImageDnsResolver)
      .useValue(external.resolver)
      .overrideProvider(NodeInstagramPinnedHttpsTransport)
      .useValue(external.transport)
      .overrideProvider(InstagramImageTemporaryStore)
      .useValue(external.imageStore)
      .overrideProvider(InstagramVideoTemporaryStore)
      .useValue(external.videoStore)
      .overrideProvider(InstagramVideoDecoderPort)
      .useValue(external.decoder)
      .overrideProvider(InstagramAudioExtractorPort)
      .useValue(external.audio)
      .overrideProvider(InstagramB3aVisualModelPort)
      .useValue(external.visual)
      .overrideProvider(InstagramW1VideoFrameModelPort)
      .useValue(external.frameModel)
      .overrideProvider(InstagramVisualTextModelPort)
      .useValue(external.ocr)
      .overrideProvider(InstagramSpeechTranscriptionPort)
      .useValue(external.speech)
      .overrideProvider(CreatorContentGroundedModelPort)
      .useValue(external.grounded)
      .compile();
    await module.init();
    const pipeline = module.get(CreatorContentPipelineService);
    const actor = {
      actorUserId: user.id,
      actorMembershipId: workspace.id,
      actorRole: "OWNER" as const,
      workspaceId: workspace.id,
      organizationId: organization.id,
      subjectCreatorProfileId: user.creatorProfile.id,
      subjectOwnerUserId: user.id,
      allowedActions: ["INSIGHTS_CONTENT_READ" as const],
    };
    const input = {
      actor,
      integrationId: integration.id,
      providerAccountId: ACCOUNT,
      authorizationGeneration: 1,
      capturedAt,
      requestIdentity: "creator-content:p4:production-path:success:v1",
    };
    const success = await pipeline.execute(input);
    const callsAfterSuccess = {
      provider: providerCalls,
      external: { ...external.count },
    };
    const replay = await pipeline.execute(input);

    if (
      success.reused ||
      !replay.reused ||
      providerCalls !== callsAfterSuccess.provider ||
      JSON.stringify(external.count) !==
        JSON.stringify(callsAfterSuccess.external)
    )
      throw new Error("P3 accepted Content success/replay fixture failed");
    const resolvedActor = await module
      .get(CreatorWorkspaceActorService)
      .resolveReadOnly({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      });
    await module.get(CreatorBrandSuggestionsPipeline).execute(resolvedActor);
    const manualOrg = await db.organization.create({
      data: { name: "Creator Brand manual-only fixture", kind: "CREATOR" },
    });
    const manualOwner = await db.user.create({
      data: {
        email: "creator-brand-p3-manual@example.test",
        name: "Manual Creator",
        role: "CREATOR",
        authState: "ACTIVE",
        emailVerifiedAt: new Date(),
        organizationId: manualOrg.id,
        hashedPassword: passwordHash,
        authMethods: {
          create: { type: "PASSWORD", credentialHash: passwordHash },
        },
        creatorProfile: { create: { displayName: "Manual Creator" } },
      },
      include: { creatorProfile: true },
    });
    const manualWorkspace = await db.creatorWorkspace.create({
      data: {
        ownerProfileId: manualOwner.creatorProfile!.id,
        organizationId: manualOrg.id,
        members: {
          create: {
            userId: manualOwner.id,
            assignedProfileId: manualOwner.creatorProfile!.id,
            associatedEmail: manualOwner.email,
            securityRole: "OWNER",
            isActive: true,
          },
        },
      },
    });
    for (const [label, role, active] of [
      ["manager", "MANAGER", true],
      ["assistant", "ASSISTANT", true],
      ["inactive", "ASSISTANT", false],
    ] as const) {
      const member = await db.user.create({
        data: {
          email: `creator-brand-p3-manual-${label}@example.test`,
          name: `Manual ${label}`,
          role: "CREATOR",
          authState: "ACTIVE",
          emailVerifiedAt: new Date(),
          organizationId: manualOrg.id,
          hashedPassword: passwordHash,
          authMethods: {
            create: { type: "PASSWORD", credentialHash: passwordHash },
          },
        },
      });
      await db.creatorWorkspaceMember.create({
        data: {
          workspaceId: manualWorkspace.id,
          userId: member.id,
          associatedEmail: member.email,
          securityRole: role,
          isActive: active,
        },
      });
    }
    const rows = await db.$queryRawUnsafe<Array<Record<string, bigint>>>(
      `SELECT (SELECT count(*) FROM data_extraction_captures WHERE owner_scope_id IS NOT NULL) captures, (SELECT count(*) FROM data_extraction_evidence_items WHERE owner_scope_id IS NOT NULL) evidence, (SELECT count(*) FROM intelligence_object_generations WHERE brand_id IS NULL AND object_semantic_id='creator_content') objects, (SELECT count(*) FROM intelligence_component_generations WHERE brand_id IS NULL AND object_semantic_id='creator_content') components, (SELECT count(*) FROM intelligence_current_components WHERE brand_id IS NULL AND object_semantic_id='creator_content') current_rows`,
    );
    console.log(
      JSON.stringify({
        fixture: "CREATOR_BRAND_P3_AUTHENTICATED_PRODUCTION_VERTICAL",
        credentials: "NOT_REPORTED",
        provider: "SYNTHETIC_NO_NETWORK",
        providerCalls: callsAfterSuccess.provider,
        modalityCalls: callsAfterSuccess.external,
        replayAdditionalCalls: 0,
        manualNoSourceFixture:
          "ACTIVE_OWNER_MANAGER_ASSISTANT_WITHOUT_INTEGRATION",
        lineage: Object.fromEntries(
          Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]),
        ),
      }),
    );
  } finally {
    await module?.close();
    await db.$disconnect();
    await rm(cleanupRoot, {
      recursive: true,
      force: true,
    });
  }
}
void main();
