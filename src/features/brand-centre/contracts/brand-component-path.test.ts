import { describe, expect, it } from "vitest";
import {
  encodeComponentSegment,
  isCanonicalComponentPath,
} from "./brand-component-path";
import { componentField, itemPath } from "../adapters/brand-field-state";
import { field, meta } from "../testing/brand-consumer-fixtures";

describe("backend component path identity", () => {
  it("preserves encoded semantic identity including punctuation and slashes", () => {
    expect(encodeComponentSegment("brand's/(care)!")).toBe(
      "brand%27s%2F%28care%29%21",
    );
    const path = itemPath("$", "brand's/(care)!");
    expect(isCanonicalComponentPath(path)).toBe(true);
    const parent = {
      ...field("values", []),
      authority: "mixed" as const,
      componentMeta: {
        [path]: { ...meta(path), authority: "confirmed" as const },
      },
    };
    expect(componentField(parent, path, "Care").authority).toBe("confirmed");
  });
  it.each([
    "$/i/0",
    "$/i/",
    "$/f/..",
    "$/i/%zz",
    "$/i/a%2fb",
    "$/bad/value",
    "$/i/a%00",
  ])("rejects noncanonical path %s", (path) => {
    expect(isCanonicalComponentPath(path)).toBe(false);
  });
});
