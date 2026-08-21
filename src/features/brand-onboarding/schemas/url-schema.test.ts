import { describe, expect, it } from "vitest";

import { urlSchema } from "./url-schema";

describe("Gatekeeper URL UX validation", () => {
  it("accepts and normalizes a normal brand domain", () => {
    expect(urlSchema.parse(" brand.com ")).toBe("https://brand.com");
  });

  it("rejects an empty value", () => {
    expect(urlSchema.safeParse(" ").success).toBe(false);
  });

  it("rejects a basic malformed value", () => {
    expect(urlSchema.safeParse("not-a-domain").success).toBe(false);
  });

  it("rejects obvious social-profile hosts for immediate UX", () => {
    expect(urlSchema.safeParse("https://instagram.com/example").success).toBe(false);
  });

  it("rejects obvious marketplace hosts for immediate UX", () => {
    expect(urlSchema.safeParse("https://amazon.in/example").success).toBe(false);
  });

  it("does not maintain restricted-TLD admission policy", () => {
    expect(urlSchema.safeParse("https://brand.xyz").success).toBe(true);
  });
});
