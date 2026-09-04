import type { Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  clearAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import { env } from "../../../shared/config/env";
import { createCollaborationSocket } from "./collaboration-socket-client";

const mocks = vi.hoisted(() => ({ io: vi.fn() }));
vi.mock("socket.io-client", () => ({ io: mocks.io }));

const session = {
  accessToken: "access-fixture",
  accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "user-1",
    email: "creator@example.test",
    name: "Creator",
    role: "CREATOR",
  },
};

beforeEach(() => {
  resetAuthSessionForTests();
  clearAuthSession();
  mocks.io.mockReset();
});
afterEach(() => clearAuthSession());

describe("Collaboration realtime socket", () => {
  it("does not create a connection without an authenticated access token", () => {
    expect(createCollaborationSocket()).toBeNull();
    expect(mocks.io).not.toHaveBeenCalled();
  });

  it("uses the fixed Collaboration namespace and current token callback", () => {
    const socket = {} as Socket;
    mocks.io.mockReturnValue(socket);
    adoptAuthSession(session);

    expect(createCollaborationSocket()).toBe(socket);
    expect(mocks.io).toHaveBeenCalledTimes(1);
    const [url, options] = mocks.io.mock.calls[0] as [
      string,
      {
        auth: (callback: (credentials: { token?: string }) => void) => void;
        transports: string[];
        reconnection: boolean;
      },
    ];
    expect(url).toBe(`${env.socketUrl}/collaboration`);
    expect(options.transports).toEqual(["websocket", "polling"]);
    expect(options.reconnection).toBe(true);

    const callback = vi.fn();
    options.auth(callback);
    expect(callback).toHaveBeenCalledWith({ token: "access-fixture" });
  });
});
