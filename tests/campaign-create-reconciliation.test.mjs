import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "../node_modules/typescript/lib/typescript.js";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");
async function loadPureTypeScript(path) {
  const output = ts.transpileModule(await source(path), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const form = {
  campaignName: "Canonical launch", coreObjective: "PRODUCTION", publishingSchedule: "SCHEDULED",
  publishFrom: "2099-03-01", publishUntil: "2099-03-31", platforms: ["INSTAGRAM"], platformFormats: ["Reel"], campaignVisibility: "ELIGIBLE_CREATORS_ONLY",
  creatorArchetypes: ["EDUCATOR"], minimumFollowers: 10000, maximumFollowers: 50000,
  audienceAgeMin: 18, audienceAgeMax: 34, audienceGender: "ALL", audienceAffinityIds: ["TECHNOLOGY"],
  audienceGeographies: [{ scope: "REGION", label: "Maharashtra, India", country_code: "IN", locality: null, region: "Maharashtra", radius_km: null, is_primary: true }],
  receivesBrandSupport: true, brandSupportType: "PRODUCT", brandSupportEstimatedValue: 100,
  compensationModel: "FIXED", commercialOffer: 500, totalCampaignBudget: 5000, advancePaymentPercentage: 25, payoutTerms: "NET_15",
};

test("canonical form maps without legacy follower, geography, or fee aliases", async () => {
  const mapper = await loadPureTypeScript("src/features/uce/mappers/map-wizard-to-payload.ts");
  const payload = mapper.mapWizardToIntegratedPayload(form);
  assert.equal(payload.targeting.minimum_followers, 10000);
  assert.deepEqual(payload.targeting.audience_geographies, form.audienceGeographies);
  assert.equal(payload.commercials.commercial_offer, 500);
  const text = await source("src/features/uce/types/campaign-wizard.ts");
  for (const retired of ["followerTiers", "targetLocations", "negotiableMinFee", "negotiableMaxFee"]) assert.doesNotMatch(text, new RegExp(retired));
});

test("fixed and negotiable both use the single canonical commercial offer", async () => {
  const mapper = await loadPureTypeScript("src/features/uce/mappers/map-wizard-to-payload.ts");
  assert.deepEqual(mapper.mapWizardToStep3Payload(form), {
    receives_brand_support: true, brand_support_type: "PRODUCT", brand_support_estimated_value: 100,
    compensation_model: "FIXED", commercial_offer: 500, total_campaign_budget: 5000,
    advance_payment_percentage: 25, payout_terms: "NET_15",
  });
  assert.equal(mapper.mapWizardToStep3Payload({ ...form, compensationModel: "NEGOTIABLE", commercialOffer: 350 }).commercial_offer, 350);
});

test("draft hydration round-trips every canonical supported field", async () => {
  const mapper = await loadPureTypeScript("src/features/uce/mappers/map-wizard-to-payload.ts");
  const hydrator = await loadPureTypeScript("src/features/uce/mappers/hydrate-canonical-campaign-draft.ts");
  const payload = mapper.mapWizardToIntegratedPayload(form);
  const hydrated = hydrator.hydrateCanonicalCampaignDraft({ campaignId: "campaign-1", status: "DRAFT", creationSource: "MANUAL", draft: payload }, { ...form, campaignName: "" });
  assert.deepEqual(mapper.mapWizardToIntegratedPayload(hydrated), payload);
});

test("interaction validation has product copy and date rules", async () => {
  const validation = await source("src/features/uce/utils/validate-campaign-wizard.ts");
  const schema = await source("src/features/uce/schemas/campaign-wizard-schema.ts");
  const component = await source("src/features/uce/components/CreateCampaignWizard.tsx");
  assert.match(validation, /Campaign Name must be 60 characters or fewer/);
  assert.match(validation, /Select at least one Creator Archetype/);
  assert.match(validation, /Select at least one Target Location/);
  assert.match(schema, /Start date cannot be in the past/);
  assert.match(schema, /End date must follow start date/);
  assert.match(component, /onBlur=\{\(\) => touchField\("campaignName"\)\}/);
});

test("draft edit preserves ID and list controls cannot publish a draft", async () => {
  const wizard = await source("src/features/uce/components/CreateCampaignWizard.tsx");
  const list = await source("src/features/uce/components/CampaignListTabs.tsx");
  assert.match(wizard, /URLSearchParams\(window\.location\.search\)\.get\("draft"\)/);
  assert.match(wizard, /existingId \? null : await createCanonicalCampaignDraft/);
  assert.match(list, /\?draft=\$\{encodeURIComponent\(campaign\.campaign_id\)\}/);
  assert.doesNotMatch(list, /executeCampaignLifecycle/);
});

test("autosave reuses the initialized Campaign ID instead of creating another Campaign", async () => {
  const wizard = await source("src/features/uce/components/CreateCampaignWizard.tsx");
  assert.equal((wizard.match(/createCanonicalCampaignDraft\(\)/g) ?? []).length, 1);
  assert.match(wizard, /autosaveCanonicalCampaignField\(draftId/);
  assert.match(wizard, /pendingAutosaveRef/);
});

test("structured geography is provider-backed and never inferred from free text", async () => {
  const adapter = await loadPureTypeScript("src/features/uce/geography/geography-search.ts");
  assert.equal(adapter.unavailableGeographySearchAdapter.configured, false);
  assert.deepEqual(await adapter.unavailableGeographySearchAdapter.search("Mumbai"), []);
  await assert.rejects(() => adapter.unavailableGeographySearchAdapter.resolve("free-text"));
  const mapper = await source("src/features/uce/mappers/map-wizard-to-payload.ts");
  assert.doesNotMatch(mapper, /COUNTRY_CODES|targetLocations/);
});

test("commercial hydration includes support, offer, budget, advance and payout terms", async () => {
  const hydration = await source("src/features/uce/mappers/hydrate-canonical-campaign-draft.ts");
  for (const field of ["receives_brand_support", "brand_support_type", "brand_support_estimated_value", "compensation_model", "commercial_offer", "total_campaign_budget", "advance_payment_percentage", "payout_terms"]) {
    assert.match(hydration, new RegExp(field));
  }
});

test("publish validation maps backend 400 issue payloads to canonical fields", async () => {
  const client = await source("src/features/uce/api/brand-uce-client.ts");
  assert.match(client, /response\.status === 400 \|\| response\.status === 422/);
  const wizard = await source("src/features/uce/components/CreateCampaignWizard.tsx");
  assert.match(wizard, /flattenIssuesToFieldErrors\(err\.issues\)/);
});
