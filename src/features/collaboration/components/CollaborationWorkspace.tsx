import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, TextField } from "../../../design-system/aurora";
import { loadAuthSession } from "../../../shared/auth/auth-session";
import { normalizeUserRole, type UserRole } from "../../../shared/auth/user-role";
import {
  CollaborationCommandError,
  fetchCollaborationMessages,
  fetchCollaborationThread,
  fetchCollaborationThreads,
  postCollaborationMessage,
} from "../api/collaboration-client";
import type { CollaborationDetailResponse, CollaborationMessageRow, CollaborationThreadRow } from "../contracts/collaboration.contracts";
import { useCollaborationRealtime } from "../hooks/use-collaboration-realtime";
import { isCompatibilityDetail } from "../schemas/collaboration-read.schemas";
import {
  collaborationCanSendMessage,
  collaborationComposerMode,
  EMPTY_MESSAGES_COPY,
  MESSAGING_CLOSED_COPY,
} from "../utils/collaboration-composer-state";
import {
  assignCollaborationPaneError,
  clearCollaborationPaneError,
  emptyCollaborationPaneErrors,
  type CollaborationPaneErrors,
} from "../utils/collaboration-error-surface";
import { collaborationInboxIdentity } from "../utils/collaboration-inbox-identity";
import { mobileStepForResolvedDeepLink } from "../utils/collaboration-mobile-step";
import {
  collaborationThreadParams,
  readCollaborationQuerySelection,
  resolveInboxSelection,
} from "../utils/collaboration-selection";
import { actionRequiredLabel, collaborationPrimaryStatus } from "../utils/stage-labels";
import { CollaborationExecutionHub } from "./CollaborationExecutionHub";
import { BrandContextDrawer } from "./context/BrandContextDrawer";
import { CreatorContextDrawer } from "./context/CreatorContextDrawer";
import "./collaboration-workspace.css";

type MobileStep = 1 | 2 | 3;

export function CollaborationWorkspace() {
  const session = loadAuthSession();
  const role = normalizeUserRole(session?.user.role);
  if (role !== "BRAND" && role !== "CREATOR") {
    return (
      <Alert tone="warning" title="Collaboration access unavailable">
        This account does not have an operational Brand or Creator Collaboration workspace.
      </Alert>
    );
  }
  return <OperationalCollaborationWorkspace role={role} userId={session?.user.id} />;
}

