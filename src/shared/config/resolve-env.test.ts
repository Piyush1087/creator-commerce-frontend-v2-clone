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

  it("allows an explicit local built preview to target a loopback API", () => {
    expect(
      resolvePublicRuntimeEnv({
        apiUrl: "http://127.0.0.1:3107",
        dev: false,
        stage: "local",
      }),
    ).toMatchObject({
      apiUrl: "http://127.0.0.1:3107",
      socketUrl: "http://127.0.0.1:3107",
      stage: "local",
    });
  });

  it("rejects localhost as a production API URL", () => {
    expect(() =>
      resolvePublicRuntimeEnv({
        apiUrl: "http://localhost:3000",
        dev: false,
        stage: "production",
      }),
    ).toThrow(/must not target localhost/);
  });

  it("does not infer a local built preview when the stage is missing", () => {
    expect(() =>
      resolvePublicRuntimeEnv({
        apiUrl: "http://127.0.0.1:3107",
        dev: false,
      }),
    ).toThrow(/must not target localhost/);
  });
});
