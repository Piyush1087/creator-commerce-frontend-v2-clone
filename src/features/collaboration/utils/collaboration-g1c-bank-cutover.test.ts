import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("G1C Collaboration bank writer removal", () => {
  it("removes upsertCreatorBankDetails from the Collaboration client", () => {
    const client = readFileSync(
      resolve(__dirname, "../api/collaboration-client.ts"),
      "utf8",
    );
    expect(client).not.toContain("upsertCreatorBankDetails");
    expect(client).not.toContain("/creator/bank-details");
  });

  it("keeps payout method writes exclusively in Settings and out of C06", () => {
    const workspace = readFileSync(
      resolve(
        __dirname,
        "../../creator-payouts/components/CreatorPayoutsWorkspace.tsx",
      ),
      "utf8",
    );
    const settings = readFileSync(
      resolve(__dirname, "../../settings/api/creator-settings-client.ts"),
      "utf8",
    );
    expect(workspace).toContain("Manage in Settings");
    expect(workspace).not.toMatch(
      /upsertCreatorPayoutBank|CreatorBankDetailsDrawer|accountNumber/,
    );
    expect(settings).toContain("upsertCreatorPayoutBank");
    expect(settings).not.toContain("upsertCreatorBankDetails");
  });
});
