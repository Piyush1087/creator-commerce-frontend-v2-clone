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
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mocks = vi.hoisted(() => ({ authenticatedFetch: vi.fn() }));

vi.mock("../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: mocks.authenticatedFetch,
}));

import {
  BrandPayoutsApiError,
  fetchBrandPayoutsOverview,
} from "./api/brand-payouts-client";
import { PayoutObligations } from "./components/PayoutObligations";
import { PayoutsActivity } from "./components/PayoutsActivity";
import { PayoutsDetail } from "./components/PayoutsDetail";
import { PayoutsOverview } from "./components/PayoutsOverview";
import { BrandPayoutsWorkspace } from "./components/BrandPayoutsWorkspace";
import {
  BRAND_PAYOUTS_V2_MEDIA_TYPE,
  brandPayoutsActivityDetailResponseSchema,
  brandPayoutsActivityResponseSchema,
  brandPayoutsObligationsResponseSchema,
  brandPayoutsOverviewResponseSchema,
  type BrandPayoutsActivityResponse,
  type BrandPayoutsObligationsResponse,
  type BrandPayoutsOverviewResponse,
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

function makeActivityDetail() {
  return brandPayoutsActivityDetailResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: { role: "BRAND_OWNER", projection_scope: "FULL_FINANCIAL" },
    sections: [
      {
        section_id: "ACTIVITY",
        ...sectionMetadata,
        payload: activityItem(),
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
    expect(resolvePayoutsDetailTarget("?activity=a&obligation=b")).toBe(
      "INVALID",
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
});

describe("stable financial detail navigation", () => {
  it("loads an activity detail directly from its URL-safe public reference", async () => {
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

describe("P2 architecture constraints", () => {
  const featureSource = [
    "api/brand-payouts-client.ts",
    "components/BrandPayoutsRouteGuard.tsx",
    "components/BrandPayoutsWorkspace.tsx",
    "components/PayoutObligations.tsx",
    "components/PayoutsActivity.tsx",
    "components/PayoutsDetail.tsx",
    "components/PayoutsOverview.tsx",
    "components/PayoutsSectionStatus.tsx",
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

  it("contains no parallel Treasury fetch, synthetic document, tax, tranche, or provider-ID path", () => {
    expect(featureSource).not.toMatch(
      /useBrandEscrow|EscrowTopUpDrawer|jsPDF|30\s*\/\s*70/iu,
    );
    expect(featureSource).not.toMatch(
      /\bTDS\b|razorpay|provider_(?:id|account|transfer)/iu,
    );
    expect(featureSource).not.toMatch(
      /topup-intent|brand-returns\/request|release now|mark paid/iu,
    );
  });

  it("keeps Settings as the existing command surface and wraps the Payouts route guard", () => {
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
