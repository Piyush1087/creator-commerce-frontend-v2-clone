import { useEffect, useMemo, useRef, type FormEvent } from "react";

import { Button } from "../../../../design-system/aurora";
import { CoPilotIntentChips } from "../../../co-pilot/components/CoPilotIntentChips";
import type { CoPilotIntentTemplate } from "../../../co-pilot/types";
import { MOCK_ASSISTANT } from "../../mock-data/centre-mock";
import { useCreatorAssistant } from "./creator-assistant-context";
import "../../../co-pilot/co-pilot.css";
import "../../../shared/home-assistant/home-assistant-chrome.css";

type CreatorAssistantPanelProps = {
  variant?: "desktop" | "sheet";
};

function SendIcon() {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
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
 * Creator Assistant — same Stitch chrome as Brand Home (desktop Integrated + sheet).
 * Mock chat for now; visual/states stay in parity with brand.
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

  const suggestionTemplates = useMemo<CoPilotIntentTemplate[]>(
    () =>
      MOCK_ASSISTANT.chips.map((label, index) => ({
        id: `creator-chip-${index}`,
        label,
        templateString: label,
        associatedScope: "GLOBAL",
      })),
    [],
  );

  const userMessageCount = messages.filter(
    (message) => message.role === "user",
  ).length;

  return (
    <aside
      className={`cctr-assistant cctr-assistant--panel home-assistant${isSheet ? " cctr-assistant--sheet" : " cctr-assistant--desktop"}`}
    >
      <div className="cctr-assistant__head">
        <div className="cctr-assistant__title-row">
          {isSheet ? (
            <SparkleAvatar />
          ) : (
            <span className="cctr-assistant__title-emoji" aria-hidden="true">
              ✨
            </span>
          )}
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
        <div className="home-assistant__head-actions">
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
      </div>

      <div className="home-assistant__body" ref={threadRef}>
        <div className="home-assistant__feed home-assistant__feed--mock">
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

          {executionActions && executionActions.length > 0 ? (
            <div className="cctr-assistant__confirm-card">
              <p className="cctr-assistant__confirm-card-label">Action ready</p>
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
            </div>
          ) : null}
        </div>
      </div>

      <div className="home-assistant__foot">
        <CoPilotIntentChips
          templates={suggestionTemplates}
          disabled={isDrafting}
          collapseByDefault={isSheet}
          collapseSignal={userMessageCount}
          onSelect={(template) => sendMessage(template.templateString)}
        />
        <form className="cctr-assistant__composer-bar co-pilot-composer co-pilot-composer--home" onSubmit={onSubmit}>
          <input
            className="cctr-assistant__input co-pilot-composer__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={MOCK_ASSISTANT.placeholder}
            disabled={isDrafting}
            aria-label="Message the creator assistant"
          />
          <button
            type="submit"
            className="cctr-assistant__icon-btn cctr-assistant__icon-btn--send co-pilot-composer__icon-btn co-pilot-composer__icon-btn--send"
            aria-label="Send message"
            disabled={isDrafting || !draft.trim()}
          >
            <SendIcon />
          </button>
        </form>
        <p className="home-assistant__disclaimer">
          {isSheet ? MOCK_ASSISTANT.sheetDisclaimer : MOCK_ASSISTANT.disclaimer}
        </p>
      </div>
    </aside>
  );
}
