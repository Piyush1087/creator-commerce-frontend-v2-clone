import { History } from "lucide-react";

import { Alert, Button } from "../../../design-system/aurora";
import { BRAND_CO_PILOT_INPUT_PLACEHOLDER } from "../../co-pilot/brand/brand-co-pilot-config";
import { CoPilotComposer } from "../../co-pilot/components/CoPilotComposer";
import { CoPilotIntentChips } from "../../co-pilot/components/CoPilotIntentChips";
import { CoPilotMessageFeed } from "../../co-pilot/components/CoPilotMessageFeed";
import { CoPilotUsageBanner } from "../../co-pilot/components/CoPilotUsageBanner";
import type { useBrandCoPilot } from "../../co-pilot/hooks/use-brand-co-pilot";
import "../../co-pilot/co-pilot.css";
import "../../creator-centre/creator-centre.css";
import "../../shared/home-assistant/home-assistant-chrome.css";
import "../brand-dashboard-home.css";

export type BrandHomeCoPilot = ReturnType<typeof useBrandCoPilot>;

type BrandHomeAssistantPanelProps = {
  coPilot: BrandHomeCoPilot;
  variant?: "desktop" | "sheet";
  onClose?: () => void;
  onOpenChats?: () => void;
};

/**
 * Brand Home assistant — live co-pilot + shared Stitch chrome (same as Creator).
 */
export function BrandHomeAssistantPanel({
  coPilot,
  variant = "desktop",
  onClose,
  onOpenChats,
}: BrandHomeAssistantPanelProps) {
  const isSheet = variant === "sheet";

  const feedProps = {
    messages: coPilot.messages,
    isSending: coPilot.isSending,
    streamingNarrative: coPilot.streamingNarrative,
    hitlBusyKey: coPilot.hitlBusyKey,
    resolvedHitlKeys: coPilot.resolvedHitlKeys,
    activeThreadId: coPilot.activeThreadId,
    onConfirmHitl: (key: string) => {
      void coPilot.confirmHitl(key);
    },
    onDiscardHitl: (key: string) => {
      void coPilot.discardHitl(key);
    },
    onSubmitSlotValues: (values: Record<string, string>) => {
      void coPilot.submitSlotValues(values);
    },
  };

  const composerLockedByHitl = coPilot.pendingHitlWidget !== null;
  const composerDisabled =
    coPilot.isSending ||
    coPilot.isLoading ||
    !coPilot.activeThreadId ||
    coPilot.usage?.canSend === false ||
    composerLockedByHitl ||
    coPilot.hitlBusyKey !== null;

  const composerPlaceholder = composerLockedByHitl
    ? "Confirm or discard the staged action above to continue…"
    : coPilot.hitlBusyKey
      ? "Working on your confirmed action…"
      : BRAND_CO_PILOT_INPUT_PLACEHOLDER;

  const statusLabel = coPilot.isSending
    ? "Analyzing…"
    : coPilot.isLoading
      ? "Connecting…"
      : "Active";

  const userMessageCount = coPilot.messages.filter(
    (message) => message.sender === "USER",
  ).length;
  const suggestionCollapseSignal = `${coPilot.activeThreadId ?? "none"}:${userMessageCount}`;

  return (
    <aside
      className={`cctr-assistant cctr-assistant--panel home-assistant bdash-assistant${isSheet ? " cctr-assistant--sheet" : " cctr-assistant--desktop"}`}
    >
      <div className="cctr-assistant__head">
        <div className="cctr-assistant__title-row">
          {isSheet ? (
            <span className="cctr-assistant__avatar" aria-hidden="true">
              ✦
            </span>
          ) : (
            <span className="cctr-assistant__title-emoji" aria-hidden="true">
              ✨
            </span>
          )}
          <div className="cctr-assistant__title-block">
            <h2>Brand Assistant</h2>
            <span className="cctr-assistant__status">
              <span
                className={`cctr-assistant__dot${coPilot.isSending ? " cctr-assistant__dot--pulse" : ""}`}
                aria-hidden="true"
              />
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="home-assistant__head-actions">
          {onOpenChats ? (
            <button
              type="button"
              className="home-assistant__chats-btn"
              aria-label="Open recent chats"
              title="Recent chats"
              disabled={coPilot.isLoading}
              onClick={onOpenChats}
            >
              <History size={18} aria-hidden />
              <span>Chats</span>
            </button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={coPilot.isCreatingThread || coPilot.isLoading}
            onClick={() => {
              void coPilot.createNewThread();
            }}
          >
            New
          </Button>
          <button
            type="button"
            className="cctr-assistant__close"
            aria-label={isSheet ? "Close assistant" : "Assistant stays open on desktop"}
            onClick={isSheet ? onClose : undefined}
            disabled={!isSheet}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="home-assistant__body">
        {coPilot.isLoading ? (
          <p className="home-assistant__loading">Loading assistant…</p>
        ) : (
          <>
            <CoPilotUsageBanner usage={coPilot.usage} />
            {coPilot.error ? (
              <Alert tone="error" title="Something went wrong">
                {coPilot.error}
              </Alert>
            ) : null}
            {composerLockedByHitl ? (
              <Alert tone="warning" title="Staged action waiting">
                Use{" "}
                <strong>{coPilot.pendingHitlWidget?.primaryActionLabel}</strong>{" "}
                or{" "}
                <strong>{coPilot.pendingHitlWidget?.cancelActionLabel}</strong>{" "}
                on the card above before sending a new message.
              </Alert>
            ) : null}
            <div className="home-assistant__feed">
              <CoPilotMessageFeed {...feedProps} />
            </div>
          </>
        )}
      </div>

      <div className="home-assistant__foot">
        <CoPilotIntentChips
          templates={coPilot.intentTemplates}
          disabled={composerLockedByHitl || coPilot.isLoading}
          onSelect={coPilot.applyIntentTemplate}
          collapseByDefault={isSheet}
          collapseSignal={suggestionCollapseSignal}
        />
        <CoPilotComposer
          variant="home"
          value={coPilot.promptInput}
          placeholder={composerPlaceholder}
          disabled={composerDisabled}
          onChange={coPilot.setPromptInput}
          onSubmit={() => {
            void coPilot.submitPrompt();
          }}
        />
        <p className="home-assistant__disclaimer">
          {isSheet
            ? "Powered by Aurora Intelligence v4.1"
            : "AI can make mistakes. Please verify important info."}
        </p>
      </div>
    </aside>
  );
}
