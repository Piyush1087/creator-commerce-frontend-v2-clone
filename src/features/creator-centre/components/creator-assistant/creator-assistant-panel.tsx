import { useEffect, useRef, type FormEvent } from "react";

import { Button } from "../../../../design-system/aurora";
import { MOCK_ASSISTANT } from "../../mock-data/centre-mock";
import { useCreatorAssistant } from "./creator-assistant-context";

type CreatorAssistantPanelProps = {
  /** desktop sticky column vs mobile bottom sheet body */
  variant?: "desktop" | "sheet";
};

function AttachIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5 9.5 9.5 2.5 12l7 2.5L12 21.5l2.5-7 7-2.5-7-2.5L12 2.5Z" />
    </svg>
  );
}

function SparkleAvatar() {
  return (
    <span className="cctr-assistant__avatar" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5 9.5 9.5 2.5 12l7 2.5L12 21.5l2.5-7 7-2.5-7-2.5L12 2.5Z" />
      </svg>
    </span>
  );
}

/**
 * Creator Assistant chat.
 * Desktop → AI Assistant Integrated column.
 * Sheet → Bottom Sheet Interface + Action Execution Engine CTAs.
 */
export function CreatorAssistantPanel({
  variant = "desktop",
}: CreatorAssistantPanelProps) {
  const {
    close,
    draft,
    setDraft,
    messages,
    isDrafting,
    executionActions,
    sendMessage,
  } = useCreatorAssistant();
  const isSheet = variant === "sheet";
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isDrafting, executionActions]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  const statusLabel = isDrafting
    ? MOCK_ASSISTANT.statusAnalyzing
    : MOCK_ASSISTANT.status;

  return (
    <aside
      className={`cctr-assistant cctr-assistant--panel${isSheet ? " cctr-assistant--sheet" : " cctr-assistant--desktop"}`}
    >
      <div className="cctr-assistant__head">
        <div className="cctr-assistant__title-row">
          {isSheet ? <SparkleAvatar /> : <span aria-hidden="true">✨</span>}
          <div className="cctr-assistant__title-block">
            <h2>{MOCK_ASSISTANT.title}</h2>
            <span className="cctr-assistant__status">
              <span
                className={`cctr-assistant__dot${isDrafting ? " cctr-assistant__dot--pulse" : ""}`}
                aria-hidden="true"
              />
              {statusLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="cctr-assistant__close"
          aria-label={isSheet ? "Close assistant" : "Assistant stays open on desktop"}
          onClick={isSheet ? close : undefined}
          disabled={!isSheet}
        >
          ✕
        </button>
      </div>

      <div className="cctr-assistant__body" ref={threadRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`cctr-assistant__bubble cctr-assistant__bubble--${message.role}`}
          >
            {message.role === "status" ? (
              <span className="cctr-assistant__drafting">
                <span className="cctr-assistant__drafting-dot" aria-hidden />
                {message.text}
              </span>
            ) : (
              message.text.split("\n").map((line, index) => (
                <span key={`${message.id}-${index}`}>
                  {line}
                  {index < message.text.split("\n").length - 1 ? <br /> : null}
                </span>
              ))
            )}
          </div>
        ))}

        {!isDrafting && messages.length <= 2 ? (
          <div className="cctr-assistant__chips">
            {MOCK_ASSISTANT.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className="cctr-assistant__chip"
                onClick={() => sendMessage(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        ) : null}

        {/* Action Execution Engine — CTAs after a mock draft */}
        {executionActions && executionActions.length > 0 ? (
          <div className="cctr-assistant__actions">
            {executionActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant={action.variant}
                size={isSheet ? "md" : "sm"}
                disabled
                className="cctr-assistant__action-btn"
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <form className="cctr-assistant__foot" onSubmit={onSubmit}>
        <div className="cctr-assistant__composer-bar">
          <button
            type="button"
            className="cctr-assistant__icon-btn"
            aria-label="Attach file"
            disabled
          >
            <AttachIcon />
          </button>
          <input
            className="cctr-assistant__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={MOCK_ASSISTANT.placeholder}
            disabled={isDrafting}
            aria-label="Message the creator assistant"
          />
          <button
            type="submit"
            className="cctr-assistant__icon-btn cctr-assistant__icon-btn--send"
            aria-label="Send message"
            disabled={isDrafting || !draft.trim()}
          >
            <SendIcon />
          </button>
        </div>
        <p className="cctr-assistant__disclaimer">
          {isSheet ? MOCK_ASSISTANT.sheetDisclaimer : MOCK_ASSISTANT.disclaimer}
        </p>
      </form>
    </aside>
  );
}
