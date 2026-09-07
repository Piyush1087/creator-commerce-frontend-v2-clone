import { History } from "lucide-react";

import { Alert, Button } from "../../../design-system/aurora";
import type { BrandChatController } from "../hooks/use-brand-chat";
import { ChatComposer } from "./chat-composer";
import { ChatMessageFeed } from "./chat-message-feed";

type BrandHomeChatPanelProps = {
  chat: BrandChatController;
  variant?: "desktop" | "sheet";
  onOpenChats: () => void;
  onCloseSheet?: () => void;
};

export function BrandHomeChatPanel({
  chat,
  variant = "desktop",
  onOpenChats,
  onCloseSheet,
}: BrandHomeChatPanelProps) {
  const isSheet = variant === "sheet";
  const composerDisabled =
    chat.isSending || chat.isLoading || !chat.activeConversationId;

  return (
    <aside
      className={`cctr-assistant cctr-assistant--panel home-assistant bdash-assistant chat-home-panel${isSheet ? " cctr-assistant--sheet" : " cctr-assistant--desktop"}`}
      aria-label="Ask Creator Shop"
    >
      <div className="cctr-assistant__head">
        <div className="cctr-assistant__title-row">
          <span className="cctr-assistant__title-emoji" aria-hidden="true">
            ✨
          </span>
          <div className="cctr-assistant__title-block">
            <h2>Ask Creator Shop</h2>
            <span className="cctr-assistant__status">
              <span
                className={`cctr-assistant__dot${chat.isSending ? " cctr-assistant__dot--pulse" : ""}`}
                aria-hidden="true"
              />
              {chat.isSending ? "Thinking…" : "Ready"}
            </span>
          </div>
        </div>
        <div className="chat-home-panel__actions">
          <button
            type="button"
            className="chat-home-panel__chats"
            aria-label="Open recent chats"
            disabled={chat.isLoading}
            onClick={onOpenChats}
          >
            <History size={18} aria-hidden="true" />
            <span>Chats</span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Create new Chat conversation"
            disabled={chat.isCreatingConversation || chat.isLoading}
            onClick={() => void chat.createNewConversation()}
          >
            New
          </Button>
          {isSheet && onCloseSheet ? (
            <button
              type="button"
              className="chat-home-panel__sheet-close"
              aria-label="Close Ask Creator Shop"
              onClick={onCloseSheet}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className="chat-home-panel__body">
        {chat.error ? (
          <Alert tone="error" title="Chat unavailable">
            {chat.error}
          </Alert>
        ) : null}
        {chat.isLoading ? (
          <p className="chat-home-panel__loading" role="status">
            Loading conversations…
          </p>
        ) : (
          <ChatMessageFeed
            conversationId={chat.activeConversationId}
            messages={chat.messages}
            isSending={chat.isSending}
          />
        )}
      </div>

      <div className="chat-home-panel__foot">
        <ChatComposer
          value={chat.promptInput}
          disabled={composerDisabled}
          onChange={chat.setPromptInput}
          onSubmit={() => void chat.submitPrompt()}
        />
        <p className="chat-home-panel__disclaimer">
          AI can make mistakes. Check important information.
        </p>
      </div>
    </aside>
  );
}
