import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  creatorPayoutMoneySchema,
  creatorPayoutsOverviewSchema,
} from "./contracts/creator-payouts.contracts";

describe("C06 P4 frontend contracts, API and hooks", () => {
  it("requires exact decimal strings", () => {
    expect(
      creatorPayoutMoneySchema.safeParse({
        amount: "100.2500",
        currency: "INR",
      }).success,
    ).toBe(true);
    expect(
      creatorPayoutMoneySchema.safeParse({ amount: 100.25, currency: "INR" })
        .success,
    ).toBe(false);
    expect(
      creatorPayoutMoneySchema.safeParse({ amount: "1e2", currency: "INR" })
        .success,
    ).toBe(false);
  });

  it("requires the frozen schema version and actor-aware viewer", () => {
    const response = {
      schema_version: "C06_CREATOR_PAYOUTS_V1",
      as_of: "2026-09-08T12:00:00.000Z",
      viewer: { actor_role: "OWNER", workspace_reference: "workspace-1" },
      section: {
        coverage: "COMPLETE",
        freshness: "CURRENT",
        source_coverage: [],
        available_actions: [],
      },
      summaries: [],
    };
    expect(creatorPayoutsOverviewSchema.safeParse(response).success).toBe(true);
    expect(
      creatorPayoutsOverviewSchema.safeParse({
        ...response,
        schema_version: "legacy",
      }).success,
    ).toBe(false);
    expect(
      creatorPayoutsOverviewSchema.safeParse({
        ...response,
        viewer: { actor_role: "ASSISTANT", workspace_reference: "workspace-1" },
      }).success,
    ).toBe(false);
  });

  it("defines only GET/no-store C06 client reads and abortable hooks", () => {
    const client = readFileSync(
      "src/features/creator-payouts/api/creator-payouts-client.ts",
      "utf8",
    );
    const hook = readFileSync(
      "src/features/creator-payouts/hooks/use-creator-payouts.ts",
      "utf8",
    );
    expect(client).toContain('method: "GET"');
    expect(client).toContain('cache: "no-store"');
    expect(client).not.toMatch(/method:\s*"(POST|PUT|PATCH|DELETE)"/);
    expect(client.match(/fetchCreatorPayout/g)?.length).toBeGreaterThanOrEqual(
      6,
    );
    expect(hook).toContain("AbortController");
    expect(hook).toContain("REFRESHING");
    expect(hook).toContain("STALE");
    expect(hook).toContain("accessDenied");
  });

  it("contains no legacy money, ETA, KYC, tax, PDF or execution contract", () => {
    const contract = readFileSync(
      "src/features/creator-payouts/contracts/creator-payouts.contracts.ts",
      "utf8",
    );
    expect(contract).not.toMatch(
      /number;|next_payout|escrow_pipeline|tranche|invoice|tax|pdf|kyc|execute/i,
    );
  });
});
