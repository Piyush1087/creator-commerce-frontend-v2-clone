// @vitest-environment jsdom
import type { PropsWithChildren } from "react";
import { createElement } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChatConversation,
  getChatConversation,
  listChatConversations,
  patchChatConversation,
  postChatTurn,
} from "../api/chat-client";
import {
  CHAT_TEST_IDS,
  chatConversationFixture,
  chatMessageFixture,
  chatResponseFixture,
} from "../testing/chat-fixtures";
import type { ChatMessageRow } from "../contracts/chat.schemas";
import { useBrandChat } from "./use-brand-chat";

vi.mock("../api/chat-client", () => ({
  createChatConversation: vi.fn(),
  getChatConversation: vi.fn(),
  listChatConversations: vi.fn(),
  patchChatConversation: vi.fn(),
  postChatTurn: vi.fn(),
}));

const createMock = vi.mocked(createChatConversation);
const getMock = vi.mocked(getChatConversation);
const listMock = vi.mocked(listChatConversations);
const patchMock = vi.mocked(patchChatConversation);
const turnMock = vi.mocked(postChatTurn);

function Wrapper({ children }: PropsWithChildren) {
  return createElement(
    MemoryRouter,
    { initialEntries: ["/brand/dashboard"] },
    children,
  );
}

function detail(
  conversation = chatConversationFixture(),
  messages: ChatMessageRow[] = [],
) {
  return { conversation, messages };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("useBrandChat", () => {
  it("selects only the latest GLOBAL conversation and never mutates legacy history", async () => {
    const global = chatConversationFixture();
    const legacy = chatConversationFixture({
      id: CHAT_TEST_IDS.legacyConversation,
      scopeContext: "BRAND_CENTRE",
      title: "Legacy action thread",
    });
    listMock.mockResolvedValueOnce([global, legacy]);
    getMock.mockResolvedValueOnce(detail(global, [chatMessageFixture()]));

    const { result } = renderHook(() => useBrandChat(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversations).toEqual([global]);
    expect(result.current.activeConversationId).toBe(global.id);
    expect(createMock).not.toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it("creates a GLOBAL conversation when only legacy scope remains", async () => {
    const legacy = chatConversationFixture({
      id: CHAT_TEST_IDS.legacyConversation,
      scopeContext: "BRAND_CENTRE",
    });
    const created = chatConversationFixture();
    listMock.mockResolvedValueOnce([legacy]);
    createMock.mockResolvedValueOnce(created);
    getMock.mockResolvedValueOnce(detail(created));

    const { result } = renderHook(() => useBrandChat(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(result.current.activeConversationId).toBe(created.id),
    );

    expect(createMock).toHaveBeenCalledWith({});
    expect(getMock).toHaveBeenCalledWith(created.id);
    expect(patchMock).not.toHaveBeenCalledWith(legacy.id, expect.anything());
  });

  it("selects an earlier permanent conversation", async () => {
    const first = chatConversationFixture();
    const second = chatConversationFixture({
      id: CHAT_TEST_IDS.secondConversation,
      title: "Campaigns",
    });
    listMock.mockResolvedValueOnce([first, second]);
    getMock
      .mockResolvedValueOnce(detail(first))
      .mockResolvedValueOnce(detail(second));
    const { result } = renderHook(() => useBrandChat(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(result.current.activeConversationId).toBe(first.id),
    );

    await act(() => result.current.selectConversation(second.id));
    expect(result.current.activeConversationId).toBe(second.id);
    expect(getMock).toHaveBeenLastCalledWith(second.id);
  });

  it("archives with PATCH semantics and selects the next GLOBAL conversation", async () => {
    const first = chatConversationFixture();
    const second = chatConversationFixture({
      id: CHAT_TEST_IDS.secondConversation,
      title: "Campaigns",
    });
    listMock.mockResolvedValueOnce([first, second]);
    getMock
      .mockResolvedValueOnce(detail(first))
      .mockResolvedValueOnce(detail(second));
    patchMock.mockResolvedValueOnce(
      chatConversationFixture({ archivedAt: "2026-09-01T10:00:00.000Z" }),
    );
    const { result } = renderHook(() => useBrandChat(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(result.current.activeConversationId).toBe(first.id),
    );

    await act(() => result.current.archiveConversation(first.id));
    expect(patchMock).toHaveBeenCalledWith(first.id, { archived: true });
    expect(result.current.activeConversationId).toBe(second.id);
    expect(result.current.conversations).toEqual([second]);
  });

  it("sends a bounded Home turn and renders the validated persisted response", async () => {
    const global = chatConversationFixture();
    listMock.mockResolvedValueOnce([global]);
    getMock.mockResolvedValueOnce(detail(global));
    turnMock.mockResolvedValueOnce(chatResponseFixture());
    const { result } = renderHook(() => useBrandChat(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPromptInput("What Campaigns do I have?"));
    await act(() => result.current.submitPrompt());

    expect(turnMock).toHaveBeenCalledWith(global.id, {
      message: "What Campaigns do I have?",
      surface: "HOME",
      routePath: "/brand/dashboard",
    });
    expect(result.current.promptInput).toBe("");
    expect(result.current.messages.map((message) => message.kind)).toEqual([
      "USER",
      "ASSISTANT_GROUNDED",
    ]);
  });

  it("reconciles a failed optimistic message and keeps the prompt for retry", async () => {
    const global = chatConversationFixture();
    listMock.mockResolvedValueOnce([global]);
    getMock.mockResolvedValueOnce(detail(global));
    turnMock.mockRejectedValueOnce(new Error("Request failed (429)."));
    const { result } = renderHook(() => useBrandChat(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPromptInput("Try this once"));
    await act(() => result.current.submitPrompt());

    expect(result.current.messages).toEqual([]);
    expect(result.current.promptInput).toBe("Try this once");
    expect(result.current.error).toBe("Request failed (429).");
    expect(turnMock).toHaveBeenCalledTimes(1);
  });
});
