import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const requireBackend = createRequire(
  new URL("../../backend/package.json", import.meta.url),
);
const { PrismaClient } = requireBackend("@prisma/client");
const route = new URL(process.env.DATABASE_URL ?? "");
if (
  route.hostname !== "127.0.0.1" ||
  route.pathname !== "/c05_creator_commercial_p3_browser"
)
  throw new Error("EXACT_DISPOSABLE_COMMERCIAL_ROUTE_REQUIRED");
const [mode, email] = process.argv.slice(2);
if (
  !email?.startsWith("commercial-browser-") ||
  !email.endsWith("-owner@example.test")
)
  throw new Error("EXACT_SYNTHETIC_OWNER_REQUIRED");
const db = new PrismaClient();
try {
  const user = await db.user.findUniqueOrThrow({
    where: { email },
    select: { id: true, creatorProfile: { select: { id: true } } },
  });
  if (!user.creatorProfile) throw new Error("SYNTHETIC_OWNER_PROFILE_REQUIRED");
  const creatorProfileId = user.creatorProfile.id,
    workspace = await db.creatorWorkspace.findFirstOrThrow({
      where: { ownerProfileId: creatorProfileId },
      select: { id: true },
    });
  if (
    (await db.creatorWorkspace.count({
      where: { ownerProfileId: creatorProfileId },
    })) !== 1
  )
    throw new Error("EXACT_SYNTHETIC_WORKSPACE_REQUIRED");
  if (mode === "inspect") {
    const preference = await db.creatorWorkPreferences.findUnique({
      where: { workspaceId: workspace.id },
      select: { currentRevision: true, baseCountry: true, ugcProjects: true },
    });
    const rate = await db.creatorRateCard.findUnique({
      where: { workspaceId: workspace.id },
      select: {
        currentRevision: true,
        currency: true,
        reelEnabled: true,
        reelAmountMinor: true,
        storyEnabled: true,
        storyAmountMinor: true,
        contentUsageRights: true,
        usageDays: true,
        advancePercent: true,
        balanceTerm: true,
      },
    });
    console.log(
      JSON.stringify({
        ownerUserId: user.id,
        creatorProfileId,
        workspaceId: workspace.id,
        preference,
        rate: rate
          ? {
              ...rate,
              reelAmountMinor:
                rate.reelAmountMinor === null
                  ? null
                  : Number(rate.reelAmountMinor),
              storyAmountMinor:
                rate.storyAmountMinor === null
                  ? null
                  : Number(rate.storyAmountMinor),
              usageDays:
                rate.usageDays === null ? null : Number(rate.usageDays),
            }
          : null,
        workAudits: await db.creatorWorkPreferencesRevision.count({
          where: { profile: { workspaceId: workspace.id } },
        }),
        rateAudits: await db.creatorRateCardRevision.count({
          where: { profile: { workspaceId: workspace.id } },
        }),
        sourceConnections: await db.creatorSocialIntegration.count({
          where: { creatorProfileId },
        }),
      }),
    );
  } else if (mode === "bank-cross") {
    const destination = await db.creatorPayoutDestination.findFirstOrThrow({
      where: { creatorProfileId, isPrimary: true, disabledAt: null },
      select: { id: true, version: true },
    });
    await db.creatorPayoutDestination.update({
      where: { id: destination.id },
      data: {
        countryCode: "US",
        currencyCode: "USD",
        version: destination.version + 1,
      },
    });
    console.log(
      JSON.stringify({
        bankMutation: "SYNTHETIC_SETTINGS_FIXTURE_ONLY",
        version: destination.version + 1,
      }),
    );
  } else if (mode === "purge") {
    const modulePath = (path) =>
      fileURLToPath(new URL("../../backend/dist/" + path, import.meta.url));
    const { CreatorWorkspaceActorService } = requireBackend(
      modulePath(
        "features/creator-settings/team/creator-workspace-actor.service.js",
      ),
    );
    const { PrismaCreatorPayoutCountryAuthorityAdapter } = requireBackend(
      modulePath(
        "features/creator-settings/payouts/prisma-creator-payout-country-authority.adapter.js",
      ),
    );
    const { CreatorShippingReadinessAdapter } = requireBackend(
      modulePath(
        "features/creator-settings/services/creator-shipping-readiness.adapter.js",
      ),
    );
    const { RateCardPersistence } = requireBackend(
      modulePath(
        "features/creator-commercial-setup/rate-card/rate-card.persistence.js",
      ),
    );
    const { WorkPreferencesRepository } = requireBackend(
      modulePath(
        "features/creator-commercial-setup/work-preferences/work-preferences.repository.js",
      ),
    );
    const actor = new CreatorWorkspaceActorService(db),
      bank = new PrismaCreatorPayoutCountryAuthorityAdapter(db),
      rates = new RateCardPersistence(db, actor, bank);
    const preferences = new WorkPreferencesRepository(
      db,
      actor,
      bank,
      new CreatorShippingReadinessAdapter(db),
      rates,
    );
    const input = {
      purpose: "CREATOR_OWNER_SCOPE_PURGE",
      workspaceId: workspace.id,
      ownerCreatorProfileId: creatorProfileId,
    };
    await rates.purgeOwnerScope(input);
    await preferences.purgeOwnerScope(input);
    console.log(
      JSON.stringify({
        targetPurge: "PASS",
        creatorPreserved: await db.creatorProfile.count({
          where: { id: creatorProfileId },
        }),
      }),
    );
  } else throw new Error("BOUNDED_COMMERCIAL_MODE_REQUIRED");
} catch {
  console.error("COMMERCIAL_DB_PROOF_FAILED_SANITIZED");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
