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
import { TeamInvitationAcceptance } from "./team-invitation-acceptance";
import {
  getAuthSession,
  resetAuthSessionForTests,
} from "../../../../shared/auth/auth-session";
import { AUTH_ROUTES } from "../../../auth/constants";

const fetchMock = vi.fn();
const presentation = {
  brand_name: "Invited workspace",
  email: "recipient@example.test",
  role: "FINANCE_ADMIN",
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  requires_account_bootstrap: true,
};
const session = {
  accessToken: "synthetic.session.fixture",
  accessTokenExpiresAt: new Date(Date.now() + 900000).toISOString(),
  user: {
    id: "recipient",
    email: presentation.email,
    name: "Recipient",
    role: "BRAND",
    organizationId: "invited-org",
  },
};
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function mount() {
  window.history.replaceState(
    null,
    "",
    "/brand/team-invitations/accept#token=synthetic-invitation-fixture",
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
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("BS-02 public invitation acceptance", () => {
  it("shows inspecting, safe presentation and clears token URL", async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((done) => {
        resolve = done;
      }),
    );
    mount();
    expect(screen.getByText("Inspecting invitation…")).toBeTruthy();
    resolve(response(presentation));
    expect(await screen.findByText("Invited workspace")).toBeTruthy();
    expect(window.location.hash).toBe("");
    expect(fetchMock.mock.calls[0][0]).not.toContain(
      "synthetic-invitation-fixture",
    );
  });
  it.each([
    ["INVITATION_INVALID", 404, "Invalid invitation"],
    ["INVITATION_EXPIRED", 410, "Invitation expired"],
    ["INVITATION_CONSUMED", 409, "Invitation already accepted"],
  ] as const)("renders %s", async (code, status, heading) => {
    fetchMock.mockResolvedValueOnce(
      response({ code, message: "Ask an administrator for help." }, status),
    );
    mount();
    expect(await screen.findByText(heading)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).toBeNull();
  });
  it("requires matching new-account passwords before acceptance", async () => {
    fetchMock.mockResolvedValueOnce(response(presentation));
    mount();
    await screen.findByLabelText("Password");
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "mismatch" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Accept invitation" })
        .closest("form")!,
    );
    expect(await screen.findByText(/matching confirmation/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([true, false])(
    "accepts with account bootstrap=%s and establishes canonical auth session/navigation",
    async (bootstrap) => {
      fetchMock
        .mockResolvedValueOnce(
          response({ ...presentation, requires_account_bootstrap: bootstrap }),
        )
        .mockResolvedValueOnce(response(session));
      mount();
      await screen.findByText("Invited workspace");
      if (bootstrap)
        for (const label of ["Password", "Confirm password"])
          fireEvent.change(screen.getByLabelText(label), {
            target: { value: "synthetic-password" },
          });
      else expect(screen.queryByLabelText("Password")).toBeNull();
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Accept invitation" })
          .closest("form")!,
      );
      expect(await screen.findByText("Brand dashboard")).toBeTruthy();
      expect(getAuthSession()).toEqual(session);
      expect(fetchMock.mock.calls[1][1].credentials).toBe("include");
      const body = JSON.parse(fetchMock.mock.calls[1][1].body as string) as {
        password?: string;
      };
      expect(body.password).toBe(bootstrap ? "synthetic-password" : undefined);
    },
  );
  it("shows submitting and acceptance error without replacing the current session", async () => {
    let resolve!: (value: Response) => void;
    fetchMock
      .mockResolvedValueOnce(
        response({ ...presentation, requires_account_bootstrap: false }),
      )
      .mockReturnValueOnce(
        new Promise<Response>((done) => {
          resolve = done;
        }),
      );
    mount();
    await screen.findByText("Invited workspace");
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Accept invitation" })
        .closest("form")!,
    );
    expect(
      screen
        .getByRole("button", { name: "Accepting invitation…" })
        .hasAttribute("disabled"),
    ).toBe(true);
    resolve(
      response(
        { message: "This account cannot join the invited Brand workspace." },
        403,
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          "This account cannot join the invited Brand workspace.",
        ),
      ).toBeTruthy(),
    );
    expect(getAuthSession()).toBeNull();
  });
});
