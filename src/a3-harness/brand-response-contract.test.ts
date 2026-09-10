import { describe, expect, it } from "vitest";

import { brandCentreBrandSchema } from "../features/brand-centre/schemas/brand-centre-brand-schema";

describe.skipIf(process.env.A3_BROWSER_FIXTURE_RUN !== "true")(
  "A3 local Brand response compatibility",
  () => {
    it("accepts the authenticated provider-neutral Brand projection", async () => {
      const backend = process.env.A3_BACKEND_URL;
      const password = process.env.A3_BROWSER_PASSWORD;
      if (!backend || !password) throw new Error("A3 local inputs are required");
      const login = await fetch(`${backend}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "a3-owner@example.test",
          password,
        }),
      });
      expect(login.status).toBe(200);
      const session = (await login.json()) as { accessToken?: unknown };
      expect(typeof session.accessToken).toBe("string");
      const response = await fetch(`${backend}/api/v1/brand-centre/brand`, {
        headers: { Authorization: `Bearer ${String(session.accessToken)}` },
      });
      expect(response.status).toBe(200);
      const parsed = brandCentreBrandSchema.safeParse(await response.json());
      if (!parsed.success) {
        console.error(
          "A3_BRAND_CONTRACT_ISSUES",
          parsed.error.issues.map((issue) => ({
            code: issue.code,
            path: issue.path.join("."),
          })),
        );
      }
      expect(parsed.success).toBe(true);
    });
  },
);
