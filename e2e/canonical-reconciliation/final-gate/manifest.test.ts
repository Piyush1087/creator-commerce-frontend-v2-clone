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
