import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { CollaborationDetailResponse } from "./contracts/collaboration.contracts";
import { collaborationCapabilities } from "./utils/collaboration-capabilities";

const detailWith = (
  availableActions: CollaborationDetailResponse["workflow"]["availableActions"],
) =>
  ({
    workflow: { availableActions },
  }) as CollaborationDetailResponse;

describe("C04 backend-driven frontend authority", () => {
  it("maps the first Creator proposal only when advertised", () => {
    expect(
      collaborationCapabilities(detailWith(["SubmitCreatorProposal"])),
    ).toEqual(new Set(["submit-creator-proposal"]));
    expect(collaborationCapabilities(detailWith([]))).not.toContain(
      "submit-creator-proposal",
    );
  });

  it("maps both destination choices without inferring them from role", () => {
    expect(
      collaborationCapabilities(
        detailWith(["ConfirmDefaultDestination", "OverrideDestination"]),
      ),
    ).toEqual(new Set(["confirm-default-destination", "override-destination"]));
  });

  it("leaves an Assistant read/chat projection without state mutations", () => {
    expect(
      collaborationCapabilities(detailWith(["PostCollaborationMessage"])),
    ).toEqual(new Set(["message"]));
  });
});

describe("C04 bounded frontend families", () => {
  const client = readFileSync(
    "src/features/collaboration/api/collaboration-client.ts",
    "utf8",
  );

  it("uses the accepted proposal and destination routes", () => {
    expect(client).toContain('"negotiation/creator-proposal"');
    expect(client).toContain('"destination/confirm-default"');
    expect(client).toContain('"destination/override"');
  });

  it("loads the snapshot-only Collaboration Brief", () => {
    expect(client).toContain("/brief");
    expect(
      readFileSync(
        "src/features/collaboration/components/execution/CollaborationBriefPanel.tsx",
        "utf8",
      ),
    ).toContain("snapshot-only");
  });

  it("contains no retired manual-payment capability", () => {
    const capabilities = readFileSync(
      "src/features/collaboration/utils/collaboration-capabilities.ts",
      "utf8",
    );
    expect(capabilities).not.toMatch(/ManualPayment|manual-payment/);
  });
});
