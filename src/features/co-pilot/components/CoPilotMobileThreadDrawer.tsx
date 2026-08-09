import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "../../../design-system/aurora";
import type { GroupedCoPilotThreads } from "../utils/thread-grouping";
import { CoPilotThreadList } from "./CoPilotThreadList";

const DRAWER_TRANSITION_MS = 320;

type Props = {
  open: boolean;
  groupedThreads: GroupedCoPilotThreads[];
  groupedAllThreads: GroupedCoPilotThreads[];
  activeThreadId: string;
  isCreatingThread?: boolean;
  deletingThreadId?: string | null;
  showAllThreads: boolean;
  onClose: () => void;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onCreateThread: () => void;
  onViewAll: () => void;
  onCloseViewAll: () => void;
};

export function CoPilotMobileThreadDrawer({
  open,
  groupedThreads,
  groupedAllThreads,
  activeThreadId,
  isCreatingThread,
  deletingThreadId,
  showAllThreads,
  onClose,
  onSelect,
  onDelete,
  onCreateThread,
  onViewAll,
  onCloseViewAll,
}: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, DRAWER_TRANSITION_MS);

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) {
    return null;
  }

  const handleSelect = (threadId: string) => {
    onSelect(threadId);
    onClose();
  };

  return createPortal(
    <>
      <div
        className={`co-pilot-mobile-drawer__overlay${visible ? " co-pilot-mobile-drawer__overlay--open" : ""}`}
        role="presentation"
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className={`co-pilot-mobile-drawer${visible ? " co-pilot-mobile-drawer--open" : ""}`}
        aria-label="Conversation history"
        aria-hidden={!visible}
      >
        <div className="co-pilot-mobile-drawer__header">
          <span className="co-pilot-mobile-drawer__title">Conversations</span>
          <button
            type="button"
            className="co-pilot-mobile-drawer__close"
            aria-label="Close conversation list"
            onClick={onClose}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="co-pilot-mobile-drawer__actions">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="co-pilot-thread-rail__action"
            disabled={isCreatingThread}
            onClick={onCreateThread}
          >
            {isCreatingThread ? "Creating…" : "New conversation"}
          </Button>
        </div>

        <div className="co-pilot-mobile-drawer__scroll">
          {showAllThreads ? (
            <>
              <div className="co-pilot-thread-rail__view-all-head">
                <strong>All historical logs</strong>
                <Button type="button" size="sm" variant="outline" onClick={onCloseViewAll}>
                  Close
                </Button>
              </div>
              <CoPilotThreadList
                groups={groupedAllThreads}
                activeThreadId={activeThreadId}
                deletingThreadId={deletingThreadId}
                onSelect={handleSelect}
                onDelete={onDelete}
              />
            </>
          ) : (
            <CoPilotThreadList
              groups={groupedThreads}
              activeThreadId={activeThreadId}
              deletingThreadId={deletingThreadId}
              onSelect={handleSelect}
              onDelete={onDelete}
            />
          )}
        </div>

        {!showAllThreads ? (
          <div className="co-pilot-mobile-drawer__footer">
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="co-pilot-thread-rail__action"
              onClick={onViewAll}
            >
              View all historical logs
            </Button>
          </div>
        ) : null}
      </aside>
    </>,
    document.body,
  );
}
