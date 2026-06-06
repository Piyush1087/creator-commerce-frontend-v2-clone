import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

import {
  createCollaborationSocket,
  type CollaborationRealtimePayload,
} from "../api/collaboration-socket-client";

type UseCollaborationRealtimeOptions = {
  enabled: boolean;
  selectedCollaborationId: string | null;
  onThreadEvent: (
    payload: CollaborationRealtimePayload,
  ) => void | Promise<void>;
  onInboxEvent: (
    payload: CollaborationRealtimePayload,
  ) => void | Promise<void>;
};

function syncCollaborationRoom(
  socket: Socket,
  joinedIdRef: { current: string | null },
  nextId: string | null,
): void {
  if (joinedIdRef.current && joinedIdRef.current !== nextId) {
    socket.emit("collaboration:leave", {
      collaboration_id: joinedIdRef.current,
    });
    joinedIdRef.current = null;
  }
  if (nextId && joinedIdRef.current !== nextId) {
    socket.emit("collaboration:join", { collaboration_id: nextId });
    joinedIdRef.current = nextId;
  }
}

export function useCollaborationRealtime({
  enabled,
  selectedCollaborationId,
  onThreadEvent,
  onInboxEvent,
}: UseCollaborationRealtimeOptions): void {
  const onThreadEventRef = useRef(onThreadEvent);
  const onInboxEventRef = useRef(onInboxEvent);
  const socketRef = useRef<Socket | null>(null);
  const joinedIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef(selectedCollaborationId);

  useEffect(() => {
    onThreadEventRef.current = onThreadEvent;
  }, [onThreadEvent]);

  useEffect(() => {
    onInboxEventRef.current = onInboxEvent;
  }, [onInboxEvent]);

  useEffect(() => {
    selectedIdRef.current = selectedCollaborationId;
  }, [selectedCollaborationId]);

  useEffect(() => {
    if (!enabled) {
      if (joinedIdRef.current && socketRef.current) {
        socketRef.current.emit("collaboration:leave", {
          collaboration_id: joinedIdRef.current,
        });
        joinedIdRef.current = null;
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = createCollaborationSocket();
    if (!socket) {
      return;
    }
    socketRef.current = socket;

    const handleThreadEvent = (payload: CollaborationRealtimePayload) => {
      void onThreadEventRef.current(payload);
    };

    const handleInboxEvent = (payload: CollaborationRealtimePayload) => {
      void onInboxEventRef.current(payload);
    };

    const handleConnect = () => {
      syncCollaborationRoom(socket, joinedIdRef, selectedIdRef.current);
    };

    socket.on("collaboration:event", handleThreadEvent);
    socket.on("collaboration:inbox", handleInboxEvent);
    socket.on("connect", handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (joinedIdRef.current) {
        socket.emit("collaboration:leave", {
          collaboration_id: joinedIdRef.current,
        });
        joinedIdRef.current = null;
      }
      socket.off("collaboration:event", handleThreadEvent);
      socket.off("collaboration:inbox", handleInboxEvent);
      socket.off("connect", handleConnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!enabled || !socket) {
      return;
    }
    syncCollaborationRoom(socket, joinedIdRef, selectedCollaborationId);
  }, [enabled, selectedCollaborationId]);
}
