// @vitest-environment jsdom
import { createElement, StrictMode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forgotPassword, resetPassword } from "../api/auth-client";
import { AUTH_ROUTES } from "../constants";
import { ForgotPasswordCard } from "./forgot-password-card";
import { ResetPasswordCard } from "./reset-password-card";

vi.mock("../api/auth-client", () => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(forgotPassword).mockReset();
  vi.mocked(resetPassword).mockReset();
});

afterEach(cleanup);

function mountReset() {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [AUTH_ROUTES.resetPassword] },
      createElement(
        StrictMode,
        null,
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: AUTH_ROUTES.resetPassword,
            element: createElement(ResetPasswordCard),
          }),
          createElement(Route, {
            path: AUTH_ROUTES.login,
            element: createElement("h1", null, "Sign in again"),
          }),
        ),
      ),
    ),
  );
}

describe("password recovery", () => {
  it("keeps forgot-password copy generic", async () => {
    vi.mocked(forgotPassword).mockResolvedValueOnce();
    render(
      createElement(MemoryRouter, null, createElement(ForgotPasswordCard)),
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(
      await screen.findByText(/If an eligible account exists/),
    ).toBeTruthy();
  });

  it("captures and removes the fragment, validates the form, and never persists the token", async () => {
    const resetSecret = "synthetic-reset-secret";
    window.history.replaceState(
      null,
      "",
      `/reset-password#token=${resetSecret}`,
    );
    vi.mocked(resetPassword).mockResolvedValueOnce();
    mountReset();

    expect(window.location.hash).toBe("");
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Reset password" }).closest("form")!,
    );
    expect(
      await screen.findByText("Use a password between 8 and 128 characters."),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Reset password" }).closest("form")!,
    );

    expect(await screen.findByText("Sign in again")).toBeTruthy();
    expect(resetPassword).toHaveBeenCalledWith({
      token: resetSecret,
      newPassword: "new-password",
    });
    expect(
      JSON.stringify({
        local: Object.values(localStorage),
        session: Object.values(sessionStorage),
      }),
    ).not.toContain(resetSecret);
  });

  it("rejects mismatched and overlong passwords before the API", async () => {
    window.history.replaceState(
      null,
      "",
      "/reset-password#token=synthetic-token",
    );
    mountReset();
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "valid-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different-password" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Reset password" }).closest("form")!,
    );
    expect(await screen.findByText("The passwords do not match.")).toBeTruthy();

    const longPassword = "x".repeat(129);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: longPassword },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: longPassword },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Reset password" }).closest("form")!,
    );
    expect(
      await screen.findByText("Use a password between 8 and 128 characters."),
    ).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("surfaces an invalid or expired reset response", async () => {
    window.history.replaceState(
      null,
      "",
      "/reset-password#token=expired-token",
    );
    vi.mocked(resetPassword).mockRejectedValueOnce(
      new Error("This password reset link is invalid or expired."),
    );
    mountReset();
    for (const label of ["New password", "Confirm new password"]) {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "valid-new-password" },
      });
    }
    fireEvent.submit(
      screen.getByRole("button", { name: "Reset password" }).closest("form")!,
    );
    expect(
      await screen.findByText(
        "This password reset link is invalid or expired.",
      ),
    ).toBeTruthy();
  });
});
