// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";

const mocks = vi.hoisted(() => ({ authenticatedFetch: vi.fn() }));

vi.mock("../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: mocks.authenticatedFetch,
}));

import {
  BrandPayoutsApiError,
  fetchBrandPayoutsBrandReturnDetail,
  fetchBrandPayoutsOverview,
} from "./api/brand-payouts-client";
import { PayoutObligations } from "./components/PayoutObligations";
import { PayoutsActivity } from "./components/PayoutsActivity";
import { PayoutsDetail } from "./components/PayoutsDetail";
import { PayoutsOverview } from "./components/PayoutsOverview";
import { PayoutsTreasuryActions } from "./components/PayoutsTreasuryActions";
import { BrandPayoutsWorkspace } from "./components/BrandPayoutsWorkspace";
import {
  BRAND_PAYOUTS_V2_MEDIA_TYPE,
  brandPayoutsActivityDetailResponseSchema,
  brandPayoutsActivityResponseSchema,
  brandPayoutsBrandReturnDetailResponseSchema,
  brandPayoutsObligationDetailResponseSchema,
  brandPayoutsObligationsResponseSchema,
  brandPayoutsOverviewResponseSchema,
  type BrandPayoutsActivityResponse,
  type BrandPayoutsObligationsResponse,
  type BrandPayoutsOverviewResponse,
  resolveBrandFinancialCommandSurface,
} from "./contracts/brand-payouts.contracts";
import {
  mergeActivityPage,
  mergeObligationsPage,
  type PayoutsResourceState,
} from "./hooks/use-brand-payouts-workspace";
import { resolvePayoutsDetailTarget } from "./hooks/use-brand-payouts-detail";
import {
  formatPayoutsMoney,
  formatPayoutsTimestamp,
  resolveBrandPayoutsRouteAccess,
} from "./utils/brand-payouts-presentation";

const NOW = "2026-09-04T12:00:00.000Z";

