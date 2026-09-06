import { useEffect, useRef, useState } from "react";

import type { BrandChatController } from "../hooks/use-brand-chat";
import { BrandHomeChatPanel } from "./brand-home-chat-panel";

function AssistantIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
    </svg>
  );
}

export function BrandHomeChatMobile({
  chat,
  onOpenChats,
}: {
  chat: BrandChatController;
  onOpenChats: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`cctr-assistant-fab${open ? " cctr-assistant-fab--hidden" : ""}${chat.isSending && !open ? " cctr-assistant-fab--thinking" : ""}`}
        aria-label={
          chat.isSending
            ? "Creator Shop is thinking — open Chat"
            : "Open Ask Creator Shop"
        }
        onClick={() => setOpen(true)}
      >
        <AssistantIcon />
        {chat.isSending && !open ? (
          <span className="cctr-assistant-fab__label">Thinking…</span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="cctr-assistant-backdrop"
            aria-label="Close Ask Creator Shop backdrop"
            onClick={() => setOpen(false)}
          />
          <div
            ref={dialogRef}
            className="cctr-assistant-sheet cctr-assistant-sheet--open"
            role="dialog"
            aria-modal="true"
            aria-label="Ask Creator Shop Chat"
            tabIndex={-1}
          >
            <div className="cctr-assistant-sheet__handle" aria-hidden="true" />
            <BrandHomeChatPanel
              chat={chat}
              variant="sheet"
              onOpenChats={onOpenChats}
              onCloseSheet={() => setOpen(false)}
            />
          </div>
        </>
      ) : null}
    </>
  );
}
