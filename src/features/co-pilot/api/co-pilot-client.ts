import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import {
  CoPilotThreadRowSchema,
  isCoPilotHitlConfirmResponse,
  isCoPilotHitlDiscardResponse,
  isCoPilotPostMessageResponse,
  isCoPilotThreadDetailResponse,
  isCoPilotThreadListResponse,
  isCoPilotUsageResponse,
  type CoPilotHitlConfirmResponse,
  type CoPilotHitlDiscardResponse,
  type CoPilotMessageRow,
  type CoPilotPostMessageResponse,
  type CoPilotScopeContext,
  type CoPilotThreadRow,
  type CoPilotUsageSnapshot,
} from "../contracts/co-pilot.contracts";
import {
  CoPilotChatPayloadSchema,
  type CoPilotChatPayload,
} from "../schemas/co-pilot-payload.schema";

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

function authHeaders(): Record<string, string> {
  return {
    ...JSON_HEADERS,
  };
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

type PostMessageBody = {
  text: string;
  scopeContext?: CoPilotScopeContext;
  slotValues?: Record<string, string>;
};

function buildPostMessageBody(
  text: string,
  scopeContext?: CoPilotScopeContext,
  slotValues?: Record<string, string>,
): PostMessageBody {
  const body: PostMessageBody = { text };
  if (scopeContext) {
    body.scopeContext = scopeContext;
  }
  if (slotValues && Object.keys(slotValues).length > 0) {
    body.slotValues = slotValues;
  }
  return body;
}

type SseEvent = {
  event: string;
  data: string;
};

function parseSseBlock(block: string): SseEvent | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return { event, data: dataLines.join("\n") };
}

export async function fetchCoPilotUsage(): Promise<CoPilotUsageSnapshot | null> {
  const response = await fetch(`${env.apiUrl}/api/v1/co-pilot/usage`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await readJsonOrThrow(response);
  if (!isCoPilotUsageResponse(json)) {
    throw new Error("Unexpected co-pilot usage response.");
  }
  return json.usage;
}

export async function fetchCoPilotThreads(
  limit = 30,
): Promise<CoPilotThreadRow[]> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/co-pilot/threads?limit=${limit}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isCoPilotThreadListResponse(json)) {
    throw new Error("Unexpected co-pilot thread list response.");
  }
  return json.threads;
}

export async function createCoPilotThread(
  scopeContext: CoPilotScopeContext = "BRAND_CENTRE",
): Promise<{
  thread: CoPilotThreadRow;
  messages: CoPilotMessageRow[];
}> {
  const response = await fetch(`${env.apiUrl}/api/v1/co-pilot/threads`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ scopeContext }),
  });
  const json = await readJsonOrThrow(response);
  if (!isCoPilotThreadDetailResponse(json)) {
    throw new Error("Unexpected co-pilot create thread response.");
  }
  return json;
}

export async function fetchCoPilotThread(threadId: string): Promise<{
  thread: CoPilotThreadRow;
  messages: CoPilotMessageRow[];
}> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/co-pilot/threads/${threadId}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isCoPilotThreadDetailResponse(json)) {
    throw new Error("Unexpected co-pilot thread response.");
  }
  return json;
}

export async function postCoPilotMessage(
  threadId: string,
  text: string,
  options?: {
    scopeContext?: CoPilotScopeContext;
    slotValues?: Record<string, string>;
  },
): Promise<CoPilotPostMessageResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/co-pilot/threads/${threadId}/messages`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(
        buildPostMessageBody(text, options?.scopeContext, options?.slotValues),
      ),
    },
  );
  const json = await readJsonOrThrow(response);
  if (!isCoPilotPostMessageResponse(json)) {
    throw new Error("Unexpected co-pilot message response.");
  }
  return json;
}

export type StreamCoPilotMessageOptions = {
  scopeContext?: CoPilotScopeContext;
  slotValues?: Record<string, string>;
  onNarrativeDelta?: (text: string) => void;
};

export async function streamCoPilotMessage(
  threadId: string,
  text: string,
  options?: StreamCoPilotMessageOptions,
): Promise<CoPilotPostMessageResponse> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/co-pilot/threads/${threadId}/messages/stream`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(
        buildPostMessageBody(text, options?.scopeContext, options?.slotValues),
      ),
    },
  );

  if (!response.ok) {
    await readJsonOrThrow(response);
    throw new Error(`Stream request failed (${response.status}).`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let result: CoPilotPostMessageResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block.trim());
      if (!parsed) {
        continue;
      }

      if (parsed.event === "narrative_delta") {
        const payload = JSON.parse(parsed.data) as { text?: string };
        if (typeof payload.text === "string" && options?.onNarrativeDelta) {
          options.onNarrativeDelta(payload.text);
        }
      } else if (parsed.event === "done") {
        const payload = JSON.parse(parsed.data) as unknown;
        if (isCoPilotPostMessageResponse(payload)) {
          result = payload;
        } else {
          throw new Error("Unexpected co-pilot stream completion payload.");
        }
      } else if (parsed.event === "error") {
        const payload = JSON.parse(parsed.data) as { message?: string };
        throw new Error(payload.message ?? "Stream failed.");
      }
    }
  }

  if (!result) {
    throw new Error("Stream ended without a completion event.");
  }

  return result;
}

