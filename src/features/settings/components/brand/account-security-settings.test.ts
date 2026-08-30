// @vitest-environment jsdom
import { createElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  changePassword,
  fetchAuthMe,
  logoutAllSessions,
} from "../../../auth/api/auth-client";
import type {
  AuthMeResponseBody,
  AuthMethodType,
} from "../../../auth/contracts/auth.contracts";
import { AccountSecuritySettings } from "./account-security-settings";

vi.mock("../../../auth/api/auth-client", () => ({
  changePassword: vi.fn(),
  fetchAuthMe: vi.fn(),
  logoutAllSessions: vi.fn(),
}));

function profile(methods: AuthMethodType[]): AuthMeResponseBody {
  return {
    id: "user-1",
    email: "user@example.test",
    name: "Test User",
    role: "BRAND",
    authState: "ACTIVE",
    authMethods: methods.map((type) => ({
      type,
      verifiedAt: "2026-08-30T00:00:00.000Z",
    })),
    brandMemberships: [
      { brandProfileId: "brand-1", role: "BRAND_OWNER", isActive: true },
    ],
  };
}

function mount() {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: ["/brand/settings/general"] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/brand/settings/general",
          element: createElement(AccountSecuritySettings),
        }),
        createElement(Route, {
          path: "/login",
          element: createElement("h1", null, "Sign in again"),
        }),
      ),
    ),
  );
}

beforeEach(() => {
  vi.mocked(fetchAuthMe).mockReset();
  vi.mocked(changePassword).mockReset();
  vi.mocked(logoutAllSessions).mockReset();
  vi.mocked(fetchAuthMe).mockResolvedValue(profile(["PASSWORD"]));
  vi.mocked(changePassword).mockResolvedValue(undefined);
  vi.mocked(logoutAllSessions).mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("BS-12 Account security", () => {
  it("renders active sign-in methods truthfully without provider identifiers", async () => {
    vi.mocked(fetchAuthMe).mockResolvedValue(
      profile(["PASSWORD", "GOOGLE", "EMAIL_OTP"]),
    );
    mount();
    for (const method of ["Password", "Google", "Email code"]) {
      expect(await screen.findByText(method)).toBeTruthy();
    }
    expect(
      screen.getByRole("button", { name: "Change password" }),
    ).toBeTruthy();
    expect(screen.queryByText(/subject|session id|token/i)).toBeNull();
  });

  it("does not invent password management for a Google/OTP-only account", async () => {
    vi.mocked(fetchAuthMe).mockResolvedValue(profile(["GOOGLE", "EMAIL_OTP"]));
    mount();
    expect(await screen.findByText("Google")).toBeTruthy();
    expect(screen.getByText("Email code")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Change password" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Sign out all devices" }),
    ).toBeTruthy();
  });

  it("validates current password, canonical bounds, and matching confirmation", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Change password" }),
    );
    const form = document.getElementById("account-security-action")!;
    fireEvent.submit(form);
    expect(
      await screen.findByText("Enter your current password."),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "current-password" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "short" },
    });
    fireEvent.submit(form);
    expect(await screen.findByText(/between 8 and 128/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different-password" },
    });
    fireEvent.submit(form);
    expect(
      await screen.findByText("The new passwords do not match."),
    ).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it.each([8, 128])(
    "accepts a new password of %i characters and redirects after session revocation",
    async (length) => {
      const newPassword = "n".repeat(length);
      mount();
      fireEvent.click(
        await screen.findByRole("button", { name: "Change password" }),
      );
      fireEvent.change(screen.getByLabelText("Current password"), {
        target: { value: "current-password" },
      });
      fireEvent.change(screen.getByLabelText("New password"), {
        target: { value: newPassword },
      });
      fireEvent.change(screen.getByLabelText("Confirm new password"), {
        target: { value: newPassword },
      });
      fireEvent.submit(document.getElementById("account-security-action")!);
      expect(await screen.findByText("Sign in again")).toBeTruthy();
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: "current-password",
        newPassword,
      });
    },
  );

  it("rejects 129 characters client-side", async () => {
    const value = "n".repeat(129);
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Change password" }),
    );
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "current-password" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value },
    });
    fireEvent.submit(document.getElementById("account-security-action")!);
    expect(await screen.findByText(/between 8 and 128/)).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("confirms logout-all with provider-safe copy and redirects on success", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign out all devices" }),
    );
    expect(
      screen.getByText(/signs you out of Creator Shop sessions on all devices/),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /does not sign you out of Google, Meta, or other providers/,
      ),
    ).toBeTruthy();
    fireEvent.submit(document.getElementById("account-security-action")!);
    expect(await screen.findByText("Sign in again")).toBeTruthy();
    expect(logoutAllSessions).toHaveBeenCalledOnce();
  });

  it("keeps the user on General and never fakes success when logout-all fails", async () => {
    vi.mocked(logoutAllSessions).mockRejectedValueOnce(
      new Error("Session service unavailable."),
    );
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign out all devices" }),
    );
    fireEvent.submit(document.getElementById("account-security-action")!);
    expect(
      await screen.findByText("Session service unavailable."),
    ).toBeTruthy();
    expect(screen.queryByText("Sign in again")).toBeNull();
    expect(
      screen.getAllByRole("button", { name: "Sign out all devices" }),
    ).toHaveLength(2);
    await waitFor(() => expect(logoutAllSessions).toHaveBeenCalledOnce());
  });
});
