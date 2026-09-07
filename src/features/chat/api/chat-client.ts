import type { z } from "zod";

import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { parseApiErrorBody } from "../../../shared/api/parse-api-error";
import { env } from "../../../shared/config/env";
import {
  ChatConversationDetailSchema,
  ChatConversationListSchema,
  ChatConversationSchema,
  ChatCreateConversationInputSchema,
  ChatGroundedResponseSchema,
  ChatListConversationsInputSchema,
  ChatPatchConversationInputSchema,
  ChatTurnRequestSchema,
  type ChatConversation,
  type ChatConversationDetail,
  type ChatCreateConversationInput,
  type ChatGroundedResponse,
  type ChatListConversationsInput,
  type ChatPatchConversationInput,
  type ChatTurnRequest,
} from "../contracts/chat.schemas";

export const CHAT_CONVERSATIONS_PATH = "/api/v1/chat/conversations";

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Creator Shop returned an invalid response.");
  }
}

async function readValidated<T>(
  response: Response,
  schema: z.ZodType<T>,
  label: string,
): Promise<T> {
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw parseApiErrorBody(response.status, body);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Creator Shop returned an invalid ${label} response.`);
  }
  return parsed.data;
}

function conversationUrl(conversationId: string): string {
  return `${env.apiUrl}${CHAT_CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}`;
}

export function buildChatTurnRequest(input: unknown): ChatTurnRequest {
  return ChatTurnRequestSchema.parse(input);
}

export async function createChatConversation(
  input: ChatCreateConversationInput = {},
): Promise<ChatConversation> {
  const body = ChatCreateConversationInputSchema.parse(input);
  const response = await authenticatedFetch(
    `${env.apiUrl}${CHAT_CONVERSATIONS_PATH}`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    },
  );
  return readValidated(response, ChatConversationSchema, "conversation");
}

export async function listChatConversations(
  input: ChatListConversationsInput = {},
): Promise<ChatConversation[]> {
  const query = ChatListConversationsInputSchema.parse(input);
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.includeArchived !== undefined) {
    params.set("includeArchived", String(query.includeArchived));
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response = await authenticatedFetch(
    `${env.apiUrl}${CHAT_CONVERSATIONS_PATH}${suffix}`,
    { method: "GET", headers: { Accept: "application/json" } },
  );
  return readValidated(
    response,
    ChatConversationListSchema,
    "conversation list",
  );
}

export async function getChatConversation(
  conversationId: string,
): Promise<ChatConversationDetail> {
  const response = await authenticatedFetch(conversationUrl(conversationId), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return readValidated(
    response,
    ChatConversationDetailSchema,
    "conversation detail",
  );
}

export async function patchChatConversation(
  conversationId: string,
  input: ChatPatchConversationInput,
): Promise<ChatConversation> {
  const body = ChatPatchConversationInputSchema.parse(input);
  const response = await authenticatedFetch(conversationUrl(conversationId), {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  return readValidated(response, ChatConversationSchema, "conversation");
}

export async function postChatTurn(
  conversationId: string,
  input: ChatTurnRequest,
): Promise<ChatGroundedResponse> {
  const body = buildChatTurnRequest(input);
  const response = await authenticatedFetch(
    `${conversationUrl(conversationId)}/turns`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    },
  );
  return readValidated(response, ChatGroundedResponseSchema, "Chat turn");
}
