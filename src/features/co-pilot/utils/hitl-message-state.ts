import type { CoPilotFeedMessage } from "../types";
import type { HitlResolution } from "../schemas/co-pilot-payload.schema";

export type PendingHitlWidget = {
  idempotencyKey: string;
  primaryActionLabel: string;
  cancelActionLabel: string;
};

export function findPendingHitlWidget(
  messages: CoPilotFeedMessage[],
  resolvedKeys: ReadonlySet<string>,
): PendingHitlWidget | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.sender !== "COPILOT_AGENT") {
      continue;
    }

    const { payload } = message;
    if (payload.formatType !== "INTERACTIVE_EXECUTION_WIDGET") {
      continue;
    }

    const widget = payload.executionWidget;
    if (!widget) {
      continue;
    }

    if (widget.resolution || resolvedKeys.has(widget.idempotencyKey)) {
      continue;
    }

    return {
      idempotencyKey: widget.idempotencyKey,
      primaryActionLabel: widget.primaryActionLabel,
      cancelActionLabel: widget.cancelActionLabel,
    };
  }

  return null;
}

export function extractResolvedHitlKeys(messages: CoPilotFeedMessage[]): Set<string> {
  const resolved = new Set<string>();

  for (const message of messages) {
    if (message.sender !== "COPILOT_AGENT") {
      continue;
    }
    const resolution = message.payload.executionWidget?.resolution;
    if (resolution) {
      resolved.add(message.payload.executionWidget!.idempotencyKey);
    }
  }

  return resolved;
}

export function applyHitlResolutionToMessages(
  messages: CoPilotFeedMessage[],
  idempotencyKey: string,
  resolution: HitlResolution,
): CoPilotFeedMessage[] {
  return messages.map((message) => {
    if (message.sender !== "COPILOT_AGENT") {
      return message;
    }
    const widget = message.payload.executionWidget;
    if (!widget || widget.idempotencyKey !== idempotencyKey) {
      return message;
    }
    return {
      ...message,
      payload: {
        ...message.payload,
        executionWidget: {
          ...widget,
          resolution,
        },
      },
    };
  });
}
