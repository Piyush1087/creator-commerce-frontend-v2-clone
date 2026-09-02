// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loginWithPassword,
  requestLoginOtp,
  verifyLoginOtp,
} from "../api/auth-client";
import { AUTH_ROUTES } from "../constants";
import {
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
  GoogleSignInButton: () => null,
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

function mount() {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [AUTH_ROUTES.login] },
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
      ),
    ),
  );
}

beforeEach(() => {
  resetAuthSessionForTests();
  clearAuthSession();
  vi.mocked(loginWithPassword).mockReset();
  vi.mocked(requestLoginOtp).mockReset();
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
});
