import { createRequire } from "node:module";
const backend = new URL("../../backend/package.json", import.meta.url);
const requireBackend = createRequire(backend);
requireBackend("dotenv").config({
  path: new URL("../../backend/.env", import.meta.url).pathname.replace(
    /^\/([A-Z]:)/u,
    "$1",
  ),
  quiet: true,
});
const { PrismaClient } = requireBackend("@prisma/client");
const db = new PrismaClient();
const address = new URL(process.env.DATABASE_URL || "");
if (
  address.hostname !== "127.0.0.1" ||
  address.port !== "55435" ||
  address.pathname !== "/creator_content_p4_clean"
)
  throw new Error("P3_OWN_DISPOSABLE_ROUTE_REQUIRED");
const mode = process.argv[2];
try {
  const owner = await db.user.findUnique({
    where: { email: "creator-brand-p3@example.test" },
    include: { creatorProfile: true },
  });
  if (!owner?.creatorProfile) throw new Error("P3_FIXTURE_OWNER_REQUIRED");
  if (mode === "seed-no-source") {
    for (const width of [390, 767, 768, 1440]) {
      const email = `creator-brand-p3-manual-${width}@example.test`;
      const existing = await db.user.findUnique({
        where: { email },
        include: { creatorProfile: true },
      });
      if (
        existing &&
        (await db.creatorWorkspace.count({
          where: { ownerProfileId: existing.creatorProfile.id },
        }))
      )
        continue;
      const org = existing
        ? { id: existing.organizationId }
        : await db.organization.create({
            data: { name: "P3 isolated manual workspace", kind: "CREATOR" },
          });
      const user =
        existing ??
        (await db.user.create({
          data: {
            email,
            name: "Manual Creator",
            role: "CREATOR",
            authState: "ACTIVE",
            emailVerifiedAt: new Date(),
            organizationId: org.id,
            hashedPassword: owner.hashedPassword,
            authMethods: {
              create: {
                type: "PASSWORD",
                credentialHash: owner.hashedPassword,
              },
            },
            creatorProfile: { create: {} },
          },
          include: { creatorProfile: true },
        }));
      const workspace = await db.creatorWorkspace.create({
        data: {
          ownerProfileId: user.creatorProfile.id,
          organizationId: org.id,
          members: {
            create: {
              assignedProfileId: user.creatorProfile.id,
              userId: user.id,
              associatedEmail: email,
              securityRole: "OWNER",
              isActive: true,
              joinedAt: new Date(),
            },
          },
        },
      });
      for (const role of ["MANAGER", "ASSISTANT", "INACTIVE", "MISSING"]) {
        const member = await db.user.create({
          data: {
            email: `creator-brand-p3-manual-${width}-${role.toLowerCase()}@example.test`,
            name: "Synthetic member",
            role: "CREATOR",
            authState: "ACTIVE",
            emailVerifiedAt: new Date(),
            organizationId: org.id,
            hashedPassword: owner.hashedPassword,
            authMethods: {
              create: {
                type: "PASSWORD",
                credentialHash: owner.hashedPassword,
              },
            },
          },
        });
        if (role !== "MISSING")
          await db.creatorWorkspaceMember.create({
            data: {
              workspaceId: workspace.id,
              userId: member.id,
              associatedEmail: member.email,
              securityRole: role === "INACTIVE" ? "ASSISTANT" : role,
              isActive: role !== "INACTIVE",
            },
          });
      }
    }
    console.log(
      JSON.stringify({
        isolatedNoSourceWorkspaces: 4,
        canonicalRowsDeleted: 0,
      }),
    );
  } else if (mode === "disconnect" || mode === "restore") {
    const affected = await db.creatorSocialIntegration.updateMany({
      where: {
        creatorProfileId: owner.creatorProfile.id,
        platformNetwork: "INSTAGRAM",
      },
      data: {
        tokenStateCondition: mode === "disconnect" ? "REVOKED" : "ACTIVE",
      },
    });
    if (affected.count !== 1)
      throw new Error("P3_TARGET_ONLY_FIXTURE_UPDATE_FAILED");
    console.log(
      JSON.stringify({
        fixtureState: mode,
        affected: affected.count,
        externalProviderMutation: false,
      }),
    );
  } else if (mode === "counts") {
    const rows = await db.$queryRawUnsafe(`SELECT
      (SELECT count(*) FROM creator_brand_profiles) profiles,
      (SELECT count(*) FROM creator_brand_revisions) revisions,
      (SELECT count(*) FROM data_extraction_captures) captures,
      (SELECT count(*) FROM data_extraction_evidence_items) evidence,
      (SELECT count(*) FROM intelligence_object_generations) objects,
      (SELECT count(*) FROM intelligence_component_generations) components,
      (SELECT count(*) FROM intelligence_current_components) current_rows`);
    const origins = await db.creatorBrandRevision.groupBy({
      by: ["origin"],
      _count: true,
    });
    console.log(
      JSON.stringify({
        rows: Object.fromEntries(
          Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]),
        ),
        origins: origins.map(({ origin, _count }) => ({
          origin,
          count: _count,
        })),
        noSourceIntegrations: await db.creatorSocialIntegration.count({
          where: {
            creatorProfile: {
              user: { email: "creator-brand-p3-manual@example.test" },
            },
          },
        }),
      }),
    );
  } else throw new Error("P3_PROOF_MODE_REQUIRED");
} catch (error) {
  console.log(
    JSON.stringify({
      fixtureProof: "FAIL",
      category: "P3_FIXTURE_DATABASE_OPERATION",
      code: error.code ?? error.name,
      databaseCode: error.message?.match(/code: "([0-9A-Z]+)"/u)?.[1] ?? null,
      databaseConstraint:
        error.message
          ?.match(/message: "([^"]+)"/u)?.[1]
          ?.replace(/[a-f0-9-]{36}|\$2[aby]\$[^\s"]+/gu, "[REDACTED]") ?? null,
      validationCategory:
        error.message?.match(
          /Unknown argument `[a-zA-Z]+`|Argument `[a-zA-Z]+` is missing|Invalid value for argument `[a-zA-Z]+`/u,
        )?.[0] ?? null,
    }),
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
