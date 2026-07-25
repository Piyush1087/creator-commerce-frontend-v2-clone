import type { CoPilotFeedMessage } from "../types";
import { useCoPilotFeedAutoScroll } from "../hooks/use-co-pilot-feed-auto-scroll";
import { formatMessageTimestamp } from "../utils/format-message-timestamp";
import { Card } from "../../../design-system/aurora";
import { GenerativeUIPayloadRenderer } from "./GenerativeUIPayloadRenderer";

type Props = {
  messages: CoPilotFeedMessage[];
  isSending: boolean;
  streamingNarrative?: string | null;
  hitlBusyKey?: string | null;
  resolvedHitlKeys?: ReadonlySet<string>;
  activeThreadId?: string | null;
  onConfirmHitl?: (idempotencyKey: string) => void;
  onDiscardHitl?: (idempotencyKey: string) => void;
  onSubmitSlotValues?: (slotValues: Record<string, string>) => void;
};

export function CoPilotMessageFeed({
  messages,
  isSending,
  streamingNarrative,
  hitlBusyKey,
  resolvedHitlKeys,
  activeThreadId,
  onConfirmHitl,
  onDiscardHitl,
  onSubmitSlotValues,
}: Props) {
  const feedRef = useCoPilotFeedAutoScroll({
    activeThreadId,
    messages,
    isSending,
    streamingNarrative,
    hitlBusyKey,
  });

  const showStreamingStatus = Boolean(
    streamingNarrative && (isSending || hitlBusyKey),
  );
  const showTypingIndicator = Boolean(
    (isSending || hitlBusyKey) && !streamingNarrative,
  );

  return (
    <div className="co-pilot-feed" ref={feedRef} aria-live="polite">
      {messages.map((message) => {
        if (message.sender === "USER") {
          const timestampLabel = formatMessageTimestamp(message.timestamp);
          return (
            <div key={message.id} className="co-pilot-feed__row co-pilot-feed__row--user">
              <div className="co-pilot-feed__user-block">
                <div className="co-pilot-user-bubble">{message.text}</div>
                {timestampLabel ? (
                  <div className="co-pilot-feed__meta co-pilot-feed__meta--user">
                    <time className="co-pilot-feed__timestamp" dateTime={message.timestamp}>
                      {timestampLabel}
                    </time>
                  </div>
                ) : null}
              </div>
            </div>
          );
        }

        const timestampLabel = formatMessageTimestamp(message.payload.timestamp);

        return (
          <div key={message.id} className="co-pilot-feed__row co-pilot-feed__row--agent">
            <div className="co-pilot-feed__agent-block">
              <GenerativeUIPayloadRenderer
                payload={message.payload}
                hitlBusyKey={hitlBusyKey}
                resolvedHitlKeys={resolvedHitlKeys}
                onConfirmHitl={onConfirmHitl}
                onDiscardHitl={onDiscardHitl}
                onSubmitSlotValues={onSubmitSlotValues}
                slotSubmitBusy={isSending}
              />
              {timestampLabel ? (
                <div className="co-pilot-feed__meta co-pilot-feed__meta--agent">
                  <time
                    className="co-pilot-feed__timestamp"
                    dateTime={message.payload.timestamp}
                  >
                    {timestampLabel}
                  </time>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {showStreamingStatus && (
        <div className="co-pilot-feed__row co-pilot-feed__row--agent">
          <Card compact className="co-pilot-agent-card co-pilot-agent-card--streaming">
            <p className="co-pilot-agent-card__narrative">{streamingNarrative}</p>
          </Card>
        </div>
      )}

      {showTypingIndicator && (
        <div className="co-pilot-feed__row co-pilot-feed__row--agent">
          <div className="co-pilot-typing" aria-label="Co-pilot is thinking">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div className="co-pilot-feed__scroll-anchor" aria-hidden />
    </div>
  );
}
