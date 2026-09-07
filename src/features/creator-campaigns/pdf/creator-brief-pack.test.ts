import { describe, expect, it } from "vitest";
import { creatorBriefPackSchema } from "../contracts/c03.contracts";
import { briefPackFixture } from "../testing/brief-pack-fixture";
import { fixtureId } from "../testing/c03-fixtures";
import { pdfText, renderCreatorBriefPack } from "./creator-brief-pack";
const text = (bytes: ArrayBuffer) => new TextDecoder("latin1").decode(bytes);
describe("Creator Brief Pack PDF", () => {
  it("creates a deterministic one-page historical document with the canonical filename", () => {
    const pack = briefPackFixture(),
      first = renderCreatorBriefPack(pack),
      second = renderCreatorBriefPack(pack);
    expect(first.filename).toBe(
      `creator-shop-brief-pack-${pack.application.applicationId}.pdf`,
    );
    expect(first.pageCount).toBe(1);
    expect(new Uint8Array(first.bytes)).toEqual(new Uint8Array(second.bytes));
    const body = text(first.bytes);
    expect(body.indexOf("Creator Brief Pack")).toBeLessThan(
      body.indexOf("Selected Campaign Asset"),
    );
    expect(body).toContain("INR 0");
    for (const value of [
      "actorUserId",
      "actorMembershipId",
      "utm_",
      "providerToken",
      "Idempotency-Key",
      "PRIVATE_SENTINEL",
    ])
      expect(body).not.toContain(value);
  });
  it.each(["FIXED", "NEGOTIABLE"] as const)(
    "preserves %s values, currencies, support and zero",
    (compensationModel) => {
      for (const currency of ["INR", "USD"] as const)
        for (const offer of ["0", "1234.50"])
          for (const support of [false, true]) {
            const pack = briefPackFixture();
            pack.commercial = {
              compensationModel,
              currency,
              offer,
              receivesBrandSupport: support,
              brandSupportType: support ? "PRODUCT" : null,
              brandSupportEstimatedValue: support ? "0" : null,
            };
            const body = text(renderCreatorBriefPack(pack).bytes);
            expect(body).toContain(`${currency} ${offer}`);
            expect(body).toContain(
              compensationModel === "FIXED"
                ? "Fixed offer"
                : "Negotiable - Brand minimum/offer",
            );
            expect(body).toContain(
              support ? "Support estimated value" : "Brand support: None",
            );
          }
    },
  );
  it("paginates long authored sections deterministically without dropping final content", () => {
    const pack = briefPackFixture();
    pack.brief.creatorBrief =
      "A careful demonstration with consistent lighting and clear disclosure. ".repeat(
        300,
      );
    pack.brief.deliverables = Array.from({ length: 30 }, (_, i) => ({
      ...pack.brief.deliverables[0],
      id: fixtureId(1000 + i),
      displayOrder: i,
    }));
    pack.brief.briefLevelGuidance = {
      notes: "Natural light and a clear product demonstration. ".repeat(100),
    };
    pack.brief.creatorRequirements = "Keep every detail accurate. ".repeat(100);
    pack.brief.referenceContent = {
      links: [`https://studio.example/${"long-reference/".repeat(100)}`],
    };
    pack.brief.usageRights = {
      terms: "License scope remains as supplied. ".repeat(100),
      zzz: "FINAL_RIGHTS_MARKER",
    };
    const first = renderCreatorBriefPack(pack),
      second = renderCreatorBriefPack(pack);
    expect(first.pageCount).toBeGreaterThan(4);
    expect(first.pageCount).toBe(second.pageCount);
    expect(text(first.bytes)).toContain("FINAL_RIGHTS_MARKER");
    expect(new Uint8Array(first.bytes)).toEqual(new Uint8Array(second.bytes));
  });
  it("uses deliberate glyph and no-image fallbacks without network access", () => {
    const pack = briefPackFixture();
    pack.brand!.logoUrl = "https://unreachable.invalid/logo.png";
    pack.brief.creatorBrief = "₹ $ smart’s – — & / % (café) 😀";
    expect(pdfText(pack.brief.creatorBrief)).toBe(
      "INR  $ smart's - - & / % (café) [unsupported]",
    );
    expect(text(renderCreatorBriefPack(pack).bytes)).toContain(
      "Images omitted",
    );
  });
  it("fails closed on private fields, malformed data and mismatched references", () => {
    const pack = briefPackFixture();
    for (const value of [
      { ...pack, actorUserId: "PRIVATE_SENTINEL" },
      { ...pack, schemaVersion: 2 },
      {
        ...pack,
        application: { ...pack.application, reference: fixtureId(999) },
      },
      {
        ...pack,
        brief: {
          ...pack.brief,
          briefLevelGuidance: { providerToken: "PRIVATE_SENTINEL" },
        },
      },
    ]) {
      expect(creatorBriefPackSchema.safeParse(value).success).toBe(false);
      expect(() => renderCreatorBriefPack(value as typeof pack)).toThrow();
    }
  });
});
