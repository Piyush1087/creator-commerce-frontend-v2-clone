// @vitest-environment jsdom
import { createElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  clearAuthSession,
  getAuthSession,
  resetAuthSessionForTests,
} from "../../../../shared/auth/auth-session";
import { AUTH_ROUTES } from "../../../auth/constants";
import { TeamInvitationAcceptance } from "./team-invitation-acceptance";

vi.mock("../../../auth/components/google-sign-in-button", () => ({
  GoogleSignInButton: ({
    onCredential,
  }: {
    onCredential: (token: string) => void;
  }) =>
    createElement(
      "button",
      { type: "button", onClick: () => onCredential("synthetic-google-id") },
      "Continue with Google",
    ),
}));

const fetchMock = vi.fn();
const invitationToken = "synthetic-invitation-fixture";
const presentation = {
  brand_name: "Invited workspace",
  email: "recipient@example.test",
  role: "FINANCE_ADMIN",
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  requires_account_bootstrap: true,
};
const session = {
  accessToken: "synthetic.session.fixture",
  accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString(),
  user: {
    id: "recipient",
    email: presentation.email,
    name: "Recipient",
    role: "BRAND",
    organizationId: "invited-org",
  },
};

function response(body: unknown, status = 200) {
  return new Response(body === undefined ? undefined : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestAction(call: unknown[]) {
  const url = String(call[0]);
  return url.split("/").at(-1);
}

function requestBody(index: number): Record<string, string> {
  return JSON.parse(
    (fetchMock.mock.calls[index][1] as RequestInit).body as string,
  ) as Record<string, string>;
}

function mount(fragment = `#token=${invitationToken}`) {
  window.history.replaceState(
    null,
    "",
    `/brand/team-invitations/accept${fragment}`,
  );
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: ["/brand/team-invitations/accept"] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/brand/team-invitations/accept",
          element: createElement(TeamInvitationAcceptance),
        }),
        createElement(Route, {
          path: AUTH_ROUTES.brandDashboard,
          element: createElement("h1", null, "Brand dashboard"),
        }),
      ),
    ),
  );
}

