import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import {
  applicationDetailSchema,
  applicationListSchema,
  notificationsSchema,
  opportunityListSchema,
  opportunitySchema,
} from "./c03.contracts";
import {
  applicationFixture,
  fixtureId,
  opportunityFixture,
} from "../testing/c03-fixtures";
import {
  CommercialContent,
  AuthoredContent,
} from "../components/CampaignContent";
import { selectablePairs } from "../utils/c03-selection";
import { messageForReason } from "../utils/c03-errors";

it.each([
  "NOT_CONNECTED",
  "REVALIDATION_REQUIRED",
  "RECONNECT_REQUIRED",
  "PROVIDER_BLOCKED_RECOVERABLE",
  "DISCONNECTED_IDENTITY_RETAINED",
  "ELIGIBILITY_INELIGIBLE",
  "ELIGIBILITY_UNAVAILABLE",
  "INVITATION_REQUIRED",
  "INVITATION_EXPIRED",
  "INVITATION_REVOKED",
  "INVITATION_SUBJECT_MISMATCH",
  "INVITATION_ABSENT",
  "CAMPAIGN_VISIBILITY_CONFIGURATION_INVALID",
  "CREATOR_CONTEXT_REQUIRED",
  "OPPORTUNITY_NOT_AVAILABLE",
])("LOCKED %s stays structurally non-disclosing", (reason) => {
  const locked = opportunitySchema.parse({
    schemaVersion: 1,
    state: "LOCKED",
    reason,
    recoveryAction: null,
  });
  expect("campaign" in locked).toBe(false);
  expect("assets" in locked).toBe(false);
  expect(messageForReason(reason).length).toBeGreaterThan(10);
});
it.each(["FIXED", "NEGOTIABLE"] as const)(
  "preserves %s zero, absent support, zero support estimate and unknown estimate",
  (compensationModel) => {
    for (const receivesBrandSupport of [true, false])
      for (const estimate of [null, "0", "1500.50"]) {
        const fixture = opportunityFixture();
        fixture.campaign.commercial = {
          compensationModel,
          currency: "INR",
          offer: "0",
          receivesBrandSupport,
          brandSupportType: receivesBrandSupport ? "PRODUCT" : null,
          brandSupportEstimatedValue: estimate,
        };
        const parsed = opportunitySchema.parse(fixture);
        expect(parsed.state).toBe("AUTHORIZED");
        const html = renderToStaticMarkup(
          createElement(CommercialContent, {
            commercial: fixture.campaign.commercial,
          }),
        );
        expect(html).toContain("INR 0");
        if (receivesBrandSupport && estimate === null)
          expect(html).toContain("Not provided");
        if (!receivesBrandSupport) expect(html).toContain("No Brand support");
      }
  },
);
it("closed/blocked/unavailable commercial keeps the authorized dossier and distinct null timing", () => {
  for (const reason of [
    "CAMPAIGN_APPLICATIONS_CLOSED",
    "APPLICATION_CAMPAIGN_LIMIT_REACHED",
    "APPLICATION_BRAND_LIMIT_REACHED",
    "CAMPAIGN_COMMERCIAL_CONFIGURATION_INVALID",
  ]) {
    const fixture = opportunityFixture();
    fixture.canApply = false;
    fixture.applyBlockedReason = reason;
    fixture.applicationsOpen = reason !== "CAMPAIGN_APPLICATIONS_CLOSED";
    fixture.applicationDeadline = null;
    if (reason === "CAMPAIGN_COMMERCIAL_CONFIGURATION_INVALID")
      fixture.campaign.commercial = { state: "UNAVAILABLE" };
    const parsed = opportunitySchema.parse(fixture);
    expect(parsed.state).toBe("AUTHORIZED");
    expect("assets" in parsed).toBe(true);
  }
});
it("retains multiple independent Assets and associated Briefs, excluding unavailable selections", () => {
  const fixture = opportunityFixture(2);
  const second = structuredClone(fixture.assets[0]);
  second.id = fixtureId(90);
  second.kind = "OFFERING";
  second.offering = {
    name: "Offering",
    description: null,
    imageUrl: null,
    url: null,
  };
  second.briefs.forEach((b, i) => {
    b.id = fixtureId(91 + i);
    b.campaignAssetId = second.id;
  });
  fixture.assets.push(second);
  expect(selectablePairs(fixture)).toHaveLength(4);
  expect(opportunitySchema.safeParse(fixture).success).toBe(true);
  second.briefs[0].applicationSelection = {
    state: "UNAVAILABLE",
    reason: "BRIEF_NOT_PUBLISHED",
  };
  expect(selectablePairs(fixture)).toHaveLength(3);
  second.status = "PAUSED";
  expect(selectablePairs(fixture)).toHaveLength(2);
});
it("retains sibling Applications and all supported historical statuses without a legacy adapter", () => {
  const statuses = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "WITHDRAWN",
    "EXPIRED",
    "SUPERSEDED",
  ] as const;
  const rows = statuses.map((status, i) =>
    applicationDetailSchema.parse(applicationFixture(status, 100 + i)),
  );
  expect(new Set(rows.map((r) => r.applicationId)).size).toBe(6);
  expect(rows.filter((r) => r.canWithdrawPending)).toHaveLength(1);
  expect(
    applicationDetailSchema.safeParse({
      ...rows[0],
      referenceAuthority: "LEGACY_COMPATIBILITY",
    }).success,
  ).toBe(false);
  expect(
    applicationListSchema.parse({
      items: rows.map((r) => ({
        ...r,
        brief: {
          id: r.brief.id,
          campaignAssetId: r.brief.campaignAssetId,
          briefName: r.brief.briefName,
        },
      })),
      nextCursor: "opaque-cursor",
    }).items,
  ).toHaveLength(6);
});
it("collections fail closed on a teaser candidate and notification payloads reject private expansion", () => {
  expect(
    opportunityListSchema.safeParse({
      items: [
        {
          schemaVersion: 1,
          state: "LOCKED",
          reason: "OPPORTUNITY_NOT_AVAILABLE",
          recoveryAction: null,
        },
      ],
      nextCursor: null,
    }).success,
  ).toBe(false);
  const notification = {
    id: fixtureId(700),
    event_type: "campaigns.application_rejected",
    category: "CAMPAIGNS",
    urgency_level: "NORMAL",
    actionable: true,
    payload: { application_id: fixtureId(100), campaign_id: fixtureId(1) },
    created_at: "2030-01-01T00:00:00.000Z",
    is_read: false,
    is_emailed: false,
    read_at: null,
  };
  expect(
    notificationsSchema.parse({ notifications: [notification] }).notifications,
  ).toHaveLength(1);
  expect(
    notificationsSchema.safeParse({
      notifications: [
        {
          ...notification,
          payload: { ...notification.payload, commercial: "private" },
        },
      ],
    }).success,
  ).toBe(false);
});
it("renders authored text as text and never turns an unsafe reference into a link", () => {
  const html = renderToStaticMarkup(
    createElement(AuthoredContent, {
      value: {
        reference: "javascript:alert(1)",
        body: "<script>unsafe()</script>",
        estimate: 0,
        required: false,
      },
    }),
  );
  expect(html).not.toContain("href=");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("false");
});
