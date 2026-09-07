// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticatedFetch: vi.fn() }));
vi.mock("../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: mocks.authenticatedFetch,
}));

import { PayoutReserveRequests } from "./components/PayoutReserveRequests";
import {
  brandPayoutsReserveRequestsResponseSchema,
  type BrandPayoutsReserveRequestsResponse,
} from "./contracts/brand-payouts.contracts";

const NOW = "2026-09-12T12:00:00.000Z";
const INSTRUCTION_ID = "00000000-0000-4000-8000-000000000101";

function response(
  role: "BRAND_OWNER" | "FINANCE_ADMIN" | "CAMPAIGN_MANAGER" = "BRAND_OWNER",
): BrandPayoutsReserveRequestsResponse {
  const full = role !== "CAMPAIGN_MANAGER";
  return brandPayoutsReserveRequestsResponseSchema.parse({
    schema_version: "brand-payouts.v2",
    as_of: NOW,
    viewer: {
      role,
      projection_scope: full ? "FULL_FINANCIAL" : "NO_FINANCIAL_ROWS",
    },
    sections: [
      {
        section_id: "RESERVE_REQUESTS",
        coverage: full ? "COMPLETE" : "UNAVAILABLE",
        freshness: "CURRENT",
        source_observed_at: full ? NOW : null,
        source_coverage: [
          {
            source: "COLLABORATION_RESERVE_REQUESTS",
            status: full ? "AVAILABLE" : "UNAVAILABLE",
            limitation_reason_code: full
              ? null
              : "CANONICAL_ENTITY_SCOPE_UNAVAILABLE",
            recovery_hint: null,
          },
        ],
        legacy_limitations: [],
        available_actions: full
          ? [
              {
                action: "APPROVE_RESERVE",
                resource_reference: INSTRUCTION_ID,
                resource_version: "reserve-instruction:v4",
                authorized_as_of: NOW,
              },
            ]
          : [],
        payload: full
          ? [
              {
                reserve_request_id: "business-request-1",
                reserve_instruction_id: INSTRUCTION_ID,
                public_reference: "reserve-request:business-request-1",
                resource_version: "reserve-instruction:v4",
                campaign_id: "campaign-public-1",
                collaboration_id: "collaboration-public-1",
                status: "APPROVAL_REQUIRED",
                reserve_value: { amount: "118.0000", currency: "INR" },
                approval_required: true,
                requested_at: NOW,
                last_observed_at: NOW,
                action_required_reason_code: null,
                legacy: null,
              },
            ]
          : [],
        page: {
          next_cursor: null,
          page_complete: true,
          source_complete: full,
        },
      },
    ],
  });
}

function ready(data: BrandPayoutsReserveRequestsResponse) {
  return { data, status: "READY" as const, error: null };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  mocks.authenticatedFetch.mockReset();
});

describe("Wave C reserve approval consumer", () => {
  it.each(["BRAND_OWNER", "FINANCE_ADMIN"] as const)(
    "uses only the server action identity for %s and deduplicates pending activation",
    async (role) => {
      const pending = deferred<Response>();
      mocks.authenticatedFetch.mockReturnValue(pending.promise);
      const onRefresh = vi.fn();
      render(
        createElement(PayoutReserveRequests, {
          state: ready(response(role)),
          onLoadMore: vi.fn(),
          onRefresh,
        }),
      );
      expect(screen.queryByText(INSTRUCTION_ID)).toBeNull();
      const invoker = screen.getByRole("button", {
        name: "Review reserve approval",
      });
      invoker.focus();
      fireEvent.click(invoker);
      const submit = await screen.findByRole("button", {
        name: "Confirm reserve approval",
      });
      submit.focus();
      fireEvent.click(submit);
      await waitFor(() =>
        expect(submit.getAttribute("aria-disabled")).toBe("true"),
      );
      expect(submit.hasAttribute("disabled")).toBe(false);
      fireEvent.click(submit);
      fireEvent.keyDown(submit, { key: "Enter" });
      expect(mocks.authenticatedFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mocks.authenticatedFetch.mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(url).toContain("/reserve-approvals");
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      expect(body.reserve_instruction_id).toBe(INSTRUCTION_ID);
      expect(body).not.toHaveProperty("amount");

      pending.resolve(
        new Response(
          JSON.stringify({
            approval: {
              id: "00000000-0000-4000-8000-000000000201",
              reserveInstructionId: INSTRUCTION_ID,
              requestId: "business-request-1",
              status: "COMPLETED",
            },
            replayed: false,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
      await screen.findByText(
        /Reserve approved and protected funds confirmed/u,
      );
      expect(onRefresh).toHaveBeenCalledTimes(1);
    },
  );

  it("keeps Campaign Manager read-only with no amount or approval control", () => {
    render(
      createElement(PayoutReserveRequests, {
        state: ready(response("CAMPAIGN_MANAGER")),
        onLoadMore: vi.fn(),
        onRefresh: vi.fn(),
      }),
    );
    expect(
      screen.queryByRole("button", { name: /reserve approval/iu }),
    ).toBeNull();
    expect(screen.queryByText(/₹/u)).toBeNull();
  });

  it("suppresses a stale or version-mismatched approval action", () => {
    const current = response();
    const section = current.sections[0];
    const stale = {
      ...current,
      sections: [
        {
          ...section,
          freshness: "STALE" as const,
          available_actions: section.available_actions.map((action) => ({
            ...action,
            resource_version: "reserve-instruction:v3",
          })),
        },
      ],
    };
    render(
      createElement(PayoutReserveRequests, {
        state: ready(stale),
        onLoadMore: vi.fn(),
        onRefresh: vi.fn(),
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Review reserve approval" }),
    ).toBeNull();
  });
});
