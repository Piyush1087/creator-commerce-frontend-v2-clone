import { useState } from "react";

import type { BrandHomeCoPilot } from "./brand-home-assistant-panel";
import { BrandHomeAssistantPanel } from "./brand-home-assistant-panel";
import "../../creator-centre/creator-centre.css";
import "../brand-dashboard-home.css";

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

type BrandHomeAssistantMobileProps = {
  coPilot: BrandHomeCoPilot;
  onOpenChats?: () => void;
};

/**
 * Mobile FAB + sheet for Brand Home — same shell pattern as Creator Centre.
 * Composer sits above bottom nav (see creator-centre sheet bottom offset).
 */
export function BrandHomeAssistantMobile({
  coPilot,
  onOpenChats,
}: BrandHomeAssistantMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const showThinking = coPilot.isSending && !isOpen;

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
          showThinking
            ? "Assistant drafting — open brand assistant"
            : "Open brand assistant"
        }
        onClick={() => setIsOpen(true)}
      >
        {showThinking ? (
          <>
            <span aria-hidden="true">🤖</span>
            <span className="cctr-assistant-fab__label">Drafting…</span>
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
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div
        className={`cctr-assistant-sheet${isOpen ? " cctr-assistant-sheet--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="cctr-assistant-sheet__handle" aria-hidden="true" />
        <BrandHomeAssistantPanel
          coPilot={coPilot}
          variant="sheet"
          onClose={() => setIsOpen(false)}
          onOpenChats={onOpenChats}
        />
      </div>
    </>
  );
}
