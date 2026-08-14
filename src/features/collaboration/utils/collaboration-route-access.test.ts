import { describe, expect, it } from "vitest";

import { AUTH_ROUTES } from "../../auth/constants";
import { resolveCollaborationRouteAccess } from "./collaboration-route-access";

describe("Collaboration route access", () => {
  it("allows each operational role on its own route", () => {
    expect(resolveCollaborationRouteAccess("BRAND", "BRAND")).toEqual({
      kind: "allow",
      role: "BRAND",
    });
    expect(resolveCollaborationRouteAccess("CREATOR", "CREATOR")).toEqual({
      kind: "allow",
      role: "CREATOR",
    });
  });

  it("redirects an opposite operational role to its workspace", () => {
    expect(resolveCollaborationRouteAccess("BRAND", "CREATOR")).toEqual({
      kind: "redirect",
      to: AUTH_ROUTES.brandCollaborations,
    });
    expect(resolveCollaborationRouteAccess("CREATOR", "BRAND")).toEqual({
      kind: "redirect",
      to: AUTH_ROUTES.creatorCollaborations,
    });
  });

  it("never treats Admin or unresolved roles as Brand", () => {
    expect(resolveCollaborationRouteAccess("ADMIN", "BRAND")).toEqual({
      kind: "unsupported",
    });
    expect(resolveCollaborationRouteAccess(null, "BRAND")).toEqual({
      kind: "unsupported",
    });
  });
});
