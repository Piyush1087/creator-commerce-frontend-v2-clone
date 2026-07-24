import { useEffect, useRef, type FormEvent } from "react";

import { Button } from "../../../../design-system/aurora";
import { MOCK_ASSISTANT } from "../../mock-data/centre-mock";
import { useCreatorAssistant } from "./creator-assistant-context";

type CreatorAssistantPanelProps = {
  /** desktop sticky column vs mobile bottom sheet body */
  variant?: "desktop" | "sheet";
};

export function CreatorAssistantPanel({
  variant = "desktop",
}: CreatorAssistantPanelProps) {
  const {
    close,
    draft,
    setDraft,
    messages,
    isDrafting,
    sendMessage,
  } = useCreatorAssistant();
  const isSheet = variant === "sheet";
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isDrafting]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <aside
      className={`cctr-assistant cctr-assistant--panel${isSheet ? " cctr-assistant--sheet" : " cctr-assistant--desktop"}`}
    >
      <div className="cctr-assistant__head">
        <div className="cctr-assistant__title-row">
          <span aria-hidden="true">✨</span>
          <h2>{MOCK_ASSISTANT.title}</h2>
          <span className="cctr-assistant__status">
            <span className="cctr-assistant__dot" aria-hidden="true" />
            {isDrafting ? "Drafting…" : MOCK_ASSISTANT.status}
          </span>
        </div>
        {isSheet ? (
          <button
            type="button"
            className="cctr-assistant__close"
            aria-label="Close assistant"
            onClick={close}
          >
            ✕
          </button>
        ) : null}
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
      </div>

      <form className="cctr-assistant__foot" onSubmit={onSubmit}>
        <label className="cctr-assistant__composer">
          <span className="cctr-assistant__composer-label">Ask the assistant</span>
          <div className="cctr-assistant__composer-row">
            <input
              className="cctr-assistant__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={MOCK_ASSISTANT.placeholder}
              disabled={isDrafting}
              aria-label="Message the creator assistant"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isDrafting || !draft.trim()}
            >
              Send
            </Button>
          </div>
        </label>
        <p className="cctr-assistant__disclaimer">{MOCK_ASSISTANT.disclaimer}</p>
        {isSheet ? (
          <div className="cctr-assistant__sheet-actions">
            <Button variant="outline" size="sm" onClick={close} type="button">
              Done
            </Button>
          </div>
        ) : null}
      </form>
    </aside>
  );
}
