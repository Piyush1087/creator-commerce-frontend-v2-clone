// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { saveCreatorInstagramSettingsFlow } from "../../../features/settings/utils/creator-instagram-settings-oauth-session";
import { CreatorInstagramOAuthCallbackRoute } from "./creator-instagram-oauth-callback-route";

vi.mock("./creator-instagram-oauth-callback-page", () => ({
  CreatorInstagramOAuthCallbackPage: () => "C01 Creator Entry callback",
}));
vi.mock(
  "../../../features/settings/components/creator/creator-instagram-settings-oauth-callback",
  () => ({
    CreatorInstagramSettingsOAuthCallback: () => "C05 Settings callback",
  }),
);

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("Creator Instagram callback route facade", () => {
  it("keeps C-01 callback authority without a Settings marker", () => {
    render(createElement(CreatorInstagramOAuthCallbackRoute));
    expect(screen.getByText("C01 Creator Entry callback")).toBeTruthy();
  });

  it.each(["INITIAL_CONNECT", "SAME_ID_RECONNECT"] as const)(
    "mounts Settings callback for the %s marker",
    (flow) => {
      saveCreatorInstagramSettingsFlow(flow);
      render(createElement(CreatorInstagramOAuthCallbackRoute));
      expect(screen.getByText("C05 Settings callback")).toBeTruthy();
    },
  );
});
