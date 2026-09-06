import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "../../../shared/auth/auth-session";
import { env } from "../../../shared/config/env";

export type CollaborationRealtimeEventType =
  | "thread.updated"
  | "message.created";

export type CollaborationRealtimePayload = {
  type: CollaborationRealtimeEventType;
  collaboration_id: string;
  at: string;
};

function resolveSocketBaseUrl(): string {
  return env.socketUrl;
}

export function createCollaborationSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  return io(`${resolveSocketBaseUrl()}/collaboration`, {
    auth: (callback) => {
      const currentToken = getAccessToken();
      callback(currentToken ? { token: currentToken } : {});
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });
}
