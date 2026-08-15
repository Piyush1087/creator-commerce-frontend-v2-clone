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

  it("routes CreatorBankDetailsDrawer through Settings/Payout bank API", () => {
    const drawer = readFileSync(
      resolve(__dirname, "../../creator-payouts/components/CreatorBankDetailsDrawer.tsx"),
      "utf8",
    );
    expect(drawer).toContain("upsertCreatorPayoutBank");
    expect(drawer).toContain("creator-settings-client");
    expect(drawer).not.toContain("upsertCreatorBankDetails");
    expect(drawer).not.toContain("collaboration-client");
  });
});
