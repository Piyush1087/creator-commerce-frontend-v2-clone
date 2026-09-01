import { BrandHomeBriefingWorkspace } from "../../../features/brand-dashboard/components/brand-home-briefing-workspace";
import { BrandHomeChatMobile } from "../../../features/chat/components/brand-home-chat-mobile";
import { BrandHomeChatPanel } from "../../../features/chat/components/brand-home-chat-panel";
import { ChatConversationDrawer } from "../../../features/chat/components/chat-conversation-drawer";
import { useBrandChat } from "../../../features/chat/hooks/use-brand-chat";
import "../../../features/creator-centre/creator-centre.css";
import "../../../features/brand-dashboard/brand-dashboard-home.css";
import "../../../features/chat/chat.css";

/**
 * Brand Home — preserved static Daily Briefing (70%) + permanent Chat (30%).
 */
export function BrandDashboardPage() {
  const chat = useBrandChat();
  const openChats = () => chat.setConversationDrawerOpen(true);
  const closeChats = () => chat.setConversationDrawerOpen(false);

  return (
    <div className="bdash-home-page">
      <div className="cctr-home-split">
        <div className="cctr-home-split__main">
          <BrandHomeBriefingWorkspace />
        </div>
        <div className="cctr-home-split__assistant">
          <BrandHomeChatPanel chat={chat} onOpenChats={openChats} />
        </div>
      </div>

      <BrandHomeChatMobile chat={chat} onOpenChats={openChats} />

      <ChatConversationDrawer
        open={chat.conversationDrawerOpen}
        conversations={chat.conversations}
        activeConversationId={chat.activeConversationId}
        isCreatingConversation={chat.isCreatingConversation}
        archivingConversationId={chat.archivingConversationId}
        disabled={chat.isSending}
        onClose={closeChats}
        onSelect={(conversationId) => {
          void chat.selectConversation(conversationId);
        }}
        onArchive={(conversationId) => {
          void chat.archiveConversation(conversationId);
        }}
        onCreate={() => {
          void chat.createNewConversation();
        }}
      />
    </div>
  );
}
