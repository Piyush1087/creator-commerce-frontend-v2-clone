import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  buildChatTurnRequest,
  createChatConversation,
  getChatConversation,
  listChatConversations,
  patchChatConversation,
  postChatTurn,
} from "./chat-client";
import {
  CHAT_TEST_IDS,
  chatConversationFixture,
  chatMessageFixture,
  chatResponseFixture,
} from "../testing/chat-fixtures";

vi.mock("../../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));

const fetchMock = vi.mocked(authenticatedFetch);
const base = `${env.apiUrl}/api/v1/chat/conversations`;

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestBody(callIndex: number): unknown {
  const init = fetchMock.mock.calls[callIndex]?.[1];
  return JSON.parse(String(init?.body)) as unknown;
}

beforeEach(() => fetchMock.mockReset());

describe("permanent Chat API client", () => {
  it("creates a conversation with the exact direct-response contract", async () => {
    const conversation = chatConversationFixture();
    fetchMock.mockResolvedValueOnce(response(conversation));
    await expect(createChatConversation()).resolves.toEqual(conversation);
    expect(fetchMock).toHaveBeenCalledWith(base, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
  });

  it("lists conversations as a direct array with bounded query parameters", async () => {
    fetchMock.mockResolvedValueOnce(response([chatConversationFixture()]));
    await expect(
      listChatConversations({ limit: 100, includeArchived: false }),
    ).resolves.toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${base}?limit=100&includeArchived=false`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });

  it("gets conversation detail from the exact permanent route", async () => {
    const detail = {
      conversation: chatConversationFixture(),
      messages: [chatMessageFixture()],
    };
    fetchMock.mockResolvedValueOnce(response(detail));
    await expect(
      getChatConversation(CHAT_TEST_IDS.conversation),
    ).resolves.toEqual(detail);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${base}/${CHAT_TEST_IDS.conversation}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });

  it("archives through PATCH metadata and never calls DELETE", async () => {
    const archived = chatConversationFixture({
      archivedAt: "2026-09-01T09:00:00.000Z",
    });
    fetchMock.mockResolvedValueOnce(response(archived));
    await expect(
      patchChatConversation(CHAT_TEST_IDS.conversation, { archived: true }),
    ).resolves.toEqual(archived);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("PATCH");
    expect(requestBody(0)).toEqual({ archived: true });
  });

  it("posts the exact Home turn body and validates the grounded response", async () => {
    const grounded = chatResponseFixture();
    fetchMock.mockResolvedValueOnce(response(grounded));
    await expect(
      postChatTurn(CHAT_TEST_IDS.conversation, {
        message: "What Campaigns do I have?",
        surface: "HOME",
        routePath: "/brand/dashboard",
      }),
    ).resolves.toEqual(grounded);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${base}/${CHAT_TEST_IDS.conversation}/turns`,
    );
    expect(requestBody(0)).toEqual({
      message: "What Campaigns do I have?",
      surface: "HOME",
      routePath: "/brand/dashboard",
    });
  });

  it.each([
    "userId",
    "brandId",
    "brandProfileId",
    "organizationId",
    "role",
    "membershipRole",
    "allowedCapabilityIds",
    "authorizedEntityRefs",
    "capabilityResults",
    "grounding",
    "providerToken",
    "accessToken",
    "apiKey",
  ])(
    "rejects authority field %s before a turn request can be sent",
    (field) => {
      expect(() =>
        buildChatTurnRequest({
          message: "Tell me about my Brand",
          surface: "HOME",
          [field]: "attacker-controlled",
        }),
      ).toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("fails closed instead of trusting an invalid server answer", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        ...chatResponseFixture(),
        contractVersion: "untrusted",
        answer: "Fabricated answer",
      }),
    );
    await expect(
      postChatTurn(CHAT_TEST_IDS.conversation, {
        message: "Tell me something",
      }),
    ).rejects.toThrow("invalid Chat turn response");
  });
});
