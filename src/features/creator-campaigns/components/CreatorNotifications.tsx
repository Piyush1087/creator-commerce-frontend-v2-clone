import { useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, SideDrawer } from "../../../design-system/aurora";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import {
  fetchNotifications,
  fetchUnread,
  markAllRead,
  markRead,
} from "../api/c03-client";
import { actorIdentity, sessionIdentity } from "../api/c03-scope";
import { useCampaignResource } from "../hooks/use-c03-resource";
import { messageForError } from "../utils/c03-errors";
import { ScopedCampaigns, useCampaignScope } from "./CampaignAuthority";
import { DateValue } from "./CampaignContent";

function UnavailableBell() {
  return (
    <button
      className="aurora-header__btn c03-notification-bell"
      type="button"
      disabled
      aria-label="Notifications unavailable until workspace access is verified"
    >
      <Bell size={18} aria-hidden />
    </button>
  );
}
export function CreatorNotifications() {
  const actor = useCreatorWorkspaceActorState();
  if (actor?.status !== "READY") return <UnavailableBell />;
  const authority = sessionIdentity() + actorIdentity(actor.actorContext);
  return (
    <ScopedCampaigns
      key={authority}
      authority={authority}
      fallback={<UnavailableBell />}
    >
      <NotificationBell />
    </ScopedCampaigns>
  );
}
function NotificationBell() {
  const count = useCampaignResource(fetchUnread);
  const [open, setOpen] = useState(false);
  const unread = count.data?.unread_count;
  return (
    <>
      <button
        type="button"
        className="aurora-header__btn c03-notification-bell"
        aria-label={`Notifications${unread === undefined ? ", unread count unavailable" : `, ${unread} unread`}`}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          void count.refresh();
        }}
      >
        <Bell size={18} aria-hidden />
        {unread !== undefined && unread > 0 && (
          <span className="c03-notification-count" aria-hidden>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          onClose={() => setOpen(false)}
          unread={unread}
          refreshCount={count.refresh}
        />
      )}
    </>
  );
}
function NotificationPanel({
  onClose,
  unread,
  refreshCount,
}: {
  onClose: () => void;
  unread: number | undefined;
  refreshCount: () => Promise<void>;
}) {
  const scope = useCampaignScope();
  const resource = useCampaignResource(fetchNotifications);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const change = async (id?: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (id) await markRead(scope, id);
      else await markAllRead(scope);
      scope.assertCurrent();
      setNotice(
        id ? "Notification marked as read." : "Notifications marked as read.",
      );
      await Promise.all([resource.refresh(), refreshCount()]);
    } catch (failure) {
      if (!scope.signal.aborted) setError(failure);
    } finally {
      if (!scope.signal.aborted) setBusy(false);
    }
  };
  return (
    <SideDrawer
      isOpen
      title="Notifications"
      subtitle="Recent notifications for this Creator workspace"
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close notifications
        </Button>
      }
    >
      <div className="c03-content">
        <p>
          {unread === undefined
            ? "Unread count unavailable"
            : `${unread} unread`}
        </p>
        <div className="cc-detail-cta-row">
          <Button
            variant="outline"
            disabled={resource.loading || busy}
            onClick={() => {
              void resource.refresh();
              void refreshCount();
            }}
          >
            Refresh notifications
          </Button>
          <Button
            variant="outline"
            disabled={busy || resource.loading || !resource.data}
            onClick={() => void change()}
          >
            Mark all read
          </Button>
        </div>
        {resource.loading && <p role="status">Loading notifications…</p>}
        {notice && <p role="status">{notice}</p>}
        {!!(error || resource.error) && (
          <p role="alert">{messageForError(error || resource.error)}</p>
        )}
        {resource.data && (
          <>
            {resource.data.notifications.length === 0 ? (
              <p role="status">No recent notifications.</p>
            ) : (
              <ol className="c03-list">
                {resource.data.notifications.map((item) => (
                  <li className="cc-detail-panel" key={item.id}>
                    <h3>
                      {item.event_type === "campaigns.application_approved"
                        ? "Application approved"
                        : "Application rejected"}
                    </h3>
                    <p>
                      {item.is_read ? "Read" : "Unread"} ·{" "}
                      <DateValue value={item.created_at} />
                    </p>
                    <Link
                      className="aurora-button aurora-button--outline"
                      to={`/creator/campaigns/applications/${item.payload.application_id}`}
                      onClick={onClose}
                    >
                      View Application
                    </Link>
                    {!item.is_read && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void change(item.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <p className="cc-muted">
              Showing up to 50 recent notifications. This is not a complete
              archive.
            </p>
          </>
        )}
      </div>
    </SideDrawer>
  );
}
