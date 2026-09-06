import { useEffect, useRef } from "react";

import type { ChatDisplayMessage } from "../contracts/chat.contracts";
import { ChatAssistantMessage } from "./chat-assistant-message";

type ChatMessageFeedProps = {
  conversationId: string | null;
  messages: readonly ChatDisplayMessage[];
  isSending: boolean;
};

export function ChatMessageFeed({
  conversationId,
  messages,
  isSending,
}: ChatMessageFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [conversationId]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    if (typeof feed.scrollTo === "function") {
      feed.scrollTo({
        top: feed.scrollHeight,
        behavior: isSending ? "auto" : "smooth",
      });
    } else {
      feed.scrollTop = feed.scrollHeight;
    }
  }, [isSending, messages]);

  return (
    <div className="chat-feed" ref={feedRef} aria-label="Chat messages">
      {messages.length === 0 && !isSending ? (
        <div className="chat-feed__empty">
          <span aria-hidden="true">✦</span>
          <strong>Ask Creator Shop</strong>
          <p>
            Ask what Creator Shop understands about your Brand and Products, or
            ask about your Campaigns.
          </p>
        </div>
      ) : null}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`chat-feed__row chat-feed__row--${message.kind === "USER" ? "user" : "assistant"}`}
        >
          {message.kind === "USER" ? (
            <div
              className="chat-feed__user-bubble"
              data-optimistic={message.optimistic || undefined}
            >
              {message.text}
            </div>
          ) : message.kind === "ASSISTANT_GROUNDED" ? (
            <ChatAssistantMessage response={message.response} />
          ) : (
            <article className="chat-response chat-response--history">
              <p className="chat-response__answer">{message.text}</p>
            </article>
          )}
        </div>
      ))}

      {isSending ? (
        <div className="chat-thinking" role="status" aria-live="polite">
          <span className="chat-thinking__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Thinking…
        </div>
      ) : null}
    </div>
  );
}
