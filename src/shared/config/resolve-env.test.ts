import { describe, expect, it } from "vitest";

import { resolvePublicRuntimeEnv } from "./resolve-env";

describe("Public runtime env", () => {
  it("preserves local DEV behavior when API URL is missing", () => {
    expect(
      resolvePublicRuntimeEnv({
        dev: true,
        googleMapsApiKey: "  maps-key  ",
      }),
    ).toMatchObject({
      apiUrl: "",
      socketUrl: "http://localhost:3000",
      googleMapsApiKey: "maps-key",
    });
  });

  it("fails production builds without an API URL", () => {
    expect(() => resolvePublicRuntimeEnv({ dev: false })).toThrow(
      /VITE_API_URL is required/,
    );
  });

  it("rejects localhost as a production API URL", () => {
    expect(() =>
      resolvePublicRuntimeEnv({
        apiUrl: "http://localhost:3000",
        dev: false,
      }),
    ).toThrow(/must not target localhost/);
  });
});
