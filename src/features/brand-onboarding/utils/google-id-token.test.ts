// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { mountGoogleIdButton } from "./google-id-token";

describe("Google Identity Services configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("fails safely when the public client ID is not configured", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    const onCredential = vi.fn();
    await expect(
      mountGoogleIdButton({
        container: document.createElement("div"),
        context: "signin",
        onCredential,
      }),
    ).rejects.toThrow("VITE_GOOGLE_CLIENT_ID");
    expect(onCredential).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
