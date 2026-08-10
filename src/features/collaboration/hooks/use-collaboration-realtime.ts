import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { createCollaborationSocket, type CollaborationRealtimePayload } from "../api/collaboration-socket-client";

type Options = { enabled: boolean; selectedCollaborationId: string | null; onThreadEvent: (payload: CollaborationRealtimePayload) => void | Promise<void>; onInboxEvent: (payload: CollaborationRealtimePayload) => void | Promise<void>; onReconnect?: () => void | Promise<void> };
export type CollaborationRealtimeStatus = "disabled" | "connected" | "degraded";

function syncRoom(socket: Socket, joined: { current: string | null }, next: string | null) {
  if (joined.current && joined.current !== next) { socket.emit("collaboration:leave", { collaboration_id: joined.current }); joined.current = null; }
  if (next && joined.current !== next) { socket.emit("collaboration:join", { collaboration_id: next }); joined.current = next; }
}

export function useCollaborationRealtime({ enabled, selectedCollaborationId, onThreadEvent, onInboxEvent, onReconnect }: Options): CollaborationRealtimeStatus {
  const [status, setStatus] = useState<CollaborationRealtimeStatus>(enabled ? "degraded" : "disabled");
  const handlers = useRef({ onThreadEvent, onInboxEvent, onReconnect });
  const socketRef = useRef<Socket | null>(null);
  const joined = useRef<string | null>(null);
  const selected = useRef(selectedCollaborationId);
  useEffect(() => { handlers.current = { onThreadEvent, onInboxEvent, onReconnect }; }, [onThreadEvent, onInboxEvent, onReconnect]);
  useEffect(() => { selected.current = selectedCollaborationId; if (socketRef.current) syncRoom(socketRef.current, joined, selectedCollaborationId); }, [selectedCollaborationId]);
  useEffect(() => {
    if (!enabled) { setStatus("disabled"); return; }
    const socket = createCollaborationSocket();
    if (!socket) { setStatus("degraded"); return; }
    socketRef.current = socket;
    const thread = (payload: CollaborationRealtimePayload) => void handlers.current.onThreadEvent(payload);
    const inbox = (payload: CollaborationRealtimePayload) => void handlers.current.onInboxEvent(payload);
    const connect = () => { const wasDegraded = status === "degraded"; setStatus("connected"); syncRoom(socket, joined, selected.current); if (wasDegraded) void handlers.current.onReconnect?.(); };
    const disconnect = () => setStatus("degraded");
    socket.on("collaboration:event", thread); socket.on("collaboration:inbox", inbox); socket.on("connect", connect); socket.on("disconnect", disconnect);
    if (socket.connected) connect(); else setStatus("degraded");
    return () => { if (joined.current) socket.emit("collaboration:leave", { collaboration_id: joined.current }); joined.current = null; socket.off("collaboration:event", thread); socket.off("collaboration:inbox", inbox); socket.off("connect", connect); socket.off("disconnect", disconnect); socket.disconnect(); socketRef.current = null; };
  }, [enabled]);
  return status;
}
