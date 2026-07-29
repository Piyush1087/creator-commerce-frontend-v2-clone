import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  archiveCoPilotThread,
  discardCoPilotHitl,
  createCoPilotThread,
  fetchCoPilotThread,
  fetchCoPilotThreads,
  fetchCoPilotUsage,
  postCoPilotMessage,
  streamCoPilotHitlConfirm,
  streamCoPilotMessage,
  submitCoPilotFeedback,
} from "../api/co-pilot-client";
import { BRAND_CO_PILOT_INTENT_TEMPLATES } from "../brand/brand-co-pilot-config";
import type {
  CoPilotMessageRow,
  CoPilotScopeContext,
  CoPilotThreadRow,
  CoPilotUsageSnapshot,
} from "../contracts/co-pilot.contracts";
import { CoPilotChatPayloadSchema } from "../schemas/co-pilot-payload.schema";
import type { CoPilotChatPayload } from "../schemas/co-pilot-payload.schema";
import type {
  CoPilotFeedMessage,
  CoPilotIntentTemplate,
  CoPilotThreadStub,
} from "../types";
import { groupCoPilotThreads } from "../utils/thread-grouping";
import {
  applyHitlResolutionToMessages,
  extractResolvedHitlKeys,
  findPendingAutoResumeValidation,
  findPendingHitlWidget,
} from "../utils/hitl-message-state";

const RAIL_THREAD_LIMIT = 30;
const VIEW_ALL_LIMIT = 100;

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

function mapThreadRow(row: CoPilotThreadRow): CoPilotThreadStub {
  return {
    threadId: row.threadId,
    title: row.title,
    lastActiveLabel: formatRelativeTime(row.lastMessageAt),
    scopeContext: row.scopeContext as CoPilotThreadStub["scopeContext"],
  };
}

function mapAssistantPayload(row: CoPilotMessageRow): CoPilotChatPayload {
  const parsed = CoPilotChatPayloadSchema.safeParse(row.payload);
  if (parsed.success) {
    return parsed.data;
  }
  return {
    messageId: row.id,
    threadId: row.threadId,
    timestamp: row.createdAt,
    formatType: "CONVERSATIONAL_NARRATIVE",
    narrativeText: row.textContent ?? "Unable to render assistant response.",
  };
}

function mapMessageRow(row: CoPilotMessageRow): CoPilotFeedMessage | null {
  if (row.role === "USER") {
    return {
      id: row.id,
      sender: "USER",
      text: row.textContent ?? "",
      timestamp: row.createdAt,
    };
  }
  if (row.role !== "ASSISTANT") {
    return null;
  }
  return {
    id: row.id,
    sender: "COPILOT_AGENT",
    payload: mapAssistantPayload(row),
  };
}

function applyMessageResult(
  prev: CoPilotFeedMessage[],
  optimisticUserId: string,
  result: {
    userMessage: CoPilotMessageRow;
    assistantMessage: CoPilotMessageRow;
  },
  skipUserMessage = false,
): CoPilotFeedMessage[] {
  const withoutOptimistic = optimisticUserId
    ? prev.filter((m) => m.id !== optimisticUserId)
    : prev;
  const user = skipUserMessage ? null : mapMessageRow(result.userMessage);
  const assistant = mapMessageRow(result.assistantMessage);
  return [
    ...withoutOptimistic,
    ...(user ? [user] : []),
    ...(assistant ? [assistant] : []),
  ];
}

