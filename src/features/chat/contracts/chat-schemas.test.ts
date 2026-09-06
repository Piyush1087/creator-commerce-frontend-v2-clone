import { describe, expect, it } from "vitest";

import { mapChatMessageRows } from "./chat.contracts";
import {
  CHAT_RESPONSE_STATUSES,
  ChatConversationDetailSchema,
  ChatConversationListSchema,
  ChatGroundedResponseSchema,
  ChatNavigationSchema,
} from "./chat.schemas";
import {
  CHAT_TEST_IDS,
  chatConversationFixture,
  chatMessageFixture,
  chatResponseFixture,
} from "../testing/chat-fixtures";

describe("permanent Chat contracts", () => {
  it("validates direct conversation list and detail responses", () => {
    const conversation = chatConversationFixture();
    expect(ChatConversationListSchema.parse([conversation])).toEqual([
      conversation,
    ]);
    expect(
      ChatConversationDetailSchema.parse({
        conversation,
        messages: [chatMessageFixture()],
      }).messages,
    ).toHaveLength(1);
  });

  it.each(CHAT_RESPONSE_STATUSES)("accepts status %s", (status) => {
    const navigation =
      status === "NAVIGATION"
        ? { destinationId: "CAMPAIGNS" as const }
        : undefined;
    expect(
      ChatGroundedResponseSchema.parse(
        chatResponseFixture({ status, navigation }),
      ).status,
    ).toBe(status);
  });

  it("rejects unknown versions, statuses, and non-read-only recommendations", () => {
    expect(
      ChatGroundedResponseSchema.safeParse({
        ...chatResponseFixture(),
        contractVersion: "2.0",
      }).success,
    ).toBe(false);
    expect(
      ChatGroundedResponseSchema.safeParse({
        ...chatResponseFixture(),
        status: "EXECUTED",
      }).success,
    ).toBe(false);
    expect(
      ChatGroundedResponseSchema.safeParse({
        ...chatResponseFixture(),
        recommendation: {
          text: "Change the Campaign",
          basisRefs: [],
          nonMutating: false,
        },
      }).success,
    ).toBe(false);
  });

  it("rejects missing, unexpected, unknown, and mismatched navigation", () => {
    expect(
      ChatGroundedResponseSchema.safeParse(
        chatResponseFixture({ status: "NAVIGATION" }),
      ).success,
    ).toBe(false);
    expect(
      ChatGroundedResponseSchema.safeParse({
        ...chatResponseFixture(),
        navigation: { destinationId: "HOME" },
      }).success,
    ).toBe(false);
    expect(
      ChatNavigationSchema.safeParse({ destinationId: "MARKETPLACE" }).success,
    ).toBe(false);
    expect(
      ChatNavigationSchema.safeParse({
        destinationId: "CAMPAIGNS",
        entityRef: { type: "OFFERING", id: CHAT_TEST_IDS.offering },
      }).success,
    ).toBe(false);
    expect(
      ChatNavigationSchema.safeParse({
        destinationId: "HOME",
        entityRef: { type: "CAMPAIGN", id: CHAT_TEST_IDS.campaign },
      }).success,
    ).toBe(false);
  });

  it("maps conforming assistant payloads and treats legacy payloads as narrative only", () => {
    const grounded = mapChatMessageRows([chatMessageFixture()]);
    expect(grounded[0]?.kind).toBe("ASSISTANT_GROUNDED");

    const legacy = mapChatMessageRows([
      chatMessageFixture({
        payload: {
          executionWidget: { confirmation: "This must never render" },
        },
        textContent: "Safe historical narrative",
      }),
    ]);
    expect(legacy).toEqual([
      expect.objectContaining({
        kind: "ASSISTANT_HISTORY",
        text: "Safe historical narrative",
      }),
    ]);
    expect(JSON.stringify(legacy)).not.toContain("executionWidget");
  });
});
