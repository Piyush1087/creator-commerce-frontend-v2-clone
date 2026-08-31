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

import { logoutCurrentSession } from "../../features/auth/api/auth-client";
import { useLogout } from "./use-logout";

vi.mock("../../features/auth/api/auth-client", () => ({
  logoutCurrentSession: vi.fn(),
}));

function LogoutHarness() {
  const logout = useLogout();
  return createElement("button", { onClick: logout }, "Logout");
}

beforeEach(() => {
  vi.mocked(logoutCurrentSession).mockReset();
});

afterEach(cleanup);

describe("useLogout", () => {
  it("keeps the current authenticated route when server logout fails", async () => {
    vi.mocked(logoutCurrentSession).mockRejectedValueOnce(
      new Error("Logout service unavailable."),
    );
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/creator/home"] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/creator/home",
            element: createElement(LogoutHarness),
          }),
          createElement(Route, {
            path: "/login",
            element: createElement("h1", null, "Sign in"),
          }),
        ),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(logoutCurrentSession).toHaveBeenCalledOnce());

    expect(screen.getByRole("button", { name: "Logout" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Sign in" })).toBeNull();
  });
});
