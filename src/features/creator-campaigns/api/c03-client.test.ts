import { afterEach, beforeEach, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({
  token: "fixture-access",
  user: {
    id: "owner",
    sessionId: "session",
    organizationId: "workspace",
    role: "CREATOR",
  } as {
    id: string;
    sessionId: string;
    organizationId?: string;
    role: string;
  } | null,
  status: "AUTHENTICATED",
  listeners: new Set<() => void>(),
  refresh: vi.fn(),
}));
vi.mock("../../../shared/auth/auth-session", () => ({
  getAccessToken: () => auth.token,
  getAuthSessionSnapshot: () => ({
    currentUser: auth.user,
    status: auth.status,
  }),
  subscribeToAuthSession: (fn: () => void) => {
    auth.listeners.add(fn);
    return () => auth.listeners.delete(fn);
  },
  refreshAuthSession: auth.refresh,
}));
import { CampaignScope, invalidateCampaignScopes } from "./c03-scope";
import {
  CampaignError,
  commandKey,
  fetchOpportunity,
  submitApplication,
} from "./c03-client";
import {
  fixtureId,
  opportunityFixture,
  receiptFixture,
} from "../testing/c03-fixtures";
import { reasonCopy } from "../utils/c03-reasons";
import { messageForError } from "../utils/c03-errors";
const scopes: CampaignScope[] = [];
const scope = () => {
  const result = new CampaignScope();
  scopes.push(result);
  return result;
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => {
  auth.token = "fixture-access";
  auth.user = {
    id: "owner",
    sessionId: "session",
    organizationId: "workspace",
    role: "CREATOR",
  };
  auth.status = "AUTHENTICATED";
  auth.listeners.forEach((f) => f());
});
afterEach(() => {
  scopes.splice(0).forEach((s) => s.dispose());
  invalidateCampaignScopes();
  auth.refresh.mockReset();
  vi.unstubAllGlobals();
});
it("uses the shared single 401 refresh and preserves the exact command through the guard unmount", async () => {
  const current = scope();
  const headers: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      headers.push(new Headers(init.headers).get("Idempotency-Key")!);
      return headers.length === 1 ? json({}, 401) : json(receiptFixture);
    }),
  );
  auth.refresh.mockImplementation(async () => {
    auth.status = "REFRESHING";
    auth.listeners.forEach((f) => f());
    current.dispose();
    expect(current.signal.aborted).toBe(false);
    auth.token = "fixture-refreshed";
    auth.status = "AUTHENTICATED";
    auth.listeners.forEach((f) => f());
    return { accessToken: auth.token };
  });
  const result = await submitApplication(
    current,
    fixtureId(1),
    fixtureId(2),
    fixtureId(3),
    commandKey(),
  );
  expect(result.applicationId).toBe(receiptFixture.applicationId);
  expect(headers.length).toBe(2);
  expect(headers[0] === headers[1]).toBe(true);
  expect(auth.refresh).toHaveBeenCalledTimes(1);
});
it("does not send a stale retry after refresh replaces the actor", async () => {
  const current = scope();
  let sent = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      if (init.signal?.aborted)
        throw new DOMException("Cancelled", "AbortError");
      sent++;
      return json({}, 401);
    }),
  );
  auth.refresh.mockImplementation(async () => {
    auth.user = {
      id: "other",
      sessionId: "other-session",
      organizationId: "other-workspace",
      role: "CREATOR",
    };
    auth.token = "fixture-replacement";
    auth.listeners.forEach((f) => f());
    return { accessToken: auth.token };
  });
  await expect(
    submitApplication(
      current,
      fixtureId(1),
      fixtureId(2),
      fixtureId(3),
      commandKey(),
    ),
  ).rejects.toHaveProperty("name", "AbortError");
  expect(sent).toBe(1);
});
it("omitted /auth/me organization is not a session change, while an explicit workspace replacement is", () => {
  const current = scope();
  current.assertCurrent();
  delete auth.user!.organizationId;
  auth.listeners.forEach((f) => f());
  expect(current.signal.aborted).toBe(false);
  auth.user!.organizationId = "other-workspace";
  auth.listeners.forEach((f) => f());
  expect(current.signal.aborted).toBe(true);
});
it("keeps an uncertain command through safe close and clears it on logout", () => {
  const a = scope();
  const first = a.command("intent", commandKey);
  a.dispose();
  const b = scope();
  expect(b.command("intent", commandKey) === first).toBe(true);
  auth.user = null;
  auth.listeners.forEach((f) => f());
  expect(b.signal.aborted).toBe(true);
  auth.user = {
    id: "owner",
    sessionId: "new-session",
    organizationId: "workspace",
    role: "CREATOR",
  };
  auth.listeners.forEach((f) => f());
  const c = scope();
  expect(c.command("intent", commandKey) === first).toBe(false);
});
it.each(Object.keys(reasonCopy))(
  "maps frozen reason %s without displaying raw server diagnostics",
  async (code) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({ code, message: "private server diagnostic" }, 409),
      ),
    );
    try {
      await fetchOpportunity(scope(), fixtureId(1));
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(CampaignError);
      expect(messageForError(error)).toBe(reasonCopy[code]);
      expect(messageForError(error)).not.toContain("private server diagnostic");
    }
  },
);
it("discards unknown error codes and rejects malformed private responses", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      json(
        {
          code: "untrusted-credential-echo",
          message: "untrusted-credential-echo",
        },
        400,
      ),
    ),
  );
  await expect(fetchOpportunity(scope(), fixtureId(1))).rejects.toHaveProperty(
    "code",
    null,
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({ ...opportunityFixture(), canApply: "true" })),
  );
  await expect(fetchOpportunity(scope(), fixtureId(1))).rejects.toHaveProperty(
    "status",
    502,
  );
});
