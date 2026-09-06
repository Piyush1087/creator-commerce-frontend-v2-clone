import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AUTH_ROUTES } from "../../auth/constants";
import { resolveSafeInternalPath } from "../../../shared/navigation/safe-internal-path";
import {
  createChatConversation,
  getChatConversation,
  listChatConversations,
  patchChatConversation,
  postChatTurn,
} from "../api/chat-client";
import {
  mapChatMessageRows,
  type ChatDisplayMessage,
} from "../contracts/chat.contracts";
import type { ChatConversation } from "../contracts/chat.schemas";
import { resolveChatNavigation } from "../navigation/chat-navigation";

const DEFAULT_ERROR = "Creator Shop Chat is temporarily unavailable.";

export function filterGlobalConversations(
  conversations: readonly ChatConversation[],
): ChatConversation[] {
  return conversations.filter(
    (conversation) =>
      conversation.scopeContext === "GLOBAL" && !conversation.archivedAt,
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : DEFAULT_ERROR;
}

export function useBrandChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatDisplayMessage[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [archivingConversationId, setArchivingConversationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationDrawerOpen, setConversationDrawerOpen] = useState(false);
  const loadSequence = useRef(0);
  const optimisticSequence = useRef(0);

  const loadConversation = useCallback(async (conversationId: string) => {
    const sequence = ++loadSequence.current;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await getChatConversation(conversationId);
      if (detail.conversation.scopeContext !== "GLOBAL") {
        throw new Error(
          "This conversation is not available in permanent Chat.",
        );
      }
      if (sequence !== loadSequence.current) return;
      setActiveConversationId(detail.conversation.id);
      setMessages(mapChatMessageRows(detail.messages));
    } catch (loadError) {
      if (sequence !== loadSequence.current) return;
      setError(errorMessage(loadError));
    } finally {
      if (sequence === loadSequence.current) setIsLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(async () => {
    setIsCreatingConversation(true);
    setError(null);
    try {
      const created = await createChatConversation({});
      if (created.scopeContext !== "GLOBAL") {
        throw new Error("Creator Shop returned a non-Chat conversation.");
      }
      setConversations((current) => [
        created,
        ...current.filter((conversation) => conversation.id !== created.id),
      ]);
      await loadConversation(created.id);
      setConversationDrawerOpen(false);
      return created;
    } catch (createError) {
      setError(errorMessage(createError));
      return null;
    } finally {
      setIsCreatingConversation(false);
    }
  }, [loadConversation]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const listed = filterGlobalConversations(
          await listChatConversations({ limit: 100 }),
        );
        if (cancelled) return;
        setConversations(listed);
        if (listed[0]) {
          await loadConversation(listed[0].id);
          return;
        }
        await createNewConversation();
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(errorMessage(bootstrapError));
          setIsLoading(false);
        }
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
      loadSequence.current += 1;
    };
  }, [createNewConversation, loadConversation]);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (
        isSending ||
        !conversations.some(
          (conversation) => conversation.id === conversationId,
        )
      ) {
        return;
      }
      await loadConversation(conversationId);
      setConversationDrawerOpen(false);
    },
    [conversations, isSending, loadConversation],
  );

  const archiveConversation = useCallback(
    async (conversationId: string) => {
      if (isSending) return;
      setArchivingConversationId(conversationId);
      setError(null);
      try {
        await patchChatConversation(conversationId, { archived: true });
        const remaining = conversations.filter(
          (conversation) => conversation.id !== conversationId,
        );
        setConversations(remaining);
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
          setMessages([]);
          if (remaining[0]) await loadConversation(remaining[0].id);
          else await createNewConversation();
        }
      } catch (archiveError) {
        setError(errorMessage(archiveError));
      } finally {
        setArchivingConversationId(null);
      }
    },
    [
      activeConversationId,
      conversations,
      createNewConversation,
      isSending,
      loadConversation,
    ],
  );

  const submitPrompt = useCallback(async () => {
    const message = promptInput.trim();
    if (!message || !activeConversationId || isSending || isLoading) return;

    const optimisticId = `optimistic-${++optimisticSequence.current}`;
    const optimistic: ChatDisplayMessage = {
      kind: "USER",
      id: optimisticId,
      text: message,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((current) => [...current, optimistic]);
    setIsSending(true);
    setError(null);

    let response;
    try {
      response = await postChatTurn(activeConversationId, {
        message,
        surface: "HOME",
        routePath: resolveSafeInternalPath(
          location.pathname,
          AUTH_ROUTES.brandDashboard,
        ),
      });
    } catch (turnError) {
      setMessages((current) =>
        current.filter((item) => item.id !== optimisticId),
      );
      setError(errorMessage(turnError));
      setIsSending(false);
      return;
    }

    const now = new Date().toISOString();
    setMessages((current) => [
      ...current.map((item) =>
        item.id === optimisticId ? { ...item, optimistic: false } : item,
      ),
      {
        kind: "ASSISTANT_GROUNDED",
        id: `response-${optimisticSequence.current}`,
        response,
        createdAt: now,
      },
    ]);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversationId
          ? { ...conversation, lastMessageAt: now }
          : conversation,
      ),
    );
    setPromptInput("");
    setIsSending(false);

    if (response.status === "NAVIGATION" && response.navigation) {
      try {
        navigate(resolveChatNavigation(response.navigation));
      } catch (navigationError) {
        setError(errorMessage(navigationError));
      }
    }
  }, [
    activeConversationId,
    isLoading,
    isSending,
    location.pathname,
    navigate,
    promptInput,
  ]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );

  return {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    promptInput,
    setPromptInput,
    isLoading,
    isSending,
    isCreatingConversation,
    archivingConversationId,
    error,
    conversationDrawerOpen,
    setConversationDrawerOpen,
    createNewConversation,
    selectConversation,
    archiveConversation,
    submitPrompt,
  };
}

export type BrandChatController = ReturnType<typeof useBrandChat>;
