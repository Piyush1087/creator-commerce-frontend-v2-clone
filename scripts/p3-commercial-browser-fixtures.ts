import "reflect-metadata";
import { PrismaClient, UserRole } from "@prisma/client";
import type { PrismaService } from "../../backend/src/prisma/prisma.service";
import type { AuthUser } from "../../backend/src/features/auth/types/auth-user";
import { hashPasswordAsync } from "../../backend/src/shared/crypto/password.util";
import { CreatorWorkspaceActorService } from "../../backend/src/features/creator-settings/team/creator-workspace-actor.service";
import { PrismaCreatorPayoutCountryAuthorityAdapter } from "../../backend/src/features/creator-settings/payouts/prisma-creator-payout-country-authority.adapter";
import { CreatorShippingReadinessAdapter } from "../../backend/src/features/creator-settings/services/creator-shipping-readiness.adapter";
import { PrismaCreatorPayoutReadinessService } from "../../backend/src/features/brand-payouts/services/prisma-creator-payout-readiness.service";
import { WorkPreferencesRepository } from "../../backend/src/features/creator-commercial-setup/work-preferences/work-preferences.repository";
import { WorkPreferencesService } from "../../backend/src/features/creator-commercial-setup/work-preferences/work-preferences.service";
import { RateCardPersistence } from "../../backend/src/features/creator-commercial-setup/rate-card/rate-card.persistence";
import { RateCardService } from "../../backend/src/features/creator-commercial-setup/rate-card/rate-card.service";
import { randomUUID } from "node:crypto";
async function main() {
  const route = new URL(process.env.DATABASE_URL ?? "");
  if (
    process.env.CREATOR_COMMERCIAL_BROWSER_FIXTURE !== "true" ||
    !process.env.CREATOR_COMMERCIAL_BROWSER_PASSWORD ||
    route.hostname !== "127.0.0.1" ||
    route.pathname !== "/c05_creator_commercial_p3_browser"
  )
    throw new Error(
      "Exact disposable Commercial fixture route and synthetic password required",
    );
  const db = new PrismaClient(),
    prisma = db as unknown as PrismaService;
  const actors = new CreatorWorkspaceActorService(prisma),
    bank = new PrismaCreatorPayoutCountryAuthorityAdapter(prisma),
    rateRepo = new RateCardPersistence(prisma, actors, bank);
  const wp = new WorkPreferencesService(
      new WorkPreferencesRepository(
        prisma,
        actors,
        bank,
        new CreatorShippingReadinessAdapter(prisma),
        rateRepo,
      ),
      new PrismaCreatorPayoutReadinessService(prisma),
    ),
    rates = new RateCardService(rateRepo);
  try {
    if (
      await db.user.count({
        where: { email: { startsWith: "commercial-browser-" } },
      })
    )
      throw new Error("Fixture identity already exists; do not overwrite");
    const hash = await hashPasswordAsync(
      process.env.CREATOR_COMMERCIAL_BROWSER_PASSWORD,
    );
    for (const width of [390, 767, 768, 1440])
      for (const family of [
        "manual",
        "bank-same",
        "bank-cross",
        "bank-conflict",
        "bank-first",
      ]) {
        const org = await db.organization.create({
          data: {
            name: `Synthetic Commercial ${family} ${width}`,
            kind: "CREATOR",
          },
        });
        const user = (role: string, organizationId: string) =>
          db.user.create({
            data: {
              email: `commercial-browser-${family}-${width}-${role}@example.test`,
              name: `Synthetic ${role}`,
              role: "CREATOR",
              authState: "ACTIVE",
              emailVerifiedAt: new Date(),
              organizationId,
              hashedPassword: hash,
              authMethods: {
                create: { type: "PASSWORD", credentialHash: hash },
              },
            },
          });
        const owner = await user("owner", org.id),
          profile = await db.creatorProfile.create({
            data: {
              userId: owner.id,
              displayName: "Synthetic commercial Owner",
            },
          }),
          workspace = await db.creatorWorkspace.create({
            data: { ownerProfileId: profile.id, organizationId: org.id },
          });
        await db.creatorWorkspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: owner.id,
            assignedProfileId: profile.id,
            associatedEmail: owner.email,
            securityRole: "OWNER",
            isActive: true,
            joinedAt: new Date(),
          },
        });
        if (family === "manual")
          for (const role of ["manager", "assistant", "inactive"]) {
            const actorOrg = await db.organization.create({
              data: { name: `Synthetic delegated ${role}`, kind: "CREATOR" },
            });
            const actor = await user(role, actorOrg.id);
            await db.creatorWorkspaceMember.create({
              data: {
                workspaceId: workspace.id,
                userId: actor.id,
                associatedEmail: actor.email,
                securityRole: role === "manager" ? "MANAGER" : "ASSISTANT",
                isActive: role !== "inactive",
                joinedAt: role === "inactive" ? null : new Date(),
              },
            });
          }
        const auth: AuthUser = {
          id: owner.id,
          email: owner.email,
          name: null,
          role: UserRole.CREATOR,
          organizationId: null,
        };
        if (family !== "manual" && family !== "bank-first") {
          const preference = await wp.mutate(auth, {
            expectedRevision: 0,
            expectedRateCardRevision: 0,
            confirmMonetaryReset: false,
            idempotencyKey: randomUUID(),
            values: {
              baseCountry: "IN",
              openToInternationalBrands: null,
              preferredIndustryIds: [],
              excludedIndustryIds: [],
              availability: "ACCEPTING_COLLABORATIONS",
              pausedUntil: null,
              physicalProductCollaborations: null,
              ugcProjects: "YES",
              giftingBarter: "NO",
            },
          });
          await rates.mutate(auth, {
            expectedRevision: 0,
            expectedWorkPreferencesRevision: 1,
            authorityFingerprint: preference.country.authorityFingerprint,
            idempotencyKey: randomUUID(),
            values: {
              REEL_VIDEO: { enabled: true, amountMinor: 10000 },
              STORY: { enabled: false, amountMinor: null },
              BANNER_CAROUSEL: { enabled: false, amountMinor: null },
              PHOTOSHOOT: { enabled: false, amountMinor: null },
              linkInBio: { enabled: false, amountMinor: null },
              paidAmplification: { enabled: false, amountMinor: null },
              contentUsageRights: "YES",
              usageDays: 30,
              advancePercent: 25,
              balanceTerm: "NET_30",
            },
          });
        }
        if (family.startsWith("bank-")) {
          const countryCode =
              family === "bank-same"
                ? "IN"
                : family === "bank-conflict"
                  ? "ZZ"
                  : "US",
            currencyCode = countryCode === "IN" ? "INR" : "USD";
          await db.creatorPayoutDestination.create({
            data: {
              creatorProfileId: profile.id,
              payeeType: "INDIVIDUAL",
              beneficiaryName: "Synthetic destination",
              destinationType: "BANK_ACCOUNT",
              countryCode,
              currencyCode,
              secretPayloadEncrypted: "opaque-fixture-only",
              maskedDisplay: "never-projected",
              isPrimary: true,
              state: "CONFIGURED_UNVERIFIED",
              version: 1,
            },
          });
        }
      }
    console.log(
      JSON.stringify({
        fixture: "COMMERCIAL_AUTHENTICATED_MANUAL_BANK_MATRIX",
        widths: [390, 767, 768, 1440],
        families: 5,
        users: 32,
        liveGraphCalls: 0,
        liveModelCalls: 0,
        secretValuesIncluded: false,
      }),
    );
  } finally {
    await db.$disconnect();
  }
}
void main().catch(() => {
  console.error("COMMERCIAL_FIXTURE_FAILED_SANITIZED");
  process.exitCode = 1;
});
