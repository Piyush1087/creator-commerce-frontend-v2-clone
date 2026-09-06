import type {
  ChatConversation,
  ChatGroundedResponse,
  ChatMessageRow,
} from "../contracts/chat.schemas";

export const CHAT_TEST_IDS = {
  conversation: "10000000-0000-4000-8000-000000000001",
  secondConversation: "10000000-0000-4000-8000-000000000002",
  legacyConversation: "10000000-0000-4000-8000-000000000003",
  brand: "20000000-0000-4000-8000-000000000001",
  user: "30000000-0000-4000-8000-000000000001",
  message: "40000000-0000-4000-8000-000000000001",
  campaign: "50000000-0000-4000-8000-000000000001",
  offering: "60000000-0000-4000-8000-000000000001",
} as const;

export function chatConversationFixture(
  overrides: Partial<ChatConversation> = {},
): ChatConversation {
  return {
    id: CHAT_TEST_IDS.conversation,
    brandProfileId: CHAT_TEST_IDS.brand,
    createdByUserId: CHAT_TEST_IDS.user,
    title: "Brand and Product understanding",
    scopeContext: "GLOBAL",
    linkedEntityType: "NONE",
    linkedEntityId: null,
    archivedAt: null,
    lastMessageAt: "2026-09-01T08:00:00.000Z",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

export function chatResponseFixture(
  overrides: Partial<ChatGroundedResponse> = {},
): ChatGroundedResponse {
  return {
    contractVersion: "1.0",
    status: "ANSWERED",
    answer: "Creator Shop understands your Brand and current Products.",
    grounding: [
      {
        sourceType: "CANONICAL",
        capabilityId: "brand.current.read",
        entityRefs: [{ type: "BRAND", id: CHAT_TEST_IDS.brand }],
        resultRefs: ["internal-result-reference"],
      },
      {
        sourceType: "INTELLIGENCE",
        capabilityId: "product_intelligence.current.read",
        entityRefs: [{ type: "OFFERING", id: CHAT_TEST_IDS.offering }],
      },
    ],
    entityRefs: [{ type: "BRAND", id: CHAT_TEST_IDS.brand }],
    freshnessNotes: [],
    limitations: [],
    ...overrides,
  };
}

export function chatMessageFixture(
  overrides: Partial<ChatMessageRow> = {},
): ChatMessageRow {
  return {
    id: CHAT_TEST_IDS.message,
    threadId: CHAT_TEST_IDS.conversation,
    role: "ASSISTANT",
    textContent: "Historical narrative",
    payload: chatResponseFixture(),
    formatType: "CONVERSATIONAL_NARRATIVE",
    createdAt: "2026-09-01T08:01:00.000Z",
    ...overrides,
  };
}
