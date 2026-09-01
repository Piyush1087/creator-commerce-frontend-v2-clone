// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCreatorEntryContinuation,
  isCreatorEntryContinuationToken,
  readCreatorEntryContinuation,
  saveCreatorEntryContinuation,
} from "./creator-entry-continuation-session";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("Creator Entry continuation storage", () => {
  it("accepts only 43-character base64url tokens in session storage", () => {
    const token = "Abc_123-Zyx".padEnd(43, "Q");
    expect(isCreatorEntryContinuationToken(token)).toBe(true);
    saveCreatorEntryContinuation(token);
    expect(readCreatorEntryContinuation()).toBe(token);
    expect(localStorage.length).toBe(0);
    clearCreatorEntryContinuation();
    expect(readCreatorEntryContinuation()).toBeNull();
  });

  it("rejects malformed or URL-like values", () => {
    for (const value of [
      "short",
      "A".repeat(44),
      "A".repeat(42),
      "A".repeat(42) + "+",
      "?token=" + "A".repeat(43),
    ]) {
      expect(isCreatorEntryContinuationToken(value)).toBe(false);
    }
    expect(() => saveCreatorEntryContinuation("invalid")).toThrow();
  });
});
