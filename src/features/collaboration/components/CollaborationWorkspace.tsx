import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button, TextField } from "../../../design-system/aurora";
import { loadAuthSession } from "../../../shared/auth/auth-session";
import { normalizeUserRole } from "../../../shared/auth/user-role";
import type { UserRole } from "../../../shared/auth/user-role";
import {
  fetchCollaborationMessages,
  fetchCollaborationThread,
  fetchCollaborationThreads,
  postCollaborationMessage,
} from "../api/collaboration-client";
import type {
  CollaborationDetailResponse,
  CollaborationMessageRow,
  CollaborationThreadRow,
} from "../contracts/collaboration.contracts";
import {
  collaborationStageChip,
  collaborationStageProgress,
} from "../utils/stage-labels";
import { useCollaborationRealtime } from "../hooks/use-collaboration-realtime";
import { CollaborationExecutionHub } from "./CollaborationExecutionHub";
import "./collaboration-workspace.css";

type MobileStep = 1 | 2 | 3;

export function CollaborationWorkspace() {
  const [searchParams] = useSearchParams();
  const threadFromUrl = searchParams.get("thread");
  const session = loadAuthSession();
  const role = normalizeUserRole(session?.user.role) ?? "BRAND";
  const userId = session?.user.id;
  const [threads, setThreads] = useState<CollaborationThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(threadFromUrl);
  const [detail, setDetail] = useState<CollaborationDetailResponse | null>(null);
  const [messages, setMessages] = useState<CollaborationMessageRow[]>([]);
  const [search, setSearch] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [mobileStep, setMobileStep] = useState<MobileStep>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selected = threads.find((t) => t.collaboration_id === selectedId);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchCollaborationThreads(
        search.trim() ? { search: search.trim() } : undefined,
      );
      setThreads(rows);
      const preferred =
        threadFromUrl && rows.some((r) => r.collaboration_id === threadFromUrl)
          ? threadFromUrl
          : selectedId;
      if (rows.length > 0 && !preferred) {
        setSelectedId(rows[0].collaboration_id);
      } else if (preferred && rows.some((r) => r.collaboration_id === preferred)) {
        setSelectedId(preferred);
        if (
          threadFromUrl === preferred &&
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 1023px)").matches
        ) {
          setMobileStep(2);
        }
      } else if (selectedId && !rows.some((r) => r.collaboration_id === selectedId)) {
        setSelectedId(rows[0]?.collaboration_id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load threads.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedId, threadFromUrl]);

  const loadThreadDetail = useCallback(async (id: string, options?: { silent?: boolean }) => {
    try {
      const [d, m] = await Promise.all([
        fetchCollaborationThread(id),
        fetchCollaborationMessages(id),
      ]);
      setDetail(d);
      setMessages(m);
      setThreads((prev) =>
        prev.map((row) =>
          row.collaboration_id === id
            ? {
                ...row,
                current_stage: d.thread.currentStage,
                last_message_snippet:
                  m.length > 0 ? m[m.length - 1].body.slice(0, 200) : row.last_message_snippet,
              }
            : row,
        ),
      );
    } catch (e) {
      if (!options?.silent) {
        setError(e instanceof Error ? e.message : "Failed to load thread.");
      }
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedId) {
      void loadThreadDetail(selectedId);
    } else {
      setDetail(null);
      setMessages([]);
    }
  }, [selectedId, loadThreadDetail]);

  const refreshAll = useCallback(() => {
    void loadThreads();
    if (selectedId) {
      void loadThreadDetail(selectedId);
    }
  }, [loadThreadDetail, loadThreads, selectedId]);

  const silentInboxSync = useCallback(
    async (collaborationId: string) => {
      try {
        const rows = await fetchCollaborationThreads(
          search.trim() ? { search: search.trim() } : undefined,
        );
        setThreads(rows);
        if (selectedId === collaborationId) {
          await loadThreadDetail(collaborationId, { silent: true });
        }
      } catch {
        /* background realtime sync — ignore transient failures */
      }
    },
    [loadThreadDetail, search, selectedId],
  );

  useCollaborationRealtime({
    enabled: Boolean(userId),
    selectedCollaborationId: selectedId,
    onThreadEvent: async (payload) => {
      if (payload.collaboration_id === selectedId) {
        await loadThreadDetail(payload.collaboration_id, { silent: true });
      }
    },
    onInboxEvent: async (payload) => {
      await silentInboxSync(payload.collaboration_id);
    },
  });

  const handleSendMessage = async () => {
    if (!selectedId || !messageDraft.trim()) {
      return;
    }
    try {
      await postCollaborationMessage(selectedId, messageDraft.trim());
      setMessageDraft("");
      await loadThreadDetail(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message.");
    }
  };

  const pickThread = (id: string) => {
    setSelectedId(id);
    setMobileStep(2);
  };

  const threadTitle = (row: CollaborationThreadRow) => {
    if (role === "CREATOR") {
      return row.brand_name;
    }
    const handle = row.creator_handle ?? "creator";
    return row.creator_display_name
      ? `${row.creator_display_name} (@${handle})`
      : `@${handle}`;
  };

  const listPane = (
    <>
      <div className="collab-pane__head">
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="collab-pane__scroll">
        {loading ? <p className="collab-empty">Loading…</p> : null}
        {!loading && threads.length === 0 ? (
          <p className="collab-empty">
            No collaboration threads yet.
            {role === "BRAND"
              ? " Approve an applicant in Campaigns to start one."
              : " Ask a brand to approve you on a campaign."}
          </p>
        ) : null}
        {threads.map((row) => (
          <div
            key={row.collaboration_id}
            className={`collab-thread ${row.collaboration_id === selectedId ? "collab-thread--active" : ""}`}
            onClick={() => pickThread(row.collaboration_id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") pickThread(row.collaboration_id);
            }}
            role="button"
            tabIndex={0}
          >
            <div className="collab-thread__avatar">
              {(role === "CREATOR" ? row.brand_name : row.creator_handle ?? "C")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="collab-thread__meta">
              <p className="collab-thread__title">{threadTitle(row)}</p>
              <p className="collab-thread__snippet">
                {row.last_message_snippet ?? row.campaign_name}
              </p>
              <span className="collab-chip">
                {collaborationStageChip(row.current_stage)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const chatPane = selected ? (
    <>
      <div className="collab-chat-head">
        <h3 className="collab-chat-head__title">{threadTitle(selected)}</h3>
        <p className="collab-chat-head__meta">
          {selected.campaign_name} ·{" "}
          {collaborationStageChip(detail?.thread.currentStage ?? selected.current_stage)}
        </p>
        <Button
          className="collab-show-mobile-only collab-chat-head__hub-cta"
          variant="secondary"
          onClick={() => setMobileStep(3)}
        >
          Open execution hub
        </Button>
      </div>
      <div className="collab-chat-feed">
        {messages.map((msg) =>
          msg.kind === "SYSTEM" ? (
            <div key={msg.message_id} className="collab-msg--system">
              {msg.body}
            </div>
          ) : (
            <div
              key={msg.message_id}
              className={`collab-msg--user ${
                msg.sender_user_id === userId ? "is-mine" : "is-theirs"
              }`}
            >
              {msg.body}
            </div>
          ),
        )}
      </div>
      <div className="collab-composer">
        <input
          value={messageDraft}
          onChange={(e) => setMessageDraft(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSendMessage();
          }}
        />
        <Button onClick={() => void handleSendMessage()}>Send</Button>
      </div>
    </>
  ) : (
    <div className="collab-empty">Select a conversation</div>
  );

  const executionPane = (
    <>
      <div className="collab-pane__head collab-pane__head--execution">
        <h3 className="collab-pane__head-title">Execution hub</h3>
        {detail ? (
          <>
            <p className="collab-pane__head-meta">
              {detail.thread.campaign.name} · {detail.thread.brief.internalTitle}
            </p>
            <p className="collab-pane__head-meta">
              {collaborationStageProgress(detail.thread.currentStage)}% through workflow
            </p>
          </>
        ) : null}
      </div>
      <CollaborationExecutionHub
        role={role as UserRole}
        detail={detail}
        collaborationId={selectedId}
        onRefresh={refreshAll}
        onDetailUpdated={setDetail}
        onError={setError}
      />
    </>
  );

  return (
    <div className="collab-workspace">
      {error ? (
        <p role="alert" className="collab-workspace__alert">
          {error}
        </p>
      ) : null}

      <div className="collab-workspace__desktop">
        <section className="collab-pane collab-pane--list">{listPane}</section>
        <section className="collab-pane collab-pane--chat">{chatPane}</section>
        <section className="collab-pane collab-pane--execution">{executionPane}</section>
      </div>

      <div className="collab-workspace__mobile">
        {mobileStep > 1 ? (
          <div className="collab-mobile-bar collab-show-mobile-only">
            <Button
              variant="secondary"
              onClick={() => setMobileStep((mobileStep - 1) as MobileStep)}
            >
              Back
            </Button>
          </div>
        ) : null}
        {mobileStep === 1 ? (
          <section className="collab-pane collab-pane--list">{listPane}</section>
        ) : null}
        {mobileStep === 2 ? (
          <section className="collab-pane collab-pane--chat">{chatPane}</section>
        ) : null}
        {mobileStep === 3 ? (
          <section className="collab-pane collab-pane--execution">{executionPane}</section>
        ) : null}
      </div>
    </div>
  );
}
