import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

/** Accepted IN authenticated API clients. OUT Co-Pilot / Centre / C-06 hub excluded. */
const IN_API_CLIENTS = [
  "src/features/auth/api/auth-client.ts",
  "src/features/creator-home/api/creator-home-client.ts",
  "src/features/brand-dashboard/api/brand-home-client.ts",
  "src/features/chat/api/chat-client.ts",
  "src/features/collaboration/api/collaboration-client.ts",
  "src/features/uce/api/brand-uce-client.ts",
  "src/features/uce/api/canonical-campaign-draft-client.ts",
  "src/features/brand-payouts/api/brand-payouts-client.ts",
  "src/features/brand-escrow/api/brand-escrow-client.ts",
  "src/features/settings/api/creator-settings-client.ts",
  "src/features/settings/api/brand-settings-client.ts",
  "src/features/settings/api/creator-profile-contact-client.ts",
  "src/features/creator-campaigns/api/c03-client.ts",
  "src/features/creator-campaigns/api/creator-campaigns-client.ts",
  "src/features/creator-payout-settings/api/creator-payout-settings-client.ts",
  "src/features/brand-centre/api/brand-centre-client.ts",
] as const;

describe("INV-11 backend authority over accepted IN clients", () => {
  it("sends IN feature traffic through authenticatedFetch to /api/v1", () => {
    for (const relativePath of IN_API_CLIENTS) {
      const source = read(relativePath);
      expect(source, relativePath).toContain("authenticated-fetch");
      expect(source, relativePath).toMatch(/\/api\/v1/);
    }
  });

  it("does not let IN API clients invent business rows in localStorage", () => {
    for (const relativePath of IN_API_CLIENTS) {
      expect(read(relativePath), relativePath).not.toContain("localStorage");
    }
  });

  it("keeps Brand Home and Creator Home on their aggregator APIs only", () => {
    expect(read("src/features/brand-dashboard/api/brand-home-client.ts")).toContain(
      "/api/v1/brand/home",
    );
    expect(read("src/features/creator-home/api/creator-home-client.ts")).toContain(
      "/api/v1/creator/home",
    );
  });
});