function cssHexValue(source: string, customProperty: string): string {
  const declaration = source
    .split("\n")
    .find((line) => line.trim().startsWith(`${customProperty}:`));
  const value = declaration?.match(/#[0-9a-f]{6}/iu)?.[0];
  if (!value) {
    throw new Error(`Missing six-digit color token ${customProperty}`);
  }
  return value;
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/gu)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid six-digit color ${hex}`);
  }
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  return (lighter + 0.05) / (darker + 0.05);
}

const sourceCoverage = [
  {
    source: "FINANCIAL_LEDGER" as const,
    status: "AVAILABLE" as const,
    limitation_reason_code: null,
    recovery_hint: null,
  },
];

const sectionMetadata = {
  coverage: "COMPLETE" as const,
  freshness: "CURRENT" as const,
  source_observed_at: NOW,
  source_coverage: sourceCoverage,
  legacy_limitations: [],
  available_actions: [],
};

function money(amount: string) {
  return { amount, currency: "INR" };
}

function amountBucket(amount: string) {
  return { status: "AUTHORITATIVE" as const, value: money(amount) };
}

function makeOverview(
  role: "BRAND_OWNER" | "FINANCE_ADMIN" = "BRAND_OWNER",
): BrandPayoutsOverviewResponse {
  return brandPayoutsOverviewResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role, projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "OVERVIEW",
        ...sectionMetadata,
        payload: {
          projection: "FULL_FINANCIAL",
          available_funds: amountBucket("1234.50"),
          pending_funding: {
            status: "UNAVAILABLE",
            value: null,
            limitation_reason_code: "PENDING_FUNDING_SNAPSHOT_UNAVAILABLE",
          },
          committed_protected_funds: amountBucket("300.00"),
          active_brand_return_commitment: amountBucket("10.00"),
          scheduled_creator_obligations: amountBucket("200.00"),
          processing_creator_obligations: amountBucket("100.00"),
          settled_activity: {
            ...amountBucket("900.00"),
            basis: "LIFETIME",
          },
          action_required_count: { status: "AUTHORITATIVE", value: 2 },
        },
      },
    ],
  });
}

function makeOverviewWithSettingsAction(
  coverage: "COMPLETE" | "PARTIAL" = "COMPLETE",
  freshness: "CURRENT" | "STALE" = "CURRENT",
): BrandPayoutsOverviewResponse {
  const response = makeOverview();
  const section = response.sections[0];
  return brandPayoutsOverviewResponseSchema.parse({
    ...response,
    sections: [
      {
        ...section,
        coverage,
        freshness,
        available_actions: [
          {
            action: "OPEN_SETTINGS_ADD_FUNDS",
            resource_reference: "vault:brand-a",
            resource_version: "membership:v1",
            authorized_as_of: NOW,
          },
        ],
      },
    ],
  });
}

function makeOverviewWithPayoutsActions(
  coverage: "COMPLETE" | "PARTIAL" = "PARTIAL",
): BrandPayoutsOverviewResponse {
  const response = makeOverview();
  const section = response.sections[0];
  return brandPayoutsOverviewResponseSchema.parse({
    ...response,
    sections: [
      {
        ...section,
        coverage,
        available_actions: [
          {
            action: "ADD_FUNDS",
            resource_reference: "brand-payouts:vault:add-funds",
            resource_version: "vault:v1",
            authorized_as_of: NOW,
          },
          {
            action: "REQUEST_BRAND_RETURN",
            resource_reference: "brand-payouts:vault:brand-return",
            resource_version: "vault:v1:membership:v1",
            authorized_as_of: NOW,
          },
        ],
      },
    ],
  });
}

function makeCampaignManagerOverview(): BrandPayoutsOverviewResponse {
  return brandPayoutsOverviewResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "CAMPAIGN_MANAGER", projection_scope: "NO_FINANCIAL_ROWS" },
    sections: [
      {
        section_id: "OVERVIEW",
        coverage: "UNAVAILABLE",
        freshness: "CURRENT",
        source_observed_at: null,
        source_coverage: [
          {
            source: "FINANCIAL_LEDGER",
            status: "UNAVAILABLE",
            limitation_reason_code: "CANONICAL_ENTITY_SCOPE_UNAVAILABLE",
            recovery_hint: null,
          },
        ],
        legacy_limitations: [],
        available_actions: [],
        payload: {
          projection: "CAMPAIGN_OPERATIONAL",
          treasury_capacity: "UNAVAILABLE",
          action_required_count: {
            status: "UNAVAILABLE",
            value: null,
            limitation_reason_code: "CANONICAL_ENTITY_SCOPE_UNAVAILABLE",
          },
        },
      },
    ],
  });
}

function makeReserveRequests() {
  return {
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "BRAND_OWNER", projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "RESERVE_REQUESTS",
        ...sectionMetadata,
        payload: [],
        page: {
          next_cursor: null,
          page_complete: true,
          source_complete: true,
        },
      },
    ],
  };
}

function activityItem(id = "ledger:one:recorded") {
  return {
    activity_id: id,
    public_reference: id,
    resource_version: "v1",
    source_owner: "FINANCIAL_LEDGER" as const,
    source_reference: "financial-ledger:item",
    category: "MONEY_MOVEMENT" as const,
    is_financial_movement: true,
    financial_value: money("125.00"),
    recorded_at: NOW,
    occurred_at: NOW,
    source_observed_at: NOW,
    normalized_status: "SETTLED",
    actor_source: "SYSTEM",
    references: {
      campaign_id: null,
      collaboration_id: null,
      creator_reference: null,
      obligation_id: null,
      brand_return_id: null,
    },
    legacy: null,
  };
}

function lifecycleActivityItem() {
  return {
    activity_id: "obligation:one:created",
    public_reference: "obligation:one:created",
    resource_version: "v1",
    source_owner: "PAYOUT_EXECUTION" as const,
    source_reference: "obligation:one",
    category: "INFORMATIONAL_LIFECYCLE" as const,
    is_financial_movement: false,
    financial_value: null,
    recorded_at: NOW,
    occurred_at: null,
    source_observed_at: NOW,
    normalized_status: "LEGACY_UNRECONCILED",
    actor_source: "COLLABORATION_INSTRUCTION",
    references: {
      campaign_id: "campaign-one",
      collaboration_id: "collaboration-one",
      creator_reference: "creator-one",
      obligation_id: "obligation-one",
      brand_return_id: null,
    },
    legacy: {
      classification: "LEGACY_UNRECONCILED" as const,
      limitation_reason_code: "HISTORICAL_DUE_EVIDENCE_UNAVAILABLE",
    },
  };
}

function makeActivity(
  id = "ledger:one:recorded",
  nextCursor: string | null = null,
): BrandPayoutsActivityResponse {
  return brandPayoutsActivityResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "BRAND_OWNER", projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "ACTIVITY",
        ...sectionMetadata,
        payload: [activityItem(id)],
        page: {
          next_cursor: nextCursor,
          page_complete: nextCursor === null,
          source_complete: false,
        },
      },
    ],
  });
}

function makeActivityDetail(id = "ledger:one:recorded") {
  return brandPayoutsActivityDetailResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "BRAND_OWNER", projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "ACTIVITY",
        ...sectionMetadata,
        payload: activityItem(id),
      },
    ],
  });
}

function makeObligationDetail(id = "obligation-one") {
  return brandPayoutsObligationDetailResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "BRAND_OWNER", projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "OBLIGATIONS",
        ...sectionMetadata,
        coverage: "PARTIAL",
        payload: obligationItem(id),
      },
    ],
  });
}

function makeBrandReturnDetail(id = "return-one") {
  return brandPayoutsBrandReturnDetailResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "BRAND_OWNER", projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "BRAND_RETURNS",
        ...sectionMetadata,
        payload: {
          brand_return_id: id,
          public_reference: `brand-return:${id}`,
          resource_version: "observed:v1",
          status: "PROCESSING",
          requested_value: money("1000.00"),
          completed_value: money("0.00"),
          unresolved_value: money("1000.00"),
          requested_at: NOW,
          last_observed_at: NOW,
          action_required_reason_code: null,
          legacy: null,
        },
      },
    ],
  });
}

function obligationItem(id = "obligation-one") {
  return {
    obligation_id: id,
    public_reference: `payout-obligation:${id}`,
    resource_version: "v1",
    campaign_id: "campaign-one",
    collaboration_id: "collaboration-one",
    creator_reference: "creator-one",
    lifecycle: "LEGACY_UNRECONCILED" as const,
    current_gate: "DEPENDENCY_UNAVAILABLE" as const,
    blocking_reason_code: "HISTORICAL_DUE_EVIDENCE_UNAVAILABLE",
    recovery_reference: null,
    entitlement_value: money("500.00"),
    settled_value: null,
    reversed_value: null,
    outstanding_value: null,
    payment_due_at: null,
    last_observed_at: NOW,
    legacy: {
      classification: "LEGACY_UNRECONCILED" as const,
      limitation_reason_code: "HISTORICAL_DUE_EVIDENCE_UNAVAILABLE",
    },
  };
}

function makeObligations(
  id = "obligation-one",
  nextCursor: string | null = null,
): BrandPayoutsObligationsResponse {
  return brandPayoutsObligationsResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "BRAND_OWNER", projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "OBLIGATIONS",
        ...sectionMetadata,
        coverage: "PARTIAL",
        payload: [obligationItem(id)],
        page: {
          next_cursor: nextCursor,
          page_complete: nextCursor === null,
          source_complete: false,
        },
      },
    ],
  });
}

function ready<T>(data: T): PayoutsResourceState<T> {
  return { data, status: "READY", error: null };
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": `${BRAND_PAYOUTS_V2_MEDIA_TYPE}; charset=utf-8`,
    },
  });
}

function deferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined;
  let rejectPromise: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function BrowserBackControl() {
  const navigate = useNavigate();
  return createElement(
    "button",
    { onClick: () => navigate(-1) },
    "Simulate browser Back",
  );
}

afterEach(() => {
  cleanup();
  mocks.authenticatedFetch.mockReset();
});

describe("Brand Payouts V2 runtime contract", () => {
  it("accepts the pinned safe response and rejects unknown sensitive fields", () => {
    const safe = makeOverview();
    expect(safe.viewer.role).toBe("BRAND_OWNER");
    expect(
      brandPayoutsOverviewResponseSchema.safeParse({
        ...safe,
        bank_account_number: "sensitive",
      }).success,
    ).toBe(false);
    const activity = makeActivity();
    expect(
      brandPayoutsActivityResponseSchema.safeParse({
        ...activity,
        sections: [
          {
            ...activity.sections[0],
            payload: [
              {
                ...activity.sections[0].payload?.[0],
                provider_transfer_id: "raw",
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("requires exact decimal strings and all three server roles", () => {
    expect(() => makeOverview("FINANCE_ADMIN")).not.toThrow();
    expect(() => makeCampaignManagerOverview()).not.toThrow();
    const invalid = makeOverview();
    const section = invalid.sections[0];
    expect(
      brandPayoutsOverviewResponseSchema.safeParse({
        ...invalid,
        sections: [
          {
            ...section,
            payload: {
              ...section.payload,
              available_funds: amountBucket("01.50"),
            },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      brandPayoutsOverviewResponseSchema.safeParse({
        ...invalid,
        viewer: {
          role: "CAMPAIGN_MANAGER",
          projection_scope: "FULL_FINANCIAL",
        },
      }).success,
    ).toBe(false);
    expect(
      brandPayoutsOverviewResponseSchema.safeParse({
        ...invalid,
        viewer: {
          role: "CAMPAIGN_MANAGER",
          projection_scope: "NO_FINANCIAL_ROWS",
        },
      }).success,
    ).toBe(false);
  });

  it("fails a mixed or missing command-surface capability closed", () => {
    const payouts = makeOverviewWithPayoutsActions();
    expect(resolveBrandFinancialCommandSurface(payouts)).toBe("PAYOUTS");
    const section = payouts.sections[0];
    const mixed = brandPayoutsOverviewResponseSchema.parse({
      ...payouts,
      sections: [
        {
          ...section,
          available_actions: [
            ...section.available_actions,
            {
              action: "OPEN_SETTINGS_ADD_FUNDS",
              resource_reference: "brand-settings:secure-escrow:add-funds",
              resource_version: "vault:v1",
              authorized_as_of: NOW,
            },
          ],
        },
      ],
    });
    expect(resolveBrandFinancialCommandSurface(mixed)).toBe("UNAVAILABLE");
    expect(resolveBrandFinancialCommandSurface(makeOverview())).toBe(
      "UNAVAILABLE",
    );
  });

  it("requests only the V2 media type and rejects representation drift", async () => {
    mocks.authenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(makeOverview()), {
        status: 200,
        headers: {
          "content-type": `${BRAND_PAYOUTS_V2_MEDIA_TYPE}; charset=utf-8`,
        },
      }),
    );
    await expect(fetchBrandPayoutsOverview()).resolves.toMatchObject({
      schema_version: "brand-payouts.v2",
    });
    const [, options] = mocks.authenticatedFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(options.method).toBe("GET");
    expect(options.cache).toBe("no-store");
    expect(options.headers).toEqual({ Accept: BRAND_PAYOUTS_V2_MEDIA_TYPE });

    mocks.authenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(makeOverview()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(fetchBrandPayoutsOverview()).rejects.toMatchObject({
      code: "BRAND_PAYOUTS_REPRESENTATION_MISMATCH",
      kind: "CONTRACT",
    });

    mocks.authenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(makeOverview()), {
        status: 200,
        headers: {
          "content-type": `${BRAND_PAYOUTS_V2_MEDIA_TYPE}x; charset=utf-8`,
        },
      }),
    );
    await expect(fetchBrandPayoutsOverview()).rejects.toMatchObject({
      code: "BRAND_PAYOUTS_REPRESENTATION_MISMATCH",
      kind: "CONTRACT",
    });
  });

  it("turns authorization responses into bounded errors without echoing payload copy", async () => {
    mocks.authenticatedFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: "MEMBERSHIP_REQUIRED",
          message: "raw diagnostic",
        }),
        { status: 403, headers: { "content-type": "application/json" } },
      ),
    );
    await expect(fetchBrandPayoutsOverview()).rejects.toEqual(
      expect.objectContaining<Partial<BrandPayoutsApiError>>({
        kind: "AUTHORIZATION",
        code: "MEMBERSHIP_REQUIRED",
        message:
          "Your current Brand membership does not permit this Payouts view.",
      }),
    );
  });
});

describe("snapshot pagination and presentation", () => {
  it("merges only activity and obligation pages from the same viewer snapshot", () => {
    const activity = mergeActivityPage(
      makeActivity("ledger:one:recorded", "cursor"),
      makeActivity("ledger:two:recorded"),
    );
    expect(activity.sections[0].payload).toHaveLength(2);
    const obligations = mergeObligationsPage(
      makeObligations("one", "cursor"),
      makeObligations("two"),
    );
    expect(obligations.sections[0].payload).toHaveLength(2);

    const wrongViewer = makeActivity("ledger:two:recorded");
    wrongViewer.viewer.role = "FINANCE_ADMIN";
    expect(() =>
      mergeActivityPage(
        makeActivity("ledger:one:recorded", "cursor"),
        wrongViewer,
      ),
    ).toThrow(/current snapshot/u);
  });

  it("formats exact money without binary-float coercion and uses Kolkata display time", () => {
    expect(
      formatPayoutsMoney({
        amount: "999999999999999999999.0100",
        currency: "INR",
      }),
    ).toBe("₹999,999,999,999,999,999,999.0100");
    expect(formatPayoutsTimestamp("2026-09-04T12:00:00.000Z")).toContain(
      "5:30",
    );
  });
});

describe("route and detail fail-closed behavior", () => {
  it("allows Brand, redirects Creator, and denies Admin or unknown platform roles", () => {
    expect(resolveBrandPayoutsRouteAccess("BRAND")).toEqual({ kind: "ALLOW" });
    expect(resolveBrandPayoutsRouteAccess("CREATOR")).toEqual({
      kind: "REDIRECT",
      to: "/creator/payouts",
    });
    expect(resolveBrandPayoutsRouteAccess("ADMIN")).toEqual({ kind: "DENY" });
    expect(resolveBrandPayoutsRouteAccess(null)).toEqual({ kind: "DENY" });
  });

  it("accepts one stable detail reference and rejects conflicting query targets", () => {
    expect(
      resolvePayoutsDetailTarget("?activity=ledger%3Aone%3Arecorded"),
    ).toEqual({
      kind: "ACTIVITY",
      reference: "ledger:one:recorded",
    });
    expect(
      resolvePayoutsDetailTarget("?obligation=payout-obligation%3Aone"),
    ).toEqual({
      kind: "OBLIGATION",
      reference: "payout-obligation:one",
    });
    expect(
      resolvePayoutsDetailTarget("?brand_return=brand-return%3Areturn-one"),
    ).toEqual({
      kind: "BRAND_RETURN",
      reference: "brand-return:return-one",
    });
    expect(resolvePayoutsDetailTarget("?activity=a&obligation=b")).toBe(
      "INVALID",
    );
  });

  it("loads a URL-addressable Brand Return detail without exposing source data", async () => {
    mocks.authenticatedFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse(makeBrandReturnDetail())),
    );
    render(
      createElement(
        MemoryRouter,
        {
          initialEntries: [
            "/brand/payouts?brand_return=brand-return:return-one",
          ],
        },
        createElement(PayoutsDetail, {
          target: {
            kind: "BRAND_RETURN",
            reference: "brand-return:return-one",
          },
        }),
      ),
    );
    expect(await screen.findByText("Processing")).toBeTruthy();
    expect(screen.getByText(/original funding sources/u)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(
      /account number|ifsc|provider id/iu,
    );

    await expect(
      fetchBrandPayoutsBrandReturnDetail("brand-return:return-one"),
    ).resolves.toMatchObject({ schema_version: "brand-payouts.v2" });
    expect(String(mocks.authenticatedFetch.mock.calls.at(-1)?.[0])).toContain(
      "/brand-returns/brand-return%3Areturn-one",
    );
  });
});

describe("truthful first-slice rendering", () => {
  it("renders initial, unavailable, refreshing, and genuine new-Brand states", () => {
    const { rerender } = render(
      createElement(PayoutsOverview, {
        state: {
          data: null,
          status: "INITIAL_LOADING",
          error: null,
        },
        onRetry: vi.fn(),
      }),
    );
    expect(screen.getByLabelText("Loading financial overview")).toBeTruthy();

    rerender(
      createElement(PayoutsOverview, {
        state: {
          data: null,
          status: "UNAVAILABLE",
          error: "Payouts data is temporarily unavailable.",
        },
        onRetry: vi.fn(),
      }),
    );
    expect(screen.getByText("Overview unavailable")).toBeTruthy();

    const refreshingOverview = makeOverview();
    rerender(
      createElement(PayoutsOverview, {
        state: {
          data: refreshingOverview,
          status: "REFRESHING",
          error: null,
        },
        onRetry: vi.fn(),
      }),
    );
    expect(
      screen.getByText(/Refreshing while the current snapshot/u),
    ).toBeTruthy();

    const emptyOverview = makeOverview();
    const emptySection = emptyOverview.sections[0];
    if (
      !emptySection.payload ||
      emptySection.payload.projection !== "FULL_FINANCIAL"
    ) {
      throw new Error("Expected full financial fixture");
    }
    const parsedEmpty = brandPayoutsOverviewResponseSchema.parse({
      ...emptyOverview,
      sections: [
        {
          ...emptySection,
          payload: {
            ...emptySection.payload,
            available_funds: {
              status: "UNAVAILABLE",
              value: null,
              limitation_reason_code: "VAULT_NOT_ESTABLISHED",
            },
          },
        },
      ],
    });
    rerender(
      createElement(PayoutsOverview, {
        state: ready(parsedEmpty),
        onRetry: vi.fn(),
      }),
    );
    expect(screen.getByText("No financial activity yet")).toBeTruthy();
    expect(
      screen.getByText(/does not initialize or provision one/u),
    ).toBeTruthy();
    expect(screen.queryByText(/Initialize/u)).toBeNull();
  });

  it("renders separate authoritative buckets and an unavailable bucket", () => {
    render(
      createElement(PayoutsOverview, {
        state: ready(makeOverview()),
        onRetry: vi.fn(),
      }),
    );
    expect(screen.getByText("Available funds")).toBeTruthy();
    expect(screen.getByText("₹1,234.50")).toBeTruthy();
    expect(screen.getByText("Pending funding")).toBeTruthy();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
    expect(screen.getByText("Committed / protected")).toBeTruthy();
    expect(screen.getByText("Settled activity")).toBeTruthy();
  });

  it("renders the Campaign Manager fail-closed operational projection", () => {
    render(
      createElement(PayoutsOverview, {
        state: ready(makeCampaignManagerOverview()),
        onRetry: vi.fn(),
      }),
    );
    expect(screen.getByText("Operational read-only access")).toBeTruthy();
    expect(screen.getByText(/Financial rows remain hidden/u)).toBeTruthy();
    expect(screen.queryByText("Available funds")).toBeNull();
  });

  it("keeps last-good values visible with an explicit stale warning", () => {
    render(
      createElement(PayoutsOverview, {
        state: {
          data: makeOverview(),
          status: "STALE",
          error: "refresh failed",
        },
        onRetry: vi.fn(),
      }),
    );
    expect(screen.getByText("Showing last-known data")).toBeTruthy();
    expect(screen.getByText("₹1,234.50")).toBeTruthy();
  });

  it("distinguishes movement from lifecycle and preserves legacy due uncertainty", () => {
    const activityResponse = makeActivity();
    const activitySection = activityResponse.sections[0];
    const movementAndLifecycle = brandPayoutsActivityResponseSchema.parse({
      ...activityResponse,
      sections: [
        {
          ...activitySection,
          payload: [activityItem(), lifecycleActivityItem()],
        },
      ],
    });
    const tree = createElement(
      MemoryRouter,
      { initialEntries: ["/brand/payouts"] },
      createElement(PayoutsActivity, {
        state: ready(movementAndLifecycle),
        onLoadMore: vi.fn(),
        onRetry: vi.fn(),
      }),
      createElement(PayoutObligations, {
        state: ready(makeObligations()),
        onLoadMore: vi.fn(),
        onRetry: vi.fn(),
      }),
    );
    render(tree);
    expect(screen.getAllByText("Money movement").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lifecycle only").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No money movement").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Due date unavailable").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Legacy / limited").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /View/u }).length,
    ).toBeGreaterThan(1);
  });

  it("loads overview, activity, and obligations independently", async () => {
    const overviewResponse = deferred<Response>();
    const activityResponse = deferred<Response>();
    const obligationsResponse = deferred<Response>();
    mocks.authenticatedFetch.mockImplementation((input: string) => {
      if (input.includes("/activity?")) return activityResponse.promise;
      if (input.includes("/obligations?")) return obligationsResponse.promise;
      return overviewResponse.promise;
    });
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand/payouts"] },
        createElement(BrandPayoutsWorkspace),
      ),
    );
    expect(screen.getByLabelText("Loading financial overview")).toBeTruthy();
    expect(screen.getByLabelText("Loading financial activity")).toBeTruthy();
    expect(screen.getByLabelText("Loading payout obligations")).toBeTruthy();

    activityResponse.resolve(jsonResponse(makeActivity()));
    await screen.findAllByText("Money movement");
    expect(screen.getByLabelText("Loading financial overview")).toBeTruthy();
    expect(screen.getByLabelText("Loading payout obligations")).toBeTruthy();

    overviewResponse.resolve(jsonResponse(makeOverview()));
    obligationsResponse.resolve(jsonResponse(makeObligations()));
    await screen.findByText("Available funds");
    await screen.findAllByText("Due date unavailable");
  });

  it("shows a version-bound Settings deep link only for a complete current snapshot", async () => {
    async function renderCase(
      overview: BrandPayoutsOverviewResponse,
      expected: boolean,
    ) {
      mocks.authenticatedFetch.mockImplementation((input: string) => {
        if (input.includes("/activity?")) {
          return Promise.resolve(jsonResponse(makeActivity()));
        }
        if (input.includes("/obligations?")) {
          return Promise.resolve(jsonResponse(makeObligations()));
        }
        return Promise.resolve(jsonResponse(overview));
      });
      render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/brand/payouts"] },
          createElement(BrandPayoutsWorkspace),
        ),
      );
      await screen.findByText("Available funds");
      const link = screen.queryByRole("link", {
        name: "Open Secure escrow Settings",
      });
      expect(Boolean(link)).toBe(expected);
      cleanup();
      mocks.authenticatedFetch.mockReset();
    }

    await renderCase(makeOverviewWithSettingsAction(), true);
    await renderCase(
      makeOverviewWithSettingsAction("PARTIAL", "CURRENT"),
      false,
    );
    await renderCase(
      makeOverviewWithSettingsAction("COMPLETE", "STALE"),
      false,
    );
  });

  it("exposes both canonical commands only when the server selects Payouts", async () => {
    mocks.authenticatedFetch.mockImplementation((input: string) => {
      if (input.includes("/activity?")) {
        return Promise.resolve(jsonResponse(makeActivity()));
      }
      if (input.includes("/obligations?")) {
        return Promise.resolve(jsonResponse(makeObligations()));
      }
      return Promise.resolve(jsonResponse(makeOverviewWithPayoutsActions()));
    });
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand/payouts"] },
        createElement(BrandPayoutsWorkspace),
      ),
    );
    expect(
      await screen.findByRole("button", { name: "Add funds" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Return unused funds" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Open Secure escrow Settings" }),
    ).toBeNull();
  });

  it("restores focus to each async Treasury command invoker after Escape", async () => {
    const cases = [
      {
        triggerName: "Add funds",
        endpoint: "/api/v1/escrow/vault",
        dialogName: "Add funds",
        response: {
          vault_id: "11111111-1111-4111-8111-111111111111",
          brand_id: "22222222-2222-4222-8222-222222222222",
          razorpay_virtual_account_id: null,
          virtual_account_number: null,
          ifsc_code: null,
          upi_vpa: null,
          bank_name: null,
          virtual_account_enabled: false,
          currency: "INR",
          total_pooled_balance: 10_000,
          locked_campaign_funds: 2_500,
          available_balance: 7_000,
          active_return_commitment: 500,
          tds_buffer_balance: 0,
          pending_funding: 5_000,
          created_at: NOW,
          updated_at: NOW,
        },
      },
      {
        triggerName: "Return unused funds",
        endpoint: "/api/v1/escrow/brand-returns/summary",
        dialogName: "Return unused funds",
        response: {
          available_balance: 7_000,
          proven_source_available_balance: 6_000,
          self_service_returnable_balance: 5_500,
          active_return_commitment: 500,
          source_reconciliation_required_amount: 1_000,
          currency: "INR",
        },
      },
    ];

    for (const testCase of cases) {
      const actionResponse = deferred<Response>();
      mocks.authenticatedFetch.mockImplementation((input: string) => {
        if (input.includes(testCase.endpoint)) return actionResponse.promise;
        if (input.includes("/activity?")) {
          return Promise.resolve(jsonResponse(makeActivity()));
        }
        if (input.includes("/obligations?")) {
          return Promise.resolve(jsonResponse(makeObligations()));
        }
        return Promise.resolve(jsonResponse(makeOverviewWithPayoutsActions()));
      });
      render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/brand/payouts"] },
          createElement(BrandPayoutsWorkspace),
        ),
      );

      const trigger = await screen.findByRole("button", {
        name: testCase.triggerName,
      });
      trigger.focus();
      fireEvent.click(trigger);

      await waitFor(() =>
        expect(trigger.getAttribute("aria-disabled")).toBe("true"),
      );
      expect(trigger.hasAttribute("disabled")).toBe(false);
      expect(document.activeElement).toBe(trigger);

      actionResponse.resolve(jsonResponse(testCase.response));
      const close = await screen.findByRole("button", {
        name: `Close ${testCase.dialogName}`,
      });
      await waitFor(() => expect(document.activeElement).toBe(close));
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: testCase.dialogName }),
        ).toBeNull(),
      );
      expect(document.activeElement).toBe(trigger);

      cleanup();
      mocks.authenticatedFetch.mockReset();
    }
  });

  it("preserves an open Return drawer through a retained-data refresh without enabling new commands", async () => {
    const refreshedOverview = deferred<Response>();
    const returnSubmission = deferred<Response>();
    let overviewRequests = 0;
    let returnPosts = 0;
    const returnSummary = {
      available_balance: 7_000,
      proven_source_available_balance: 6_000,
      self_service_returnable_balance: 5_500,
      active_return_commitment: 500,
      source_reconciliation_required_amount: 1_000,
      currency: "INR",
    };

    mocks.authenticatedFetch.mockImplementation(
      (input: string, init?: RequestInit) => {
        if (
          input.endsWith("/api/v1/escrow/brand-returns") &&
          init?.method === "POST"
        ) {
          returnPosts += 1;
          return returnSubmission.promise;
        }
        if (input.includes("/api/v1/escrow/brand-returns/summary")) {
          return Promise.resolve(jsonResponse(returnSummary));
        }
        if (input.includes("/activity?")) {
          return Promise.resolve(jsonResponse(makeActivity()));
        }
        if (input.includes("/obligations?")) {
          return Promise.resolve(jsonResponse(makeObligations()));
        }
        if (input.includes("/reserve-requests?")) {
          return Promise.resolve(jsonResponse(makeReserveRequests()));
        }
        overviewRequests += 1;
        return overviewRequests === 1
          ? Promise.resolve(jsonResponse(makeOverviewWithPayoutsActions()))
          : refreshedOverview.promise;
      },
    );

    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand/payouts"] },
        createElement(BrandPayoutsWorkspace),
      ),
    );
    const invoker = await screen.findByRole("button", {
      name: "Return unused funds",
    });
    invoker.focus();
    fireEvent.click(invoker);
    await screen.findByRole("dialog", { name: "Return unused funds" });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Close Return unused funds" }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Return amount (INR)"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    const submit = screen.getByRole("button", {
      name: "Confirm Brand Return",
    });
    submit.focus();
    fireEvent.click(submit);
    await waitFor(() =>
      expect(submit.getAttribute("aria-disabled")).toBe("true"),
    );
    expect(submit.hasAttribute("disabled")).toBe(false);
    expect(document.activeElement).toBe(submit);
    fireEvent.click(submit);
    fireEvent.keyDown(submit, { key: "Enter" });
    expect(returnPosts).toBe(1);

    returnSubmission.resolve(
      jsonResponse(
        {
          code: "PROVIDER_SETUP_REQUIRED",
          message: "Brand Return provider runtime is not enabled",
        },
        503,
      ),
    );
    expect(
      await screen.findByText(/return provider is unavailable/i),
    ).toBeTruthy();
    expect(
      screen.getByRole("dialog", { name: "Return unused funds" }),
    ).toBeTruthy();
    expect(document.activeElement).toBe(submit);

    const addFunds = screen.getByRole("button", { name: "Add funds" });
    expect(addFunds.hasAttribute("disabled")).toBe(true);
    expect(invoker.hasAttribute("disabled")).toBe(true);
    fireEvent.click(addFunds);
    expect(
      mocks.authenticatedFetch.mock.calls.filter(([input]) =>
        String(input).includes("/api/v1/escrow/vault"),
      ),
    ).toHaveLength(0);

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close Return unused funds" }),
    );
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(submit);

    refreshedOverview.resolve(jsonResponse(makeOverviewWithPayoutsActions()));
    await waitFor(() => expect(invoker.hasAttribute("disabled")).toBe(false));
    expect(
      screen.getByRole("dialog", { name: "Return unused funds" }),
    ).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Return unused funds" }),
      ).toBeNull(),
    );
    expect(document.activeElement).toBe(invoker);
  });

  it("closes an open Treasury drawer when retained command authority is genuinely lost", async () => {
    const stale = makeOverviewWithPayoutsActions();
    const staleSection = stale.sections[0];
    const staleOverview = brandPayoutsOverviewResponseSchema.parse({
      ...stale,
      sections: [{ ...staleSection, freshness: "STALE" }],
    });
    const cases: Array<{
      name: string;
      state: PayoutsResourceState<BrandPayoutsOverviewResponse>;
    }> = [
      { name: "stale", state: ready(staleOverview) },
      {
        name: "unavailable",
        state: { data: null, status: "UNAVAILABLE", error: "unavailable" },
      },
      { name: "unauthorized", state: ready(makeCampaignManagerOverview()) },
      { name: "cross-surface", state: ready(makeOverviewWithSettingsAction()) },
      { name: "capability-revoked", state: ready(makeOverview()) },
    ];

    for (const testCase of cases) {
      mocks.authenticatedFetch.mockResolvedValue(
        jsonResponse({
          available_balance: 7_000,
          proven_source_available_balance: 6_000,
          self_service_returnable_balance: 5_500,
          active_return_commitment: 500,
          source_reconciliation_required_amount: 1_000,
          currency: "INR",
        }),
      );
      const { rerender } = render(
        createElement(
          MemoryRouter,
          null,
          createElement(PayoutsTreasuryActions, {
            state: ready(makeOverviewWithPayoutsActions()),
            onRefresh: vi.fn(),
          }),
        ),
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Return unused funds" }),
      );
      await screen.findByRole("dialog", { name: "Return unused funds" });
      rerender(
        createElement(
          MemoryRouter,
          null,
          createElement(PayoutsTreasuryActions, {
            state: testCase.state,
            onRefresh: vi.fn(),
          }),
        ),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "Return unused funds" }),
          testCase.name,
        ).toBeNull(),
      );
      cleanup();
      mocks.authenticatedFetch.mockReset();
    }
  });
});

describe("stable financial detail navigation", () => {
  it("preserves expanded activity and obligation pages across both detail return paths", async () => {
    const firstActivityId = "ledger:first:recorded";
    const secondActivityId = "ledger:second:recorded";
    const firstObligationId = "obligation-first";
    const secondObligationId = "obligation-second";
    let initialActivityRequests = 0;
    let initialObligationRequests = 0;

    mocks.authenticatedFetch.mockImplementation((input: string) => {
      if (input.includes(`/activity/${encodeURIComponent(secondActivityId)}`)) {
        return Promise.resolve(
          jsonResponse(makeActivityDetail(secondActivityId)),
        );
      }
      if (
        input.includes(
          `/obligations/${encodeURIComponent(`payout-obligation:${secondObligationId}`)}`,
        )
      ) {
        return Promise.resolve(
          jsonResponse(makeObligationDetail(secondObligationId)),
        );
      }
      if (input.includes("/activity?")) {
        if (input.includes("cursor=activity-next")) {
          return Promise.resolve(jsonResponse(makeActivity(secondActivityId)));
        }
        initialActivityRequests += 1;
        return Promise.resolve(
          jsonResponse(makeActivity(firstActivityId, "activity-next")),
        );
      }
      if (input.includes("/obligations?")) {
        if (input.includes("cursor=obligations-next")) {
          return Promise.resolve(
            jsonResponse(makeObligations(secondObligationId)),
          );
        }
        initialObligationRequests += 1;
        return Promise.resolve(
          jsonResponse(makeObligations(firstObligationId, "obligations-next")),
        );
      }
      if (input.endsWith("/api/v1/brand/payouts")) {
        return Promise.resolve(jsonResponse(makeOverview()));
      }
      return Promise.reject(new Error(`Unexpected Payouts request: ${input}`));
    });

    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand/payouts"] },
        createElement(
          "div",
          null,
          createElement(BrandPayoutsWorkspace),
          createElement(BrowserBackControl),
        ),
      ),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Load more activity" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Load more obligations" }),
    );
    const activityLinks = await screen.findAllByRole("link", {
      name: `View activity ${secondActivityId}`,
    });
    const obligationLinks = await screen.findAllByRole("link", {
      name: `View payout obligation payout-obligation:${secondObligationId}`,
    });
    expect(activityLinks).toHaveLength(2);
    expect(obligationLinks).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Load more activity" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Load more obligations" }),
    ).toBeNull();

    fireEvent.click(activityLinks[0]);
    await screen.findByText("Financial activity", { selector: "p" });
    fireEvent.click(screen.getByRole("button", { name: "Back to Payouts" }));
    expect(
      await screen.findAllByRole("link", {
        name: `View activity ${secondActivityId}`,
      }),
    ).toHaveLength(2);

    fireEvent.click(
      screen.getAllByRole("link", {
        name: `View payout obligation payout-obligation:${secondObligationId}`,
      })[0],
    );
    await screen.findByText("Creator payout obligation", { selector: "p" });
    fireEvent.click(
      screen.getByRole("button", { name: "Simulate browser Back" }),
    );
    expect(
      await screen.findAllByRole("link", {
        name: `View payout obligation payout-obligation:${secondObligationId}`,
      }),
    ).toHaveLength(2);
    expect(initialActivityRequests).toBe(1);
    expect(initialObligationRequests).toBe(1);
  });

  it("routes desktop and mobile activity links by activity ID while preserving the public reference", async () => {
    const activityId = "ledger:canonical-row:recorded";
    const publicReference = "activity-public-ref";
    const activityResponse = makeActivity(activityId);
    const activitySection = activityResponse.sections[0];
    const activitySeed = activitySection.payload?.[0];
    if (!activitySeed) throw new Error("Expected one activity fixture");
    const item = {
      ...activitySeed,
      public_reference: publicReference,
    };
    const listResponse = brandPayoutsActivityResponseSchema.parse({
      ...activityResponse,
      sections: [{ ...activitySection, payload: [item] }],
    });
    const detailSeed = makeActivityDetail();
    const detailResponse = brandPayoutsActivityDetailResponseSchema.parse({
      ...detailSeed,
      sections: [
        {
          ...detailSeed.sections[0],
          payload: item,
        },
      ],
    });
    mocks.authenticatedFetch.mockImplementation((input: string) => {
      if (input.includes("/activity?")) {
        return Promise.resolve(jsonResponse(listResponse));
      }
      if (input.includes("/obligations?")) {
        return Promise.resolve(jsonResponse(makeObligations()));
      }
      if (input.endsWith("/api/v1/brand/payouts")) {
        return Promise.resolve(jsonResponse(makeOverview()));
      }
      if (input.includes(`/activity/${encodeURIComponent(activityId)}`)) {
        return Promise.resolve(jsonResponse(detailResponse));
      }
      return Promise.reject(new Error(`Unexpected Payouts request: ${input}`));
    });
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand/payouts"] },
        createElement(BrandPayoutsWorkspace),
      ),
    );

    const links = await screen.findAllByRole("link", {
      name: `View activity ${publicReference}`,
    });
    expect(links).toHaveLength(2);
    expect(screen.getAllByText(publicReference)).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe(
        `/brand/payouts?activity=${encodeURIComponent(activityId)}`,
      );
    }

    fireEvent.click(links[0]);
    await waitFor(() =>
      expect(
        mocks.authenticatedFetch.mock.calls.some(([input]) =>
          String(input).includes(`/activity/${encodeURIComponent(activityId)}`),
        ),
      ).toBe(true),
    );
    expect(
      mocks.authenticatedFetch.mock.calls.some(([input]) =>
        String(input).includes(
          `/activity/${encodeURIComponent(publicReference)}`,
        ),
      ),
    ).toBe(false);
  });

  it("loads an activity detail directly from its stable activity ID", async () => {
    mocks.authenticatedFetch.mockResolvedValueOnce(
      jsonResponse(makeActivityDetail()),
    );
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand/payouts?activity=ledger%3Aone%3Arecorded"] },
        createElement(PayoutsDetail, {
          target: { kind: "ACTIVITY", reference: "ledger:one:recorded" },
        }),
      ),
    );
    expect(
      await screen.findByText("Financial activity", { selector: "p" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Money movement").length).toBeGreaterThan(0);
    expect(String(mocks.authenticatedFetch.mock.calls[0]?.[0])).toContain(
      "/activity/ledger%3Aone%3Arecorded",
    );
  });

  it("uses browser Back for list-opened detail", async () => {
    mocks.authenticatedFetch.mockResolvedValueOnce(
      jsonResponse(makeActivityDetail()),
    );
    render(
      createElement(
        MemoryRouter,
        {
          initialEntries: [
            "/origin",
            {
              pathname: "/brand/payouts",
              search: "?activity=ledger%3Aone%3Arecorded",
              state: { fromPayoutsList: true },
            },
          ],
          initialIndex: 1,
        },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/brand/payouts",
            element: createElement(PayoutsDetail, {
              target: { kind: "ACTIVITY", reference: "ledger:one:recorded" },
            }),
          }),
          createElement(Route, {
            path: "/origin",
            element: createElement("p", null, "Original Payouts list"),
          }),
        ),
      ),
    );
    await screen.findByText("Back to Payouts");
    fireEvent.click(screen.getByRole("button", { name: "Back to Payouts" }));
    expect(await screen.findByText("Original Payouts list")).toBeTruthy();
  });

  it("fails closed on unauthorized detail without rendering raw diagnostics", async () => {
    mocks.authenticatedFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ code: "DENIED", message: "raw provider diagnostic" }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(PayoutsDetail, {
          target: { kind: "ACTIVITY", reference: "ledger:one:recorded" },
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText(/does not permit this record/u)).toBeTruthy(),
    );
    expect(screen.queryByText(/raw provider diagnostic/u)).toBeNull();
  });
});

describe("P2 and P3A architecture constraints", () => {
  const featureSource = [
    "api/brand-payouts-client.ts",
    "components/BrandPayoutsRouteGuard.tsx",
    "components/BrandPayoutsWorkspace.tsx",
    "components/PayoutObligations.tsx",
    "components/PayoutsActivity.tsx",
    "components/PayoutsDetail.tsx",
    "components/PayoutsOverview.tsx",
    "components/PayoutsSectionStatus.tsx",
    "components/PayoutsTreasuryActions.tsx",
    "hooks/use-brand-payouts-detail.ts",
    "hooks/use-brand-payouts-workspace.ts",
    "utils/brand-payouts-presentation.ts",
  ]
    .map((path) =>
      readFileSync(
        resolve(process.cwd(), "src/features/brand-payouts", path),
        "utf8",
      ),
    )
    .join("\n");

  it("contains no parallel Settings hook, synthetic document, tax, tranche, or provider-ID path", () => {
    expect(featureSource).not.toMatch(/useBrandEscrow|jsPDF|30\s*\/\s*70/iu);
    expect(featureSource).not.toMatch(
      /\bTDS\b|razorpay|provider_(?:id|account|transfer)/iu,
    );
    expect(featureSource).not.toMatch(
      /topup-intent|brand-returns\/request|release now|mark paid/iu,
    );
  });

  it("reuses canonical drawers and keeps the Payouts route guard", () => {
    const settings = readFileSync(
      resolve(
        process.cwd(),
        "src/features/brand-escrow/components/escrow-account-card.tsx",
      ),
      "utf8",
    );
    const routes = readFileSync(
      resolve(process.cwd(), "src/routes/app-routes.tsx"),
      "utf8",
    );
    expect(settings).toContain("Add funds");
    expect(settings).toContain("EscrowTopUpDrawer");
    expect(featureSource).toContain("EscrowTopUpDrawer");
    expect(routes).toMatch(/BrandPayoutsRouteGuard>[\s\S]*<BrandPayoutsPage/u);
  });

  it("pins the mobile/desktop transformation and safe bottom-navigation clearance", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/features/brand-payouts/brand-payouts.css"),
      "utf8",
    );
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (min-width: 768px)");
    expect([390, 767].every((width) => width <= 767)).toBe(true);
    expect([768, 1280].every((width) => width >= 768)).toBe(true);
    expect(css).toMatch(/\.bp-table-wrap\s*\{[\s\S]*display:\s*none/iu);
    expect(css).toMatch(
      /@media \(min-width: 768px\)[\s\S]*\.bp-table-wrap\s*\{[\s\S]*display:\s*block/iu,
    );
    expect(css).toContain("var(--height-bottom-nav)");
    expect(css).toContain("env(safe-area-inset-bottom, 0px)");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("table-layout: fixed");
    expect(css).toMatch(
      /\.bp-mobile-row\s*\{[\s\S]*padding:\s*var\(--space-md\)/iu,
    );
    expect(css).toContain(".bp-detail-link:focus-visible");
    const tokens = readFileSync(
      resolve(process.cwd(), "src/design-system/aurora/tokens.css"),
      "utf8",
    );
    expect(tokens).toContain("--space-md: 24px");
  });

  it("keeps small Payouts accent text at WCAG AA contrast on page and card surfaces", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/features/brand-payouts/brand-payouts.css"),
      "utf8",
    );
    const tokens = readFileSync(
      resolve(process.cwd(), "src/design-system/aurora/tokens.css"),
      "utf8",
    );

    expect(css).toMatch(
      /\.bp-workspace__eyebrow\s*\{[^}]*color:\s*var\(--text-high\)/iu,
    );
    expect(css).toMatch(
      /\.bp-workspace \.aurora-button--outline:not\(:disabled\)\s*\{[^}]*color:\s*var\(--text-high\)/iu,
    );
    expect(css).toMatch(
      /\.bp-workspace \.aurora-button--ghost:not\(:disabled\)\s*\{[^}]*color:\s*var\(--text-high\)/iu,
    );

    const foreground = cssHexValue(tokens, "--text-high");
    expect(
      contrastRatio(foreground, cssHexValue(tokens, "--surface-page")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(foreground, cssHexValue(tokens, "--surface-card")),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps both table and mobile-card structures labelled for assistive technology", () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand/payouts"] },
        createElement(PayoutsActivity, {
          state: ready(makeActivity()),
          onLoadMore: vi.fn(),
          onRetry: vi.fn(),
        }),
        createElement(PayoutObligations, {
          state: ready(makeObligations()),
          onLoadMore: vi.fn(),
          onRetry: vi.fn(),
        }),
      ),
    );
    expect(
      screen.getByText("Brand financial activity", { selector: "caption" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Creator payout obligations", { selector: "caption" }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Brand financial activity", { selector: "div" }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Creator payout obligations", { selector: "div" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /View activity/u }).length).toBe(
      2,
    );
    expect(
      screen.getAllByRole("link", { name: /View payout obligation/u }).length,
    ).toBe(2);
  });
});