export async function archiveCoPilotThread(
  threadId: string,
): Promise<CoPilotThreadRow> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/co-pilot/threads/${threadId}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "ARCHIVED" }),
    },
  );
  const json = await readJsonOrThrow(response);
  if (
    typeof json !== "object" ||
    json === null ||
    typeof (json as { thread?: unknown }).thread !== "object"
  ) {
    throw new Error("Unexpected co-pilot archive thread response.");
  }
  const parsed = CoPilotThreadRowSchema.safeParse(
    (json as { thread: unknown }).thread,
  );
  if (!parsed.success) {
    throw new Error("Unexpected co-pilot archive thread response.");
  }
  return parsed.data;
}

export async function submitCoPilotFeedback(args: {
  messageId: string;
  threadId: string;
  rating: "THUMBS_UP" | "THUMBS_DOWN";
  reason?: string;
}): Promise<void> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/co-pilot/messages/${args.messageId}/feedback`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        threadId: args.threadId,
        rating: args.rating,
        reason: args.reason,
      }),
    },
  );
  await readJsonOrThrow(response);
}

export async function confirmCoPilotHitl(args: {
  threadId: string;
  idempotencyKey: string;
}): Promise<CoPilotHitlConfirmResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/co-pilot/hitl/confirm`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(args),
  });
  const json = await readJsonOrThrow(response);
  if (!isCoPilotHitlConfirmResponse(json)) {
    throw new Error("Unexpected HITL confirm response.");
  }
  return json;
}

export type CoPilotHitlStreamResult = {
  hitlResolution?: CoPilotHitlConfirmResponse["hitlResolution"];
  followUpPayload?: CoPilotChatPayload;
  result?: Record<string, unknown>;
};

export async function streamCoPilotHitlConfirm(
  args: {
    threadId: string;
    idempotencyKey: string;
  },
  handlers?: {
    onJobStatus?: (message: string) => void;
  },
): Promise<CoPilotHitlStreamResult> {
  const response = await fetch(
    `${env.apiUrl}/api/v1/co-pilot/hitl/confirm/stream`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(args),
    },
  );

  if (!response.ok || !response.body) {
    await readJsonOrThrow(response);
    throw new Error("HITL confirm stream failed.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hitlResolution: CoPilotHitlStreamResult["hitlResolution"];
  let followUpPayload: CoPilotChatPayload | undefined;
  let result: Record<string, unknown> | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (!parsed) {
        continue;
      }

      if (parsed.event === "hitl_confirmed") {
        const payload = JSON.parse(parsed.data) as {
          hitlResolution?: CoPilotHitlStreamResult["hitlResolution"];
        };
        hitlResolution = payload.hitlResolution;
      }

      if (parsed.event === "job_status") {
        const payload = JSON.parse(parsed.data) as { message?: string };
        if (payload.message) {
          handlers?.onJobStatus?.(payload.message);
        }
      }

      if (parsed.event === "follow_up") {
        const payload = JSON.parse(parsed.data) as { payload?: unknown };
        const parsedPayload = CoPilotChatPayloadSchema.safeParse(
          payload.payload,
        );
        if (parsedPayload.success) {
          followUpPayload = parsedPayload.data;
        }
      }

      if (parsed.event === "done") {
        const payload = JSON.parse(parsed.data) as {
          result?: Record<string, unknown>;
        };
        result = payload.result;
      }

      if (parsed.event === "error") {
        const payload = JSON.parse(parsed.data) as { message?: string };
        throw new Error(payload.message ?? "HITL confirm stream failed.");
      }
    }
  }

  return { hitlResolution, followUpPayload, result };
}

export async function discardCoPilotHitl(args: {
  threadId: string;
  idempotencyKey: string;
}): Promise<CoPilotHitlDiscardResponse> {
  const response = await fetch(`${env.apiUrl}/api/v1/co-pilot/hitl/discard`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(args),
  });
  const json = await readJsonOrThrow(response);
  if (!isCoPilotHitlDiscardResponse(json)) {
    throw new Error("Unexpected HITL discard response.");
  }
  return json;
}
