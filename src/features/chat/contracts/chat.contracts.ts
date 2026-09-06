import { ChatGroundedResponseSchema } from "./chat.schemas";
import type { ChatGroundedResponse, ChatMessageRow } from "./chat.schemas";

export type ChatDisplayMessage =
  | Readonly<{
      kind: "USER";
      id: string;
      text: string;
      createdAt: string;
      optimistic?: boolean;
    }>
  | Readonly<{
      kind: "ASSISTANT_GROUNDED";
      id: string;
      response: ChatGroundedResponse;
      createdAt: string;
    }>
  | Readonly<{
      kind: "ASSISTANT_HISTORY";
      id: string;
      text: string;
      createdAt: string;
    }>;

export function mapChatMessageRows(
  rows: readonly ChatMessageRow[],
): ChatDisplayMessage[] {
  return rows.flatMap((row): ChatDisplayMessage[] => {
    if (row.role === "USER" && row.textContent) {
      return [
        {
          kind: "USER",
          id: row.id,
          text: row.textContent,
          createdAt: row.createdAt,
        },
      ];
    }

    if (row.role !== "ASSISTANT") {
      return [];
    }

    const grounded = ChatGroundedResponseSchema.safeParse(row.payload);
    if (grounded.success) {
      return [
        {
          kind: "ASSISTANT_GROUNDED",
          id: row.id,
          response: grounded.data,
          createdAt: row.createdAt,
        },
      ];
    }

    return row.textContent
      ? [
          {
            kind: "ASSISTANT_HISTORY",
            id: row.id,
            text: row.textContent,
            createdAt: row.createdAt,
          },
        ]
      : [];
  });
}
