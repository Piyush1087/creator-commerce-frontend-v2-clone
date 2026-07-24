import { CreatorAssistantPanel } from "./creator-assistant-panel";
import { useCreatorAssistant } from "./creator-assistant-context";

/** Sparkle icon from Stitch Mobile Assistant FAB States. */
function AssistantFabIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

/**
 * Mobile FAB + ~80% bottom sheet (Master Spec).
 * FAB states from Stitch: Mobile Assistant FAB States — Comparison View.
 * Desktop column is rendered separately on Home.
 */
export function CreatorAssistantMobile() {
  const { isOpen, open, close, isDrafting } = useCreatorAssistant();
  const showThinking = isDrafting && !isOpen;

  return (
    <>
      <button
        type="button"
        className={[
          "cctr-assistant-fab",
          isOpen ? "cctr-assistant-fab--hidden" : "",
          showThinking ? "cctr-assistant-fab--thinking" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={
          showThinking ? "Assistant drafting — open creator assistant" : "Open creator assistant"
        }
        onClick={open}
      >
        {showThinking ? (
          <>
            <span aria-hidden="true">🤖</span>
            <span className="cctr-assistant-fab__label">Drafting Pitch...</span>
          </>
        ) : (
          <AssistantFabIcon />
        )}
      </button>

      {isOpen ? (
        <button
          type="button"
          className="cctr-assistant-backdrop"
          aria-label="Dismiss assistant"
          onClick={close}
        />
      ) : null}

      <div
        className={`cctr-assistant-sheet${isOpen ? " cctr-assistant-sheet--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="cctr-assistant-sheet__handle" aria-hidden="true" />
        <CreatorAssistantPanel variant="sheet" />
      </div>
    </>
  );
}
