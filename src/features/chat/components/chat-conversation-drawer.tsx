import { useEffect, useRef } from "react";
import { Archive, X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "../../../design-system/aurora";
import type { ChatConversation } from "../contracts/chat.schemas";

type ChatConversationDrawerProps = {
  open: boolean;
  conversations: readonly ChatConversation[];
  activeConversationId: string | null;
  isCreatingConversation: boolean;
  archivingConversationId: string | null;
  disabled: boolean;
  onClose: () => void;
  onCreate: () => void;
  onSelect: (conversationId: string) => void;
  onArchive: (conversationId: string) => void;
};

function lastActiveLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function ChatConversationDrawer({
  open,
  conversations,
  activeConversationId,
  isCreatingConversation,
  archivingConversationId,
  disabled,
  onClose,
  onCreate,
  onSelect,
  onArchive,
}: ChatConversationDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="chat-drawer__overlay"
        aria-label="Close conversation history"
        onClick={onClose}
      />
      <aside
        className="chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-drawer-title"
      >
        <header className="chat-drawer__header">
          <h2 id="chat-drawer-title">Recent chats</h2>
          <button
            ref={closeRef}
            type="button"
            className="chat-drawer__close"
            aria-label="Close recent chats"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="chat-drawer__actions">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || isCreatingConversation}
            onClick={onCreate}
          >
            {isCreatingConversation ? "Creating…" : "New Chat"}
          </Button>
        </div>

        <div className="chat-drawer__scroll">
          {conversations.length === 0 ? (
            <p className="chat-drawer__empty">No active conversations yet.</p>
          ) : (
            <ul className="chat-drawer__list">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                const isArchiving = archivingConversationId === conversation.id;
                return (
                  <li key={conversation.id} className="chat-drawer__item">
                    <button
                      type="button"
                      className={`chat-drawer__select${isActive ? " chat-drawer__select--active" : ""}`}
                      aria-current={isActive ? "true" : undefined}
                      disabled={disabled || isArchiving}
                      onClick={() => onSelect(conversation.id)}
                    >
                      <strong>{conversation.title}</strong>
                      <span>{lastActiveLabel(conversation.lastMessageAt)}</span>
                    </button>
                    <button
                      type="button"
                      className="chat-drawer__archive"
                      aria-label={`Archive ${conversation.title}`}
                      disabled={disabled || isArchiving}
                      onClick={() => onArchive(conversation.id)}
                    >
                      <Archive size={16} aria-hidden="true" />
                      <span>{isArchiving ? "Archiving…" : "Archive"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
