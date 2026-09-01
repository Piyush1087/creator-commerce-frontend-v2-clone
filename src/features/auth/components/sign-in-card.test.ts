// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loginWithPassword,
  requestLoginOtp,
  signInWithGoogle,
  verifyLoginOtp,
} from "../api/auth-client";
import { AUTH_ROUTES } from "../constants";
import {
  adoptAuthSession,
  clearAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import { SignInCard } from "./sign-in-card";

vi.mock("../api/auth-client", () => ({
  loginWithPassword: vi.fn(),
  requestLoginOtp: vi.fn(),
  signInWithGoogle: vi.fn(),
  verifyLoginOtp: vi.fn(),
}));

vi.mock("./google-sign-in-button", () => ({
  GoogleSignInButton: ({
    onCredential,
  }: {
    onCredential: (idToken: string) => void;
  }) =>
    createElement(
      "button",
      { type: "button", onClick: () => onCredential("google-fixture") },
      "Continue with Google",
    ),
}));

const canonicalSession = {
  accessToken: "access-fixture",
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "user-1",
    email: "person@example.test",
    name: "Person",
    role: "CREATOR",
  },
};

function LocationTarget() {
  const location = useLocation();
  return createElement(
    "p",
    null,
    `Destination: ${location.pathname}${location.search}${location.hash}`,
  );
}

function mount(from?: string) {
  return render(
    createElement(
      MemoryRouter,
      {
        initialEntries: [
          {
            pathname: AUTH_ROUTES.login,
            ...(from === undefined ? {} : { state: { from } }),
          },
        ],
      },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: AUTH_ROUTES.login,
          element: createElement(SignInCard),
        }),
        createElement(Route, {
          path: AUTH_ROUTES.creatorHome,
          element: createElement("h1", null, "Creator home"),
        }),
        createElement(Route, {
          path: "*",
          element: createElement(LocationTarget),
        }),
      ),
    ),
  );
}

beforeEach(() => {
  resetAuthSessionForTests();
  clearAuthSession();
  vi.mocked(loginWithPassword).mockReset();
  vi.mocked(requestLoginOtp).mockReset();
  vi.mocked(signInWithGoogle).mockReset();
  vi.mocked(verifyLoginOtp).mockReset();
});

afterEach(cleanup);

describe("sign-in card", () => {
  it("supports arrow-key navigation between sign-in methods", () => {
    mount();
    const passwordTab = screen.getByRole("tab", { name: "Password" });
    passwordTab.focus();

    fireEvent.keyDown(passwordTab, { key: "ArrowRight" });

    const emailCodeTab = screen.getByRole("tab", { name: "Email code" });
    expect(emailCodeTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(emailCodeTab);
    expect(screen.queryByLabelText("Password")).toBeNull();
  });

  it("submits password login and follows the authenticated user's role", async () => {
    vi.mocked(loginWithPassword).mockResolvedValueOnce(canonicalSession);
    mount();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Creator home")).toBeTruthy();
    expect(loginWithPassword).toHaveBeenCalledWith({
      email: "person@example.test",
      password: "synthetic-password",
    });
  });

  it("uses a safe Campaign guest return after password login", async () => {
    const campaignId = "11111111-1111-4111-8111-111111111111";
    vi.mocked(loginWithPassword).mockResolvedValueOnce(canonicalSession);
    mount(`/marketplace/${campaignId}?invite_token=safe_token`);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText(
        `Destination: /creator/marketplace/${campaignId}?invite_token=safe_token`,
      ),
    ).toBeTruthy();
  });

  it("requests, validates, and verifies an email code with resend cooldown", async () => {
    vi.mocked(requestLoginOtp).mockResolvedValue();
    vi.mocked(verifyLoginOtp).mockResolvedValueOnce(canonicalSession);
    mount();
    fireEvent.click(screen.getByRole("tab", { name: "Email code" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));

    expect(await screen.findByLabelText("6-digit code")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Resend in 60s" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getByText(/If an eligible account exists/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("6-digit code"), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));
    expect(
      await screen.findByText("Enter the 6-digit verification code."),
    ).toBeTruthy();
    expect(verifyLoginOtp).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("6-digit code"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));
    await waitFor(() =>
      expect(verifyLoginOtp).toHaveBeenCalledWith({
        email: "person@example.test",
        code: "654321",
      }),
    );
    expect(await screen.findByText("Creator home")).toBeTruthy();
  });

  it("uses a safe Creator onboarding return after OTP login", async () => {
    vi.mocked(requestLoginOtp).mockResolvedValue();
    vi.mocked(verifyLoginOtp).mockResolvedValueOnce(canonicalSession);
    mount("/creator/onboarding");
    fireEvent.click(screen.getByRole("tab", { name: "Email code" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    fireEvent.change(await screen.findByLabelText("6-digit code"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));
    expect(
      await screen.findByText("Destination: /creator/onboarding"),
    ).toBeTruthy();
  });

  it("uses a safe Brand return after Google login", async () => {
    vi.mocked(signInWithGoogle).mockResolvedValueOnce({
      ...canonicalSession,
      user: { ...canonicalSession.user, role: "BRAND" },
    });
    mount("/brand/settings/integrations?tab=instagram");
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(
      await screen.findByText(
        "Destination: /brand/settings/integrations?tab=instagram",
      ),
    ).toBeTruthy();
  });

  it("sanitizes the already-authenticated session redirect", async () => {
    adoptAuthSession(canonicalSession);
    mount("/creator/marketplace");
    expect(
      await screen.findByText("Destination: /creator/marketplace"),
    ).toBeTruthy();
  });

  it.each([
    "//evil.example",
    String.raw`/\evil.example`,
    "https://evil.example",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "/%2f%2fevil.example",
    "/unsupported/internal/route",
  ])("keeps the malicious return %s inside the role-safe home", async (from) => {
    adoptAuthSession(canonicalSession);
    mount(from);
    expect(await screen.findByText("Creator home")).toBeTruthy();
    expect(window.location.href).not.toContain("evil.example");
  });
});