export function useBrandCoPilot() {
  const [threads, setThreads] = useState<CoPilotThreadStub[]>([]);
  const [threadTimestamps, setThreadTimestamps] = useState<Record<string, string>>({});
  const [showAllThreads, setShowAllThreads] = useState(false);
  const [allThreads, setAllThreads] = useState<CoPilotThreadStub[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeScope, setActiveScope] = useState<CoPilotScopeContext>("BRAND_CENTRE");
  const [messages, setMessages] = useState<CoPilotFeedMessage[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [pendingDeleteThread, setPendingDeleteThread] = useState<{
    threadId: string;
    title: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamingNarrative, setStreamingNarrative] = useState<string | null>(null);
  const [resolvedHitlKeys, setResolvedHitlKeys] = useState<Set<string>>(() => new Set());
  const [hitlBusyKey, setHitlBusyKey] = useState<string | null>(null);
  /** One silent Part 5 resume attempt per idempotency key per page lifetime. */
  const silentResumeAttemptedRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef(messages);
  const resolvedHitlKeysRef = useRef(resolvedHitlKeys);
  const hitlBusyKeyRef = useRef(hitlBusyKey);
  const activeThreadIdRef = useRef(activeThreadId);

  messagesRef.current = messages;
  resolvedHitlKeysRef.current = resolvedHitlKeys;
  hitlBusyKeyRef.current = hitlBusyKey;
  activeThreadIdRef.current = activeThreadId;

  const pendingHitlWidget = useMemo(
    () => findPendingHitlWidget(messages, resolvedHitlKeys),
    [messages, resolvedHitlKeys],
  );
  const [usage, setUsage] = useState<CoPilotUsageSnapshot | null>(null);

  const refreshUsage = useCallback(async () => {
    try {
      setUsage(await fetchCoPilotUsage());
    } catch {
      /* non-blocking */
    }
  }, []);

  const applyThreadRows = useCallback((rows: CoPilotThreadRow[]) => {
    setThreads(rows.slice(0, RAIL_THREAD_LIMIT).map(mapThreadRow));
    setThreadTimestamps(
      Object.fromEntries(rows.map((row) => [row.threadId, row.lastMessageAt])),
    );
  }, []);

  const loadThread = useCallback(async (threadId: string) => {
    const detail = await fetchCoPilotThread(threadId);
    setActiveThreadId(threadId);
    setActiveScope(detail.thread.scopeContext);
    const feedMessages = detail.messages
      .map(mapMessageRow)
      .filter((message): message is CoPilotFeedMessage => message !== null);
    setMessages(feedMessages);
    setResolvedHitlKeys(extractResolvedHitlKeys(feedMessages));
  }, []);

  const refreshThreadList = useCallback(async () => {
    const refreshedThreads = await fetchCoPilotThreads(RAIL_THREAD_LIMIT);
    applyThreadRows(refreshedThreads);
  }, [applyThreadRows]);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await refreshUsage();
      let rows = await fetchCoPilotThreads(RAIL_THREAD_LIMIT);
      if (rows.length === 0) {
        const created = await createCoPilotThread();
        rows = [created.thread];
        setActiveThreadId(created.thread.threadId);
        setMessages(
          created.messages
            .map(mapMessageRow)
            .filter((message): message is CoPilotFeedMessage => message !== null),
        );
      } else {
        await loadThread(rows[0].threadId);
      }
      applyThreadRows(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load co-pilot.");
    } finally {
      setIsLoading(false);
    }
  }, [applyThreadRows, loadThread, refreshUsage]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const groupedThreads = useMemo(
    () => groupCoPilotThreads(threads, threadTimestamps),
    [threadTimestamps, threads],
  );

  const groupedAllThreads = useMemo(
    () => groupCoPilotThreads(allThreads, threadTimestamps),
    [allThreads, threadTimestamps],
  );

  const openViewAllThreads = useCallback(async () => {
    const rows = await fetchCoPilotThreads(VIEW_ALL_LIMIT);
    setAllThreads(rows.map(mapThreadRow));
    setThreadTimestamps((prev) => ({
      ...prev,
      ...Object.fromEntries(rows.map((row) => [row.threadId, row.lastMessageAt])),
    }));
    setShowAllThreads(true);
  }, []);

  const applyIntentTemplate = useCallback((template: CoPilotIntentTemplate) => {
    setPromptInput(template.templateString);
    setActiveScope(template.associatedScope);
  }, []);

  const selectThread = useCallback(
    async (threadId: string) => {
      if (threadId === activeThreadId) {
        return;
      }
      setShowAllThreads(false);
      setError(null);
      try {
        await loadThread(threadId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load thread.");
      }
    },
    [activeThreadId, loadThread],
  );

  const createNewThread = useCallback(async () => {
    if (isCreatingThread) {
      return;
    }
    setIsCreatingThread(true);
    setError(null);
    try {
      const created = await createCoPilotThread(activeScope);
      setThreads((prev) => [mapThreadRow(created.thread), ...prev]);
      setThreadTimestamps((prev) => ({
        ...prev,
        [created.thread.threadId]: created.thread.lastMessageAt,
      }));
      setActiveThreadId(created.thread.threadId);
      setResolvedHitlKeys(new Set());
      setMessages(
        created.messages
          .map(mapMessageRow)
          .filter((message): message is CoPilotFeedMessage => message !== null),
      );
      setPromptInput("");
      setShowAllThreads(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create thread.");
    } finally {
      setIsCreatingThread(false);
    }
  }, [activeScope, isCreatingThread]);

  const requestDeleteThread = useCallback(
    (threadId: string) => {
      if (deletingThreadId) {
        return;
      }

      const thread =
        threads.find((item) => item.threadId === threadId) ??
        allThreads.find((item) => item.threadId === threadId);

      setPendingDeleteThread({
        threadId,
        title: thread?.title ?? "This conversation",
      });
    },
    [allThreads, deletingThreadId, threads],
  );

  const cancelDeleteThread = useCallback(() => {
    if (deletingThreadId) {
      return;
    }
    setPendingDeleteThread(null);
  }, [deletingThreadId]);

  const confirmDeleteThread = useCallback(async () => {
    if (!pendingDeleteThread || deletingThreadId) {
      return;
    }

    const { threadId } = pendingDeleteThread;
    setDeletingThreadId(threadId);
    setError(null);

    try {
      await archiveCoPilotThread(threadId);
      setPendingDeleteThread(null);

      let nextThreadId: string | null = null;
      setThreads((prev) => {
        const next = prev.filter((thread) => thread.threadId !== threadId);
        if (activeThreadId === threadId) {
          nextThreadId = next[0]?.threadId ?? null;
        }
        return next;
      });
      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== threadId),
      );
      setThreadTimestamps((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });

      if (activeThreadId === threadId) {
        if (nextThreadId) {
          await loadThread(nextThreadId);
        } else {
          await createNewThread();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete conversation.");
    } finally {
      setDeletingThreadId(null);
    }
  }, [
    activeThreadId,
    createNewThread,
    deletingThreadId,
    loadThread,
    pendingDeleteThread,
  ]);

  const sendMessage = useCallback(
    async (
      text: string,
      options?: {
        slotValues?: Record<string, string>;
        useStream?: boolean;
        suppressUserBubble?: boolean;
      },
    ) => {
      if (!activeThreadId || usage?.canSend === false) {
        return;
      }

      if (!options?.slotValues && findPendingHitlWidget(messages, resolvedHitlKeys)) {
        return;
      }

      const trimmed = text.trim();
      if (!trimmed && !options?.slotValues) {
        return;
      }

      setIsSending(true);
      setError(null);
      setStreamingNarrative(null);

      const optimisticUser: CoPilotFeedMessage | null = options?.suppressUserBubble
        ? null
        : {
            id: `pending-user-${Date.now()}`,
            sender: "USER",
            text: trimmed,
            timestamp: new Date().toISOString(),
          };
      if (optimisticUser) {
        setMessages((prev) => [...prev, optimisticUser]);
      }

      try {
        const useStream = options?.useStream ?? !options?.slotValues;
        // Slot continues need a non-empty text for older validators; prefer "Continue".
        const requestText =
          trimmed || (options?.slotValues ? "Continue" : "");
        const result = useStream
          ? await streamCoPilotMessage(activeThreadId, requestText, {
              scopeContext: activeScope,
              slotValues: options?.slotValues,
              onNarrativeDelta: (delta) => {
                setStreamingNarrative((prev) => `${prev ?? ""}${delta}`);
              },
            })
          : await postCoPilotMessage(activeThreadId, requestText, {
              scopeContext: activeScope,
              slotValues: options?.slotValues,
            });

        setMessages((prev) =>
          applyMessageResult(
            prev,
            optimisticUser?.id ?? "",
            result,
            !optimisticUser,
          ),
        );
        setStreamingNarrative(null);
        await refreshThreadList();
        await refreshUsage();
      } catch (e) {
        if (optimisticUser) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        }
        setStreamingNarrative(null);
        setError(e instanceof Error ? e.message : "Failed to send message.");
        throw e;
      } finally {
        setIsSending(false);
      }
    },
    [
      activeScope,
      activeThreadId,
      messages,
      refreshThreadList,
      refreshUsage,
      resolvedHitlKeys,
      usage?.canSend,
    ],
  );

  const submitPrompt = useCallback(async () => {
    const trimmed = promptInput.trim();
    if (!trimmed || isSending || !activeThreadId) {
      return;
    }
    setPromptInput("");
    try {
      await sendMessage(trimmed, { useStream: true });
    } catch {
      setPromptInput(trimmed);
    }
  }, [activeThreadId, isSending, promptInput, sendMessage]);

  const submitSlotValues = useCallback(
    async (slotValues: Record<string, string>) => {
      if (isSending || !activeThreadId) {
        return;
      }
      try {
        await sendMessage("", {
          slotValues,
          useStream: false,
          suppressUserBubble: true,
        });
      } catch {
        /* surfaced via error state */
      }
    },
    [activeThreadId, isSending, sendMessage],
  );

  const submitFeedback = useCallback(
    async (args: {
      messageId: string;
      threadId: string;
      rating: "THUMBS_UP" | "THUMBS_DOWN";
      reason?: string;
    }) => {
      await submitCoPilotFeedback(args);
    },
    [],
  );

  const confirmHitl = useCallback(
    async (idempotencyKey: string) => {
      if (!activeThreadId || hitlBusyKey) {
        return;
      }
      setHitlBusyKey(idempotencyKey);
      setError(null);
      setStreamingNarrative(null);
      try {
        const streamResult = await streamCoPilotHitlConfirm(
          {
            threadId: activeThreadId,
            idempotencyKey,
          },
          {
            onJobStatus: (message) => {
              setStreamingNarrative(message);
            },
          },
        );

        if (streamResult.hitlResolution) {
          setMessages((prev) =>
            applyHitlResolutionToMessages(
              prev,
              idempotencyKey,
              streamResult.hitlResolution!,
            ),
          );
        }

        if (streamResult.followUpPayload) {
          setMessages((prev) => [
            ...prev,
            {
              id: streamResult.followUpPayload!.messageId,
              sender: "COPILOT_AGENT",
              payload: streamResult.followUpPayload!,
            },
          ]);
        }

        // Only lock the HITL card when the action actually confirmed.
        if (streamResult.hitlResolution?.status === "CONFIRMED") {
          setResolvedHitlKeys((prev) => new Set(prev).add(idempotencyKey));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to confirm action.");
      } finally {
        setHitlBusyKey(null);
        setStreamingNarrative(null);
      }
    },
    [activeThreadId, hitlBusyKey],
  );

  const confirmHitlRef = useRef(confirmHitl);
  confirmHitlRef.current = confirmHitl;

  /**
   * Part 5 — when the user returns to chat after fixing a blocker (deep link),
   * silently re-call the same HITL confirm once. No toast; no backend changes;
   * does not alter HITL decision rules — only advances UI if prerequisites pass.
   */
  const trySilentAutoResume = useCallback(() => {
    if (!activeThreadIdRef.current || hitlBusyKeyRef.current) {
      return;
    }
    const pending = findPendingAutoResumeValidation(
      messagesRef.current,
      resolvedHitlKeysRef.current,
    );
    if (!pending) {
      return;
    }
    if (silentResumeAttemptedRef.current.has(pending.idempotencyKey)) {
      return;
    }
    silentResumeAttemptedRef.current.add(pending.idempotencyKey);
    void confirmHitlRef.current(pending.idempotencyKey);
  }, []);

  // Entering / re-entering co-pilot (mount or thread finished loading).
  useEffect(() => {
    if (isLoading || !activeThreadId) {
      return;
    }
    const timer = window.setTimeout(() => {
      trySilentAutoResume();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isLoading, activeThreadId, trySilentAutoResume]);

  // Returning to the tab after fixing blockers elsewhere.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        trySilentAutoResume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [trySilentAutoResume]);

  const discardHitl = useCallback(
    async (idempotencyKey: string) => {
      if (!activeThreadId || hitlBusyKey) {
        return;
      }
      setHitlBusyKey(idempotencyKey);
      setError(null);
      try {
        const response = await discardCoPilotHitl({
          threadId: activeThreadId,
          idempotencyKey,
        });
        if (response.hitlResolution) {
          setMessages((prev) =>
            applyHitlResolutionToMessages(
              prev,
              idempotencyKey,
              response.hitlResolution!,
            ),
          );
        }
        setResolvedHitlKeys((prev) => new Set(prev).add(idempotencyKey));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to discard draft.");
      } finally {
        setHitlBusyKey(null);
      }
    },
    [activeThreadId, hitlBusyKey],
  );

  return {
    activeScope,
    activeThreadId,
    applyIntentTemplate,
    cancelDeleteThread,
    confirmDeleteThread,
    confirmHitl,
    createNewThread,
    deletingThreadId,
    discardHitl,
    error,
    groupedAllThreads,
    groupedThreads,
    hitlBusyKey,
    intentTemplates: BRAND_CO_PILOT_INTENT_TEMPLATES,
    pendingHitlWidget,
    isCreatingThread,
    isLoading,
    isSending,
    messages,
    openViewAllThreads,
    pendingDeleteThread,
    promptInput,
    requestDeleteThread,
    resolvedHitlKeys,
    selectThread,
    setActiveScope,
    setPromptInput,
    setShowAllThreads,
    showAllThreads,
    streamingNarrative,
    submitFeedback,
    submitPrompt,
    submitSlotValues,
    threads,
    usage,
  };
}
