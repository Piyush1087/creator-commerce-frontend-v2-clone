import { describe, expect, it } from "vitest";

import { isAllowedFinalGateUrl, redactSecrets } from "./helpers";
import { FINAL_GATE_EXECUTIONS, FINAL_GATE_SCENARIOS } from "./manifest";

describe("Final Gate browser harness contracts", () => {
  it("freezes exactly twelve scenarios and thirty viewport executions", () => {
    expect(FINAL_GATE_SCENARIOS).toHaveLength(12);
    expect(FINAL_GATE_EXECUTIONS).toHaveLength(30);
    expect(FINAL_GATE_SCENARIOS.map(({ id }) => id)).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `B${String(index + 1).padStart(2, "0")}`,
      ),
    );
  });

  it("requires meaningful operations, visible proof and audit declarations", () => {
    for (const scenario of FINAL_GATE_SCENARIOS) {
      expect(scenario.orderedOperations.length).toBeGreaterThan(0);
      expect(scenario.orderedOperations.some(({ type }) =>
        !["NAVIGATE", "BODY_VISIBLE"].includes(type))).toBe(true);
      expect(scenario.visibleAssertions.length).toBeGreaterThan(0);
      expect(scenario.isolationMode).toBe("RESET_RESEED_AUDIT");
      if (scenario.denialAssertions.length)
        expect(scenario.denialAssertions.every(({ target }) => target.length > 0)).toBe(true);
      if (scenario.allowedWriteClasses.length)
        expect(scenario.allowedWriteClasses.every(({ min, max }) => min >= 0 && max >= min)).toBe(true);
      if (scenario.secondaryRole)
        expect(scenario.orderedOperations.some(({ role }) => role === scenario.secondaryRole)).toBe(true);
    }
  });

  it("freezes the scenario-specific multi-role and mutation obligations", () => {
    const byId = Object.fromEntries(FINAL_GATE_SCENARIOS.map((entry) => [entry.id, entry]));
    expect(byId.B05.orderedOperations.filter(({ type }) => type === "CREATE_OBJECTIVE_DRAFT")).toHaveLength(4);
    expect(byId.B06.expectedFinalState).toBe("ADD_PRODUCT_CANONICAL_CAMPAIGN_ASSET_REFERENCE_FLOW");
    expect(byId.B08.orderedOperations.map(({ role }) => role).filter(Boolean)).toEqual([
      "CREATOR_OWNER", "BRAND_OWNER", "CREATOR_OWNER",
    ]);
    expect(byId.B09.secondaryRole).toBe("FINANCE_ADMIN");
    expect(byId.B12.secondaryRole).toBe("CREATOR_ASSISTANT");
    expect(byId.B12.orderedOperations.some(({ target }) => target.includes("DISCONNECTED|CONNECTED_SYNTHETIC|PROVIDER_UNAVAILABLE"))).toBe(true);
  });

  it("allows loopback and rejects synthetic external traffic", () => {
    expect(isAllowedFinalGateUrl("http://127.0.0.1:5173/")).toBe(true);
    expect(isAllowedFinalGateUrl("http://localhost:3000/health")).toBe(true);
    expect(isAllowedFinalGateUrl("https://provider.invalid/probe")).toBe(false);
  });

  it("redacts credential-shaped fields", () => {
    expect(
      redactSecrets({
        password: "synthetic-secret",
        nested: { accessToken: "synthetic-token", safe: "ok" },
      }),
    ).toEqual({
      password: "[REDACTED]",
      nested: { accessToken: "[REDACTED]", safe: "ok" },
    });
  });
});
