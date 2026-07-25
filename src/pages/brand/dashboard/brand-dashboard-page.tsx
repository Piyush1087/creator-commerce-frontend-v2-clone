import { useState } from "react";

import { BrandHomeAssistantMobile } from "../../../features/brand-dashboard/components/brand-home-assistant-mobile";
import { BrandHomeAssistantPanel } from "../../../features/brand-dashboard/components/brand-home-assistant-panel";
import { BrandHomeBriefingWorkspace } from "../../../features/brand-dashboard/components/brand-home-briefing-workspace";
import { CoPilotDeleteThreadDialog } from "../../../features/co-pilot/components/CoPilotDeleteThreadDialog";
import { CoPilotMobileThreadDrawer } from "../../../features/co-pilot/components/CoPilotMobileThreadDrawer";
import { useBrandCoPilot } from "../../../features/co-pilot/hooks/use-brand-co-pilot";
import "../../../features/creator-centre/creator-centre.css";
import "../../../features/co-pilot/co-pilot.css";
import "../../../features/brand-dashboard/brand-dashboard-home.css";

/**
 * Brand Home — static Daily Briefing (70%) + live Brand Co-Pilot (30%).
 * Recent chats use the existing sliding drawer (rail parity).
 */
export function BrandDashboardPage() {
  const coPilot = useBrandCoPilot();
  const [chatsDrawerOpen, setChatsDrawerOpen] = useState(false);

  const openChats = () => setChatsDrawerOpen(true);
  const closeChats = () => {
    setChatsDrawerOpen(false);
    coPilot.setShowAllThreads(false);
  };

  return (
    <div className="bdash-home-page">
      <div className="cctr-home-split">
        <div className="cctr-home-split__main">
          <BrandHomeBriefingWorkspace />
        </div>
        <div className="cctr-home-split__assistant">
          <BrandHomeAssistantPanel
            coPilot={coPilot}
            variant="desktop"
            onOpenChats={openChats}
          />
        </div>
      </div>

      <BrandHomeAssistantMobile coPilot={coPilot} onOpenChats={openChats} />

      <CoPilotMobileThreadDrawer
        open={chatsDrawerOpen}
        groupedThreads={coPilot.groupedThreads}
        groupedAllThreads={coPilot.groupedAllThreads}
        activeThreadId={coPilot.activeThreadId ?? ""}
        isCreatingThread={coPilot.isCreatingThread}
        deletingThreadId={coPilot.deletingThreadId}
        showAllThreads={coPilot.showAllThreads}
        onClose={closeChats}
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
