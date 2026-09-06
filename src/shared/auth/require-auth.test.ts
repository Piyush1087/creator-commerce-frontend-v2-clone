// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  adoptAuthSession,
  clearAuthSession,
  resetAuthSessionForTests,
} from "./auth-session";
import { RequireAuth } from "./require-auth";

function LoginTarget() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return createElement("p", null, `Login return: ${from ?? "none"}`);
}

function mount() {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: ["/brand/settings?tab=security#current"] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/brand/settings",
          element: createElement(
            RequireAuth,
            null,
            createElement("p", null, "Protected content"),
          ),
        }),
        createElement(Route, {
          path: "/login",
          element: createElement(LoginTarget),
        }),
      ),
    ),
  );
}

beforeEach(resetAuthSessionForTests);
afterEach(cleanup);

describe("RequireAuth", () => {
  it("waits while startup refresh is unresolved", () => {
    mount();
    expect(screen.getByText("Restoring your secure session…")).toBeTruthy();
  });

  it("preserves the requested return path when unauthenticated", () => {
    clearAuthSession();
    mount();
    expect(
      screen.getByText("Login return: /brand/settings?tab=security#current"),
    ).toBeTruthy();
  });

  it("allows authenticated content", () => {
    adoptAuthSession({
      accessToken: "access",
      accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      user: {
        id: "user-1",
        email: "person@example.test",
        name: null,
        role: "BRAND",
      },
    });
    mount();
    expect(screen.getByText("Protected content")).toBeTruthy();
  });
});
