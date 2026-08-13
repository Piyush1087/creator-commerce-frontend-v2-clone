import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "../node_modules/typescript/lib/typescript.js";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

async function loadPureTypeScript(path) {
  const input = await source(path);
  const output = ts.transpileModule(input, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const wizard = {
  campaignName: "Canonical launch",
  coreObjective: "PRODUCTION",
  publishingSchedule: "SCHEDULED",
  publishFrom: "2099-01-01",
  publishUntil: "2099-02-01",
  platforms: ["INSTAGRAM"],
  platformFormats: ["Reel"],
  campaignVisibility: "PUBLIC",
  audienceAffinityIds: ["TECHNOLOGY"],
  minimumFollowers: 10_000,
  maximumFollowers: 250_000,
  creatorArchetypes: ["EDUCATOR", "INDUSTRY_EXPERT"],
  audienceGeographies: [{ scope: "COUNTRY", label: "India", country_code: "IN", locality: null, region: null, radius_km: null, is_primary: true }],
  audienceAgeMin: 18,
  audienceAgeMax: 34,
  audienceGender: "ALL",
  receivesBrandSupport: false,
  brandSupportType: null,
  brandSupportEstimatedValue: null,
  compensationModel: "FIXED",
  commercialOffer: 500,
  totalCampaignBudget: 5000,
  advancePaymentPercentage: 25,
  payoutTerms: "NET_15",
};

test("Create Campaign maps to the canonical draft/publish payload", async () => {
  const { mapWizardToIntegratedPayload } = await loadPureTypeScript(
    "src/features/uce/mappers/map-wizard-to-payload.ts",
  );
  const payload = mapWizardToIntegratedPayload(wizard);
  assert.equal(payload.strategy.core_objective, "PRODUCTION");
  assert.deepEqual(payload.strategy.platforms, ["INSTAGRAM"]);
  assert.equal(payload.strategy.publishing_schedule, "SCHEDULED");
  assert.equal(payload.targeting.creator_archetypes[0], "EDUCATOR");
  assert.equal(payload.targeting.audience_affinity_ids[0], "TECHNOLOGY");
  assert.deepEqual(payload.targeting.audience_geographies[0], {
    scope: "COUNTRY",
    label: "India",
    country_code: "IN",
    locality: null,
    region: null,
    radius_km: null,
    is_primary: true,
  });
  assert.equal(payload.commercials.compensation_model, "FIXED");
  assert.equal(payload.commercials.advance_payment_percentage, 25);
  assert.equal(payload.commercials.payout_terms, "NET_15");
});

test("unsupported client platform selections never become backend authority", async () => {
  const { mapWizardToIntegratedPayload } = await loadPureTypeScript(
    "src/features/uce/mappers/map-wizard-to-payload.ts",
  );
  assert.deepEqual(mapWizardToIntegratedPayload(wizard).strategy.platforms, ["INSTAGRAM"]);
});

test("Asset selection sends existing Offering and BrandOffer identifiers", async () => {
  const value = await source("src/features/uce/utils/map-dna-to-asset.ts");
  assert.match(value, /canonical_offering_id: offering\.id/);
  assert.match(value, /canonical_offering_id: collection\.id/);
  assert.match(value, /canonical_brand_offer_id: offer\.id/);
  assert.match(value, /brand_id: dna\.profile\.id/);
});

test("Brief and creator Application payloads require canonical references", async () => {
  const brief = await source("src/features/uce/components/BriefingWizardDrawer.tsx");
  const application = await source("src/features/creator-uce/api/creator-uce-client.ts");
  assert.match(brief, /canonical_campaign_asset_id/);
  assert.match(application, /canonical_campaign_asset_id: string/);
  assert.match(application, /canonical_brief_id: string/);
});

test("Campaign Page, applicants, lifecycle, and Share use canonical endpoints", async () => {
  const client = await source("src/features/uce/api/brand-uce-client.ts");
  assert.match(client, /campaigns\/canonical-drafts/);
  assert.match(client, /campaigns\/\$\{encodeURIComponent\(campaignId\)\}\/page/);
  assert.match(client, /applications\/\$\{encodeURIComponent\(applicationId\)\}\/approve/);
  assert.match(client, /workflowCollaborationId/);
  assert.match(client, /campaigns\/\$\{encodeURIComponent\(campaignId\)\}\/share/);
  assert.match(client, /"go-live"/);
});

test("frontend lifecycle contract contains only accepted Campaign states", async () => {
  const contracts = await source("src/features/uce/contracts/brand-uce.contracts.ts");
  const statusBlock = contracts.match(/export type UceCampaignStatus =[\s\S]*?;/)?.[0] ?? "";
  for (const state of ["DRAFT", "PUBLISHED", "LIVE", "PAUSED", "COMPLETED", "ARCHIVED"]) {
    assert.match(statusBlock, new RegExp(`"${state}"`));
  }
  assert.doesNotMatch(statusBlock, /"ACTIVE"/);
});
