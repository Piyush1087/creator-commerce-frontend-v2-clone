// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  discardDelegatedInstagramInvitation,
  storeDelegatedInstagramInvitation,
  takeDelegatedInstagramInvitation,
} from "./delegated-instagram-oauth-handoff";

const stateA = "a".repeat(43);
const stateB = "b".repeat(43);

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("delegated Instagram OAuth handoff", () => {
  it("stores invitation bearers only in state-keyed sessionStorage", () => {
    const localSet = vi.spyOn(Storage.prototype, "setItem");

    storeDelegatedInstagramInvitation(stateA, "invite-a");
    storeDelegatedInstagramInvitation(stateB, "invite-b");

    expect(window.sessionStorage.length).toBe(2);
    expect(window.localStorage.length).toBe(0);
    expect(localSet).toHaveBeenCalledWith(
      `creator-shop:instagram-invite-oauth:${stateA}`,
      "invite-a",
    );
    expect(localSet).toHaveBeenCalledWith(
      `creator-shop:instagram-invite-oauth:${stateB}`,
      "invite-b",
    );
  });

  it("destructively retrieves only the invitation bound to the callback state", () => {
    storeDelegatedInstagramInvitation(stateA, "invite-a");
    storeDelegatedInstagramInvitation(stateB, "invite-b");

    expect(takeDelegatedInstagramInvitation(stateB)).toBe("invite-b");
    expect(takeDelegatedInstagramInvitation(stateB)).toBeNull();
    expect(takeDelegatedInstagramInvitation(stateA)).toBe("invite-a");
    expect(window.sessionStorage.length).toBe(0);
  });

  it("does not substitute another invitation when the requested state is absent", () => {
    storeDelegatedInstagramInvitation(stateA, "invite-a");

    expect(takeDelegatedInstagramInvitation(stateB)).toBeNull();
    expect(takeDelegatedInstagramInvitation(stateA)).toBe("invite-a");
  });

  it("supports explicit cleanup of an abandoned state", () => {
    storeDelegatedInstagramInvitation(stateA, "invite-a");

    discardDelegatedInstagramInvitation(stateA);

    expect(takeDelegatedInstagramInvitation(stateA)).toBeNull();
  });
});
