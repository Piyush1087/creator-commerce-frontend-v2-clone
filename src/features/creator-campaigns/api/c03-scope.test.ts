import { afterEach, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    sessionId: string;
    organizationId: string;
  },
  listeners: new Set<() => void>(),
}));
vi.mock("../../../shared/auth/auth-session", () => ({
  getAuthSessionSnapshot: () => ({ currentUser: auth.user }),
  subscribeToAuthSession: (f: () => void) => {
    auth.listeners.add(f);
    return () => auth.listeners.delete(f);
  },
}));
import { CampaignScope, invalidateCampaignScopes } from "./c03-scope";
afterEach(() => {
  auth.user = null;
  auth.listeners.clear();
});
it.each(["actor", "session", "workspace", "logout"])(
  "synchronously aborts %s replacement and rejects late work",
  (kind) => {
    auth.user = { id: "a", sessionId: "s", organizationId: "w" };
    const scope = new CampaignScope();
    scope.assertCurrent();
    auth.user =
      kind === "logout"
        ? null
        : {
            id: kind === "actor" ? "b" : "a",
            sessionId: kind === "session" ? "t" : "s",
            organizationId: kind === "workspace" ? "x" : "w",
          };
    auth.listeners.forEach((f) => f());
    expect(scope.signal.aborted).toBe(true);
    expect(() => scope.assertCurrent()).toThrow();
    scope.dispose();
  },
);
it("membership invalidation clears every C03 surface", () => {
  const a = new CampaignScope();
  const b = new CampaignScope();
  a.assertCurrent();
  b.assertCurrent();
  invalidateCampaignScopes();
  expect(a.signal.aborted && b.signal.aborted).toBe(true);
  a.dispose();
  b.dispose();
});
