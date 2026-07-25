import { useEffect, useState } from "react";
import { BRAND_CO_PILOT_INPUT_PLACEHOLDER } from "../brand/brand-co-pilot-config";
import { registerCoPilotThreadDrawer } from "../co-pilot-mobile-bridge";
import { useBrandCoPilot } from "../hooks/use-brand-co-pilot";
import { Alert } from "../../../design-system/aurora";
import { CoPilotComposer } from "./CoPilotComposer";
import { CoPilotDeleteThreadDialog } from "./CoPilotDeleteThreadDialog";
import { CoPilotIntentChips } from "./CoPilotIntentChips";
import { CoPilotMessageFeed } from "./CoPilotMessageFeed";
import { CoPilotMobileThreadDrawer } from "./CoPilotMobileThreadDrawer";
import { CoPilotThreadRail } from "./CoPilotThreadRail";
import { CoPilotUsageBanner } from "./CoPilotUsageBanner";
import "../co-pilot.css";

export function BrandCoPilotWorkspace() {
  const coPilot = useBrandCoPilot();
  const [mobileThreadDrawerOpen, setMobileThreadDrawerOpen] = useState(false);

  useEffect(() => {
    return registerCoPilotThreadDrawer(() => setMobileThreadDrawerOpen(true));
  }, []);

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

  const userMessageCount = coPilot.messages.filter(
    (message) => message.sender === "USER",
  ).length;
  const suggestionCollapseSignal = `${coPilot.activeThreadId ?? "none"}:${userMessageCount}`;

  const pendingHitlBanner = composerLockedByHitl ? (
    <Alert tone="warning" title="Staged action waiting">
      Use <strong>{coPilot.pendingHitlWidget?.primaryActionLabel}</strong> or{" "}
      <strong>{coPilot.pendingHitlWidget?.cancelActionLabel}</strong> on the card above
      before sending a new message.
    </Alert>
  ) : null;

  const desktopControls = (
    <div className="co-pilot-workspace__controls">
      <CoPilotUsageBanner usage={coPilot.usage} />
      {coPilot.error && (
        <Alert tone="error" title="Something went wrong">
          {coPilot.error}
        </Alert>
      )}
      {pendingHitlBanner}
      <CoPilotIntentChips
        templates={coPilot.intentTemplates}
        disabled={composerLockedByHitl}
        onSelect={coPilot.applyIntentTemplate}
        collapseSignal={suggestionCollapseSignal}
      />
      <CoPilotComposer
        value={coPilot.promptInput}
        placeholder={composerPlaceholder}
        disabled={composerDisabled}
        onChange={coPilot.setPromptInput}
        onSubmit={() => {
          void coPilot.submitPrompt();
        }}
      />
    </div>
  );

  const mobileControls = (
    <div className="co-pilot-workspace__controls">
      <CoPilotUsageBanner usage={coPilot.usage} />
      {coPilot.error && (
        <Alert tone="error" title="Something went wrong">
          {coPilot.error}
        </Alert>
      )}
      {pendingHitlBanner}
      <CoPilotIntentChips
        templates={coPilot.intentTemplates}
        disabled={composerLockedByHitl}
        onSelect={coPilot.applyIntentTemplate}
        collapseByDefault
        collapseSignal={suggestionCollapseSignal}
      />
      <CoPilotComposer
        value={coPilot.promptInput}
        placeholder={composerPlaceholder}
        disabled={composerDisabled}
        onChange={coPilot.setPromptInput}
        onSubmit={() => {
          void coPilot.submitPrompt();
        }}
      />
    </div>
  );

  if (coPilot.isLoading) {
    return (
      <div className="co-pilot-workspace co-pilot-workspace--loading">
        <p className="co-pilot-workspace__loading">Loading co-pilot…</p>
      </div>
    );
  }

  return (
    <div className="co-pilot-workspace">
      <div className="co-pilot-workspace__desktop">
        <CoPilotThreadRail
          groupedThreads={coPilot.groupedThreads}
          groupedAllThreads={coPilot.groupedAllThreads}
          activeThreadId={coPilot.activeThreadId ?? ""}
          isCreatingThread={coPilot.isCreatingThread}
          deletingThreadId={coPilot.deletingThreadId}
          showAllThreads={coPilot.showAllThreads}
          onSelect={(threadId) => {
            void coPilot.selectThread(threadId);
          }}
          onDelete={coPilot.requestDeleteThread}
          onCreateThread={() => {
            void coPilot.createNewThread();
          }}
          onViewAll={() => {
            void coPilot.openViewAllThreads();
          }}
          onCloseViewAll={() => coPilot.setShowAllThreads(false)}
        />

        <section className="co-pilot-workspace__main">
          <CoPilotMessageFeed {...feedProps} />
          {desktopControls}
        </section>
      </div>

      <div className="co-pilot-workspace__mobile">
        <section className="co-pilot-workspace__main">
          <CoPilotMessageFeed {...feedProps} />
          {mobileControls}
        </section>
      </div>

      <CoPilotMobileThreadDrawer
        open={mobileThreadDrawerOpen}
        groupedThreads={coPilot.groupedThreads}
        groupedAllThreads={coPilot.groupedAllThreads}
        activeThreadId={coPilot.activeThreadId ?? ""}
        isCreatingThread={coPilot.isCreatingThread}
        deletingThreadId={coPilot.deletingThreadId}
        showAllThreads={coPilot.showAllThreads}
        onClose={() => setMobileThreadDrawerOpen(false)}
        onSelect={(threadId) => {
          void coPilot.selectThread(threadId);
        }}
        onDelete={coPilot.requestDeleteThread}
        onCreateThread={() => {
          void coPilot.createNewThread();
        }}
        onViewAll={() => {
          void coPilot.openViewAllThreads();
        }}
        onCloseViewAll={() => coPilot.setShowAllThreads(false)}
      />

      <CoPilotDeleteThreadDialog
        open={coPilot.pendingDeleteThread !== null}
        threadTitle={coPilot.pendingDeleteThread?.title ?? ""}
        busy={coPilot.deletingThreadId !== null}
        onCancel={coPilot.cancelDeleteThread}
        onConfirm={() => {
          void coPilot.confirmDeleteThread();
        }}
      />
    </div>
  );
}