function OperationalCollaborationWorkspace({
  role,
  userId,
}: {
  role: Extract<UserRole, "BRAND" | "CREATOR">;
  userId: string | undefined;
}) {
  const [params, setParams] = useSearchParams();
  const requestedThreadId = readCollaborationQuerySelection(params).requestedId;
  const [threads, setThreads] = useState<CollaborationThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedThreadId);
  const [detail, setDetail] = useState<CollaborationDetailResponse | null>(null);
  const [messages, setMessages] = useState<CollaborationMessageRow[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileStep, setMobileStep] = useState<MobileStep>(1);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [sending, setSending] = useState(false);
  const [paneErrors, setPaneErrors] = useState<CollaborationPaneErrors>(emptyCollaborationPaneErrors);
  const [stale, setStale] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const selected = threads.find((row) => row.collaborationId === selectedId) ?? null;
  const composerMode = collaborationComposerMode(detail);
  const canSend = collaborationCanSendMessage(detail, draft, sending);

  const loadThreads = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const rows = await fetchCollaborationThreads(search.trim() ? { search: search.trim() } : undefined);
      setThreads(rows);
      setPaneErrors((current) => clearCollaborationPaneError("INBOX_READ", current));
      setSelectedId((current) =>
        resolveInboxSelection(
          rows.map((row) => row.collaborationId),
          current,
          requestedThreadId,
        ),
      );
    } catch (cause) {
      setPaneErrors((current) =>
        assignCollaborationPaneError(
          "INBOX_READ",
          cause instanceof Error ? cause.message : "Failed to load collaborations.",
          current,
        ),
      );
    } finally {
      setLoadingInbox(false);
    }
  }, [requestedThreadId, search]);

  const hydrate = useCallback(async (id: string, silent = false) => {
    if (!silent) setHydrating(true);
    try {
      const [nextDetail, nextMessages] = await Promise.all([
        fetchCollaborationThread(id),
        fetchCollaborationMessages(id),
      ]);
      setDetail(nextDetail);
      setMessages(nextMessages);
      setStale(false);
      setUnavailable(false);
      setPaneErrors((current) =>
        clearCollaborationPaneError(
          "MESSAGES_READ",
          clearCollaborationPaneError("DETAIL_READ", clearCollaborationPaneError("CONTRACT_READ", current)),
        ),
      );
      setMobileStep(mobileStepForResolvedDeepLink(requestedThreadId, id, false));
    } catch (cause) {
      if (!silent && cause instanceof CollaborationCommandError && cause.status === 404 && requestedThreadId === id) {
        setUnavailable(true);
        setDetail(null);
        setMessages([]);
        setPaneErrors(emptyCollaborationPaneErrors());
        setMobileStep(mobileStepForResolvedDeepLink(requestedThreadId, id, true));
      } else if (!silent) {
        const message = cause instanceof Error ? cause.message : "Failed to load collaboration.";
        const surface =
          cause instanceof Error && cause.message.toLowerCase().includes("contract")
            ? "CONTRACT_READ"
            : "DETAIL_READ";
        setPaneErrors((current) => assignCollaborationPaneError(surface, message, current));
      }
    } finally {
      if (!silent) setHydrating(false);
    }
  }, [requestedThreadId]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedId) {
      setDetail(null);
      setMessages([]);
      setDraft("");
      setPaneErrors((current) => ({
        ...current,
        detail: null,
        messages: null,
        send: null,
        execution: null,
        contract: null,
      }));
      void hydrate(selectedId);
    } else {
      setDetail(null);
      setMessages([]);
    }
  }, [hydrate, selectedId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadThreads(), selectedId ? hydrate(selectedId, true) : Promise.resolve()]);
  }, [hydrate, loadThreads, selectedId]);

  const realtime = useCollaborationRealtime({
    enabled: Boolean(userId),
    selectedCollaborationId: selectedId,
    onThreadEvent: async (event) => {
      if (event.collaboration_id === selectedId) await hydrate(event.collaboration_id, true);
    },
    onInboxEvent: async (event) => {
      await loadThreads();
      if (event.collaboration_id === selectedId) await hydrate(event.collaboration_id, true);
    },
    onReconnect: refreshAll,
  });

  const pick = (id: string) => {
    setUnavailable(false);
    setPaneErrors(emptyCollaborationPaneErrors());
    setSelectedId(id);
    setParams(collaborationThreadParams(id));
    setMobileStep(2);
  };

  const backToCollaborations = () => {
    setUnavailable(false);
    setPaneErrors(emptyCollaborationPaneErrors());
    setParams({});
    setSelectedId(threads[0]?.collaborationId ?? null);
    setMobileStep(1);
  };

  const send = async () => {
    if (!selectedId || !canSend) return;
    const pendingDraft = draft;
    setSending(true);
    setPaneErrors((current) => clearCollaborationPaneError("MESSAGE_SEND", current));
    try {
      await postCollaborationMessage(selectedId, pendingDraft.trim());
      setDraft("");
      await hydrate(selectedId, true);
    } catch (cause) {
      setDraft(pendingDraft);
      setPaneErrors((current) =>
        assignCollaborationPaneError(
          "MESSAGE_SEND",
          cause instanceof Error ? cause.message : "Failed to send message.",
          current,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const counterpart = detail
    ? role === "BRAND"
      ? detail.identity.creator
      : detail.identity.brand
    : selected?.counterpart;

  const refreshControl =
    realtime === "degraded" ? (
      <Button variant="secondary" onClick={() => void refreshAll()}>
        Refresh
      </Button>
    ) : null;

  const listPane = (
    <>
      <div className="collab-pane__head">
        <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        {refreshControl}
      </div>
      <div className="collab-pane__scroll">
        {paneErrors.inbox ? (
          <Alert tone="error" title="Collaborations could not be loaded">
            {paneErrors.inbox}
            <Button variant="secondary" onClick={() => void loadThreads()}>
              Retry
            </Button>
          </Alert>
        ) : null}
        {loadingInbox ? <p className="collab-empty">Loading collaborations…</p> : null}
        {!loadingInbox && !threads.length && !paneErrors.inbox ? (
          <p className="collab-empty">No collaboration threads yet.</p>
        ) : null}
        {threads.map((row) => {
          const identity = collaborationInboxIdentity(row);
          return (
            <button
              type="button"
              key={row.collaborationId}
              className={`collab-thread ${row.collaborationId === selectedId ? "collab-thread--active" : ""}`}
              onClick={() => pick(row.collaborationId)}
            >
              <span className="collab-thread__avatar">{identity.title.slice(0, 1).toUpperCase()}</span>
              <span className="collab-thread__meta">
                <span className="collab-thread__title">
                  {identity.title}
                  {identity.handle ? ` · @${identity.handle.replace(/^@/, "")}` : ""}
                </span>
                <span className="collab-thread__snippet">{identity.context}</span>
                {row.inbox.lastMessageSnippet ? (
                  <span className="collab-thread__snippet">{row.inbox.lastMessageSnippet}</span>
                ) : null}
                <span className="collab-chip">{collaborationPrimaryStatus(row.lifecycle, row.workflow.stage)}</span>
                <small>
                  {row.lifecycle === "ACTIVE"
                    ? actionRequiredLabel(row.workflow.actionRequiredBy)
                    : "No execution action required"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  const currentContext = detail?.sourceContext ?? selected?.sourceContext;
  const chatPane = unavailable ? (
    <div className="collab-empty">
      <Alert tone="warning" title="Collaboration unavailable">
        This collaboration may no longer be available or you may not have access.
      </Alert>
      <Button variant="secondary" onClick={backToCollaborations}>
        Back to Collaborations
      </Button>
    </div>
  ) : selectedId && (selected || detail) ? (
    <>
      <header className="collab-chat-head">
        <button type="button" className="collab-context-trigger" onClick={() => setContextOpen(true)}>
          <h3>{counterpart?.displayName}</h3>
        </button>
        <p>
          {currentContext?.campaign.name} ·{" "}
          {detail
            ? collaborationPrimaryStatus(detail.lifecycle.state, detail.workflow.stage)
            : selected
              ? collaborationPrimaryStatus(selected.lifecycle, selected.workflow.stage)
              : null}
        </p>
        {refreshControl}
        <Button
          className="collab-show-mobile-only collab-chat-head__hub-cta"
          variant="secondary"
          onClick={() => setMobileStep(3)}
        >
          Open execution hub
        </Button>
      </header>
      <div className="collab-chat-feed">
        {paneErrors.detail || paneErrors.contract || paneErrors.messages ? (
          <Alert tone="error" title="Conversation could not be loaded">
            {paneErrors.contract ?? paneErrors.detail ?? paneErrors.messages}
            <Button variant="secondary" onClick={() => void hydrate(selectedId)}>
              Retry
            </Button>
          </Alert>
        ) : null}
        {hydrating && !detail ? <p>Loading persisted conversation…</p> : null}
        {!hydrating && detail && messages.length === 0 ? (
          <p className="collab-empty">{EMPTY_MESSAGES_COPY}</p>
        ) : null}
        {messages.map((message) =>
          message.kind === "SYSTEM" ? (
            <div key={message.message_id} className="collab-msg--system">
              {message.body}
            </div>
          ) : (
            <div
              key={message.message_id}
              className={`collab-msg--user ${message.sender_user_id === userId ? "is-mine" : "is-theirs"}`}
            >
              {message.body}
            </div>
          ),
        )}
      </div>
      {paneErrors.send ? (
        <Alert tone="error" title="Message could not be sent">
          {paneErrors.send}
        </Alert>
      ) : null}
      {composerMode === "read_only" ? (
        <div className="collab-composer collab-composer--readonly" role="status">
          <p>
            <strong>{MESSAGING_CLOSED_COPY.title}</strong>
          </p>
          <p>{MESSAGING_CLOSED_COPY.body}</p>
        </div>
      ) : (
        <div className="collab-composer" aria-busy={sending}>
          <input
            value={draft}
            disabled={sending || composerMode !== "enabled"}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message…"
            onKeyDown={(event) => {
              if (event.key === "Enter") void send();
            }}
          />
          <Button disabled={!canSend} onClick={() => void send()}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      )}
    </>
  ) : (
    <div className="collab-empty">Select a conversation</div>
  );

  const executionPane = (
    <>
      <header className="collab-pane__head collab-pane__head--execution">
        <h3>Execution hub</h3>
        {detail ? (
          <>
            <p>
              {detail.sourceContext.campaign.name} · {detail.sourceContext.brief.title}
            </p>
            <p>
              {collaborationPrimaryStatus(detail.lifecycle.state, detail.workflow.stage)} ·{" "}
              {detail.lifecycle.state === "ACTIVE"
                ? actionRequiredLabel(detail.workflow.actionRequiredBy)
                : "No execution action required"}
            </p>
          </>
        ) : null}
        {refreshControl}
      </header>
      {unavailable ? (
        <div className="collab-empty">Select an available collaboration.</div>
      ) : detail && isCompatibilityDetail(detail) ? (
        <div className="collab-pane__scroll collab-pane__scroll--execution">
          <Alert tone="warning" title="Limited collaboration details">
            Some details and actions are unavailable because this collaboration was created using an earlier
            workflow.
          </Alert>
        </div>
      ) : (
        <CollaborationExecutionHub
          role={role}
          detail={detail}
          collaborationId={selectedId}
          onRefresh={refreshAll}
          onDetailUpdated={setDetail}
          onError={(message) =>
            setPaneErrors((current) =>
              message
                ? assignCollaborationPaneError("EXECUTION_COMMAND", message, current)
                : clearCollaborationPaneError("EXECUTION_COMMAND", current),
            )
          }
          onStale={() => setStale(true)}
        />
      )}
    </>
  );

  return (
    <div className="collab-workspace">
      {realtime === "degraded" ? (
        <p className="collab-workspace__notice" role="status">
          Realtime updates temporarily unavailable. Persisted collaboration data remains available. Use Refresh to
          reload the latest saved state.
        </p>
      ) : null}
      {stale ? (
        <p className="collab-workspace__notice">This collaboration changed. Showing the latest saved state.</p>
      ) : null}
      {unavailable ? (
        <Alert tone="warning" title="Collaboration unavailable">
          This collaboration may no longer be available or you may not have access.
        </Alert>
      ) : null}
      {paneErrors.execution ? (
        <p role="alert" className="collab-workspace__alert">
          {paneErrors.execution}
        </p>
      ) : null}
      <div className="collab-workspace__desktop">
        <section className="collab-pane collab-pane--list">{listPane}</section>
        <section className="collab-pane collab-pane--chat">{chatPane}</section>
        <section className="collab-pane collab-pane--execution">{executionPane}</section>
      </div>
      <div className="collab-workspace__mobile">
        {mobileStep > 1 ? (
          <div className="collab-mobile-bar">
            <Button variant="secondary" onClick={() => setMobileStep((mobileStep - 1) as MobileStep)}>
              Back
            </Button>
            {refreshControl}
          </div>
        ) : null}
        {mobileStep === 1 ? <section className="collab-pane collab-pane--list">{listPane}</section> : null}
        {mobileStep === 2 ? <section className="collab-pane collab-pane--chat">{chatPane}</section> : null}
        {mobileStep === 3 ? <section className="collab-pane collab-pane--execution">{executionPane}</section> : null}
      </div>
      {detail && role === "BRAND" ? (
        <CreatorContextDrawer detail={detail} open={contextOpen} onClose={() => setContextOpen(false)} />
      ) : null}
      {detail && role === "CREATOR" ? (
        <BrandContextDrawer detail={detail} open={contextOpen} onClose={() => setContextOpen(false)} />
      ) : null}
    </div>
  );
}