beforeEach(() => {
  resetAuthSessionForTests();
  clearAuthSession();
  localStorage.clear();
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("BS-02 public invitation acceptance", () => {
  it("captures the fragment token, scrubs the URL, and never persists or logs it", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((done) => {
        resolve = done;
      }),
    );
    mount();
    expect(screen.getByText("Inspecting invitation…")).toBeTruthy();
    expect(window.location.hash).toBe("");
    resolve(response(presentation));
    expect(await screen.findByText("Invited workspace")).toBeTruthy();
    expect(String(fetchMock.mock.calls[0][0])).not.toContain(invitationToken);
    expect(requestBody(0)).toEqual({ token: invitationToken });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    for (const spy of [logSpy, infoSpy, warnSpy, errorSpy]) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(invitationToken);
    }
  });

  it.each([
    ["INVITATION_INVALID", 404, "Invalid invitation"],
    ["INVITATION_EXPIRED", 410, "Invitation expired"],
    ["INVITATION_CONSUMED", 409, "Invitation already accepted"],
  ] as const)("renders terminal state %s", async (code, status, heading) => {
    fetchMock.mockResolvedValueOnce(
      response({ code, message: "Ask an administrator for help." }, status),
    );
    mount();
    expect(await screen.findByText(heading)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).toBeNull();
  });

  it("does not allow an unauthenticated existing user to accept with the token alone", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ ...presentation, requires_account_bootstrap: false }),
    );
    mount();
    expect(
      await screen.findByText("Verify your invited identity"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Email code" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Google" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    "accepts a %s user with a purpose-bound invitation OTP",
    async (bootstrap) => {
      fetchMock
        .mockResolvedValueOnce(
          response({ ...presentation, requires_account_bootstrap: bootstrap }),
        )
        .mockResolvedValueOnce(response({ delivery_status: "DISPATCHED" }))
        .mockResolvedValueOnce(response(session));
      mount();
      await screen.findByText("Invited workspace");
      if (bootstrap) {
        fireEvent.click(screen.getByRole("button", { name: "Email code" }));
      }
      fireEvent.click(screen.getByRole("button", { name: "Send email code" }));
      const code = await screen.findByLabelText("6-digit invitation code");
      expect(code.getAttribute("autocomplete")).toBe("one-time-code");
      expect(requestAction(fetchMock.mock.calls[1])).toBe("request-otp");
      expect(requestBody(1)).toEqual({ token: invitationToken });
      expect(
        (
          screen.getByRole("button", {
            name: /Resend in 60s/,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      fireEvent.change(code, { target: { value: "123456" } });
      fireEvent.click(
        screen.getByRole("button", { name: "Accept invitation" }),
      );
      expect(await screen.findByText("Brand dashboard")).toBeTruthy();
      expect(requestBody(2)).toEqual({
        token: invitationToken,
        otpCode: "123456",
      });
      expect(getAuthSession()).toEqual(session);
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    },
  );

  it.each([false, true])(
    "accepts a %s user with an ephemeral Google identity token",
    async (bootstrap) => {
      fetchMock
        .mockResolvedValueOnce(
          response({ ...presentation, requires_account_bootstrap: bootstrap }),
        )
        .mockResolvedValueOnce(response(session));
      mount();
      await screen.findByText("Invited workspace");
      fireEvent.click(screen.getByRole("button", { name: "Google" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Continue with Google" }),
      );
      expect(await screen.findByText("Brand dashboard")).toBeTruthy();
      expect(requestBody(1)).toEqual({
        token: invitationToken,
        googleIdToken: "synthetic-google-id",
      });
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    },
  );

  it("surfaces the backend Google email mismatch without persisting the token", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ ...presentation, requires_account_bootstrap: false }),
      )
      .mockResolvedValueOnce(
        response(
          {
            code: "TEAM_INVITATION_IDENTITY_MISMATCH",
            message: "The Google account does not match the invited email.",
          },
          403,
        ),
      );
    mount();
    await screen.findByText("Invited workspace");
    fireEvent.click(screen.getByRole("button", { name: "Google" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(
      await screen.findByText(
        "The Google account does not match the invited email.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Brand dashboard")).toBeNull();
  });

  it("lets the authenticated exact invited user accept directly with the FE-0 bearer session", async () => {
    adoptAuthSession({ ...session, accessToken: "exact-user-access" });
    fetchMock
      .mockResolvedValueOnce(
        response({ ...presentation, requires_account_bootstrap: false }),
      )
      .mockResolvedValueOnce(response(session));
    mount();
    expect(
      await screen.findByText(/Continue as recipient@example\.test/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
    expect(await screen.findByText("Brand dashboard")).toBeTruthy();
    expect(requestBody(1)).toEqual({ token: invitationToken });
    const headers = new Headers(
      (fetchMock.mock.calls[1][1] as RequestInit).headers,
    );
    expect(headers.get("Authorization")).toBe("Bearer exact-user-access");
  });

  it("blocks a different active account, signs it out, and retains the in-memory invitation", async () => {
    adoptAuthSession({
      ...session,
      accessToken: "different-user-access",
      user: { ...session.user, id: "other", email: "other@example.test" },
    });
    fetchMock
      .mockResolvedValueOnce(
        response({ ...presentation, requires_account_bootstrap: false }),
      )
      .mockResolvedValueOnce(response(undefined, 204));
    mount();
    expect(
      await screen.findByText(/currently signed in as other@example\.test/),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign out and continue" }),
    );
    expect(
      await screen.findByText("Verify your invited identity"),
    ).toBeTruthy();
    expect(requestAction(fetchMock.mock.calls[1])).toBe("logout");
    expect(window.location.hash).toBe("");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([8, 128])(
    "accepts a new-user password of %i characters",
    async (length) => {
      const value = "a".repeat(length);
      fetchMock
        .mockResolvedValueOnce(response(presentation))
        .mockResolvedValueOnce(response(session));
      mount();
      await screen.findByLabelText("Password");
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value },
      });
      fireEvent.change(screen.getByLabelText("Confirm password"), {
        target: { value },
      });
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Accept invitation" })
          .closest("form")!,
      );
      expect(await screen.findByText("Brand dashboard")).toBeTruthy();
      expect(requestBody(1)).toEqual({
        token: invitationToken,
        password: value,
      });
    },
  );

  it.each([
    ["a".repeat(129), "a".repeat(129), "between 8 and 128"],
    ["abcdefgh", "abcdefgi", "passwords do not match"],
  ])(
    "blocks invalid new-user password proof",
    async (password, confirm, error) => {
      fetchMock.mockResolvedValueOnce(response(presentation));
      mount();
      await screen.findByLabelText("Password");
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: password },
      });
      fireEvent.change(screen.getByLabelText("Confirm password"), {
        target: { value: confirm },
      });
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Accept invitation" })
          .closest("form")!,
      );
      expect(await screen.findByText(new RegExp(error))).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
});
