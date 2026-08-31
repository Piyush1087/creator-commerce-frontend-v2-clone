import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
  SendHorizontal,
  WifiOff,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, TextField } from "../../../design-system/aurora";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import {
  normalizeUserRole,
  type UserRole,
} from "../../../shared/auth/user-role";
import {
  CollaborationCommandError,
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
import {
  actionRequiredLabel,
  collaborationPrimaryStatus,
} from "../utils/stage-labels";
import { CollaborationEmptyWorkspace } from "./CollaborationEmptyWorkspace";
import { CollaborationExecutionHub } from "./CollaborationExecutionHub";
import { CollaborationStageProgress } from "./CollaborationStageProgress";
import { CampaignContextDetailsDrawer } from "../../uce/campaign-page/CampaignContextDetailsDrawer";
import { CanonicalAssetDetailsDrawer } from "../../uce/campaign-page/CanonicalAssetDetailsDrawer";
import { CanonicalBriefDetailsDrawer } from "../../uce/campaign-page/CanonicalBriefDetailsDrawer";
import { BrandContextDrawer } from "./context/BrandContextDrawer";
import { CreatorContextDrawer } from "./context/CreatorContextDrawer";
import { collaborationCanonicalContextReferences } from "../utils/collaboration-context-references";
import "./collaboration-workspace.css";

type MobileStep = 1 | 2 | 3;
type CampaignContextDetail = "campaign" | "asset" | "brief";

function formatInboxTimestamp(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMessageTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function CollaborationWorkspace() {
  const session = useAuthSession();
  const role = normalizeUserRole(session.currentUser?.role);
  if (role !== "BRAND" && role !== "CREATOR") {
    return (
      <Alert tone="warning" title="Collaboration access unavailable">
        This account does not have an operational Brand or Creator Collaboration
        workspace.
      </Alert>
    );
  }
  return (
    <OperationalCollaborationWorkspace
      role={role}
      userId={session.currentUser?.id}
    />
  );
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
  const [selectedId, setSelectedId] = useState<string | null>(
    requestedThreadId,
  );
  const [detail, setDetail] = useState<CollaborationDetailResponse | null>(
    null,
  );
  const [messages, setMessages] = useState<CollaborationMessageRow[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileStep, setMobileStep] = useState<MobileStep>(1);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [sending, setSending] = useState(false);
  const [paneErrors, setPaneErrors] = useState<CollaborationPaneErrors>(
    emptyCollaborationPaneErrors,
  );
  const [stale, setStale] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [campaignContextDetail, setCampaignContextDetail] =
    useState<CampaignContextDetail | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const selected =
    threads.find((row) => row.collaborationId === selectedId) ?? null;
  const composerMode = collaborationComposerMode(detail);
  const canSend = collaborationCanSendMessage(detail, draft, sending);
  const contextReferences = detail
    ? collaborationCanonicalContextReferences(detail)
    : { campaignId: null, campaignAssetId: null, briefId: null };

  const loadThreads = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const rows = await fetchCollaborationThreads(
        search.trim() ? { search: search.trim() } : undefined,
      );
      setThreads(rows);
      setPaneErrors((current) =>
        clearCollaborationPaneError("INBOX_READ", current),
      );
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
          cause instanceof Error
            ? cause.message
            : "Failed to load collaborations.",
          current,
        ),
      );
    } finally {
      setLoadingInbox(false);
    }
  }, [requestedThreadId, search]);

  const hydrate = useCallback(
    async (id: string, silent = false) => {
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
            clearCollaborationPaneError(
              "DETAIL_READ",
              clearCollaborationPaneError("CONTRACT_READ", current),
            ),
          ),
        );
        setMobileStep(
          mobileStepForResolvedDeepLink(requestedThreadId, id, false),
        );
      } catch (cause) {
        if (
          !silent &&
          cause instanceof CollaborationCommandError &&
          cause.status === 404 &&
          requestedThreadId === id
        ) {
          setUnavailable(true);
          setDetail(null);
          setMessages([]);
          setPaneErrors(emptyCollaborationPaneErrors());
          setMobileStep(
            mobileStepForResolvedDeepLink(requestedThreadId, id, true),
          );
        } else if (!silent) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Failed to load collaboration.";
          const surface =
            cause instanceof Error &&
            cause.message.toLowerCase().includes("contract")
              ? "CONTRACT_READ"
              : "DETAIL_READ";
          setPaneErrors((current) =>
            assignCollaborationPaneError(surface, message, current),
          );
        }
      } finally {
        if (!silent) setHydrating(false);
      }
    },
    [requestedThreadId],
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedId) {
      setContextOpen(false);
      setCampaignContextDetail(null);
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

  const openCampaignContextDetail = (target: CampaignContextDetail) => {
    setContextOpen(false);
    setCampaignContextDetail(target);
  };

  const closeCampaignContextDetail = () => {
    setCampaignContextDetail(null);
    setContextOpen(true);
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadThreads(),
      selectedId ? hydrate(selectedId, true) : Promise.resolve(),
    ]);
  }, [hydrate, loadThreads, selectedId]);

  const realtime = useCollaborationRealtime({
    enabled: Boolean(userId),
    selectedCollaborationId: selectedId,
    onThreadEvent: async (event) => {
      if (event.collaboration_id === selectedId)
        await hydrate(event.collaboration_id, true);
    },
    onInboxEvent: async (event) => {
      await loadThreads();
      if (event.collaboration_id === selectedId)
        await hydrate(event.collaboration_id, true);
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
    setPaneErrors((current) =>
      clearCollaborationPaneError("MESSAGE_SEND", current),
    );
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
        <RefreshCw size={15} aria-hidden="true" /> Refresh
      </Button>
    ) : null;

  const listPane = (
    <>
      <div className="collab-pane__head">
        <div className="collab-pane__head-row">
          <div>
            <h2 className="collab-pane__head-title">Inbox</h2>
            <p className="collab-pane__head-meta">
              {threads.length} collaborations
            </p>
          </div>
          {refreshControl}
        </div>
        <TextField
          label="Search collaborations"
          value={search}
          placeholder="Search creators or campaigns…"
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="collab-pane__scroll">
        {paneErrors.inbox ? (
          <Alert tone="error" title="Collaborations could not be loaded">
            The Inbox could not be refreshed. Previously loaded collaborations
            remain visible where available.
            <Button variant="secondary" onClick={() => void loadThreads()}>
              Retry
            </Button>
          </Alert>
        ) : null}
        {loadingInbox ? (
          <p className="collab-empty">Loading collaborations…</p>
        ) : null}
        {!loadingInbox && !threads.length && !paneErrors.inbox ? (
          <p className="collab-empty">No collaboration threads yet.</p>
        ) : null}
        {threads.map((row) => {
          const identity = collaborationInboxIdentity(row);
          const timestamp = formatInboxTimestamp(
            row.inbox.lastMessageAt ?? row.updatedAt,
          );
          return (
            <button
              type="button"
              key={row.collaborationId}
              className={`collab-thread ${row.collaborationId === selectedId ? "collab-thread--active" : ""}`}
              onClick={() => pick(row.collaborationId)}
            >
              <span className="collab-thread__avatar">
                {identity.title.slice(0, 1).toUpperCase()}
              </span>
              <span className="collab-thread__meta">
                <span className="collab-thread__topline">
                  <span className="collab-thread__title">{identity.title}</span>
                  {timestamp ? <time>{timestamp}</time> : null}
                </span>
                {identity.handle ? (
                  <span className="collab-thread__handle">
                    @{identity.handle.replace(/^@/, "")}
                  </span>
                ) : null}
                <span className="collab-thread__context">
                  {identity.context}
                </span>
                {row.inbox.lastMessageSnippet ? (
                  <span className="collab-thread__snippet">
                    {row.inbox.lastMessageSnippet}
                  </span>
                ) : null}
                <span className="collab-thread__footer">
                  <span className="collab-chip">
                    {collaborationPrimaryStatus(
                      row.lifecycle,
                      row.workflow.stage,
                    )}
                  </span>
                  <small>
                    {row.lifecycle === "ACTIVE"
                      ? actionRequiredLabel(row.workflow.actionRequiredBy)
                      : "No action required"}
                  </small>
                  {row.inbox.unreadCount > 0 ? (
                    <span
                      className="collab-thread__unread"
                      aria-label={`${row.inbox.unreadCount} unread messages`}
                    >
                      {row.inbox.unreadCount}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  const chatPane = unavailable ? (
    <div className="collab-empty">
      <Alert tone="warning" title="Collaboration unavailable">
        This collaboration may no longer be available or you may not have
        access.
      </Alert>
      <Button variant="secondary" onClick={backToCollaborations}>
        Back to Collaborations
      </Button>
    </div>
  ) : selectedId && (selected || detail) ? (
    <>
      <header className="collab-chat-head">
        <div className="collab-chat-head__primary">
          <button
            type="button"
            className="collab-context-trigger"
            onClick={() => setContextOpen(true)}
          >
            <span className="collab-chat-head__avatar">
              {(counterpart?.displayName ?? "C").slice(0, 1).toUpperCase()}
            </span>
            <span>
              <span className="collab-chat-head__title">
                {counterpart?.displayName ?? "Collaboration"}
              </span>
              {counterpart?.handle ? (
                <span className="collab-chat-head__handle">
                  @{counterpart.handle.replace(/^@/, "")}
                </span>
              ) : null}
            </span>
          </button>
          {refreshControl}
        </div>
      </header>
      <div className="collab-chat-feed">
        {detail && isCompatibilityDetail(detail) ? (
          <Alert tone="warning" title="Limited collaboration details">
            Some execution details are unavailable, but the conversation history
            remains accessible.
          </Alert>
        ) : null}
        {paneErrors.detail || paneErrors.contract || paneErrors.messages ? (
          <Alert
            tone="error"
            title={
              detail
                ? "Conversation could not be refreshed"
                : "Conversation could not be loaded"
            }
          >
            {detail
              ? `The last saved conversation remains visible. Last updated ${new Date(detail.updatedAt).toLocaleString()}.`
              : "Collaboration details are temporarily unavailable."}
            <Button
              variant="secondary"
              onClick={() => void hydrate(selectedId)}
            >
              Retry
            </Button>
          </Alert>
        ) : null}
        {hydrating && !detail ? <p>Loading persisted conversation…</p> : null}
        {!hydrating && detail && messages.length === 0 ? (
          <p className="collab-empty">{EMPTY_MESSAGES_COPY}</p>
        ) : null}
        {messages.map((message) => {
          const isMine = message.sender_user_id === userId;
          return message.kind === "SYSTEM" ? (
            <article key={message.message_id} className="collab-msg--system">
              <span className="collab-msg--system__icon" aria-hidden="true">
                <RefreshCw size={15} />
              </span>
              <span>
                <strong>Workflow update</strong>
                <span>{message.body}</span>
                <time>{formatMessageTimestamp(message.created_at)}</time>
              </span>
            </article>
          ) : (
            <article
              key={message.message_id}
              className={`collab-msg--user ${isMine ? "is-mine" : "is-theirs"}`}
            >
              <div className="collab-msg--user__bubble">{message.body}</div>
              <footer>
                <span>
                  {isMine ? "You" : (counterpart?.displayName ?? "Counterpart")}
                </span>
                <time>{formatMessageTimestamp(message.created_at)}</time>
              </footer>
            </article>
          );
        })}
      </div>
      {paneErrors.send ? (
        <Alert tone="error" title="Message could not be sent">
          Your draft is still available. Retry when you are ready.
          <Button
            variant="secondary"
            disabled={!canSend}
            onClick={() => void send()}
          >
            Retry send
          </Button>
        </Alert>
      ) : null}
      {composerMode === "read_only" ? (
        <div
          className="collab-composer collab-composer--readonly"
          role="status"
        >
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
            {sending ? (
              "Sending…"
            ) : paneErrors.send ? (
              "Retry send"
            ) : (
              <>
                <SendHorizontal size={17} aria-hidden="true" /> Send
              </>
            )}
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
        <div className="collab-pane__head-row">
          <h2 className="collab-pane__head-title">Execution Hub</h2>
          {detail ? (
            <span className="collab-execution-status">
              {collaborationPrimaryStatus(
                detail.lifecycle.state,
                detail.workflow.stage,
              )}
            </span>
          ) : null}
        </div>
        {detail ? (
          <>
            <p className="collab-pane__head-meta">
              {detail.sourceContext.campaign.name} ·{" "}
              {detail.sourceContext.brief.title}
            </p>
            <p className="collab-execution-action">
              {detail.lifecycle.state === "ACTIVE"
                ? actionRequiredLabel(detail.workflow.actionRequiredBy)
                : "No execution action required"}
            </p>
            <CollaborationStageProgress
              activeStage={detail.workflow.stage}
              lifecycle={detail.lifecycle.state}
            />
          </>
        ) : null}
        {refreshControl}
      </header>
      {unavailable ? (
        <div className="collab-empty">Select an available collaboration.</div>
      ) : hydrating && !detail ? (
        <div
          className="collab-state-surface collab-state-surface--compact"
          role="status"
        >
          <LoaderCircle
            className="collab-state-surface__spinner"
            size={28}
            aria-hidden="true"
          />
          <h3>Loading execution details</h3>
          <p>The persisted collaboration workspace is being prepared.</p>
        </div>
      ) : detail && isCompatibilityDetail(detail) ? (
        <div className="collab-pane__scroll collab-pane__scroll--execution">
          <section className="collab-state-surface collab-state-surface--limited">
            <span className="collab-state-surface__icon" aria-hidden="true">
              <AlertTriangle size={26} />
            </span>
            <p className="collab-deliverable__eyebrow">Read-only execution</p>
            <h3>Limited collaboration details</h3>
            <p>
              Some execution details and actions are unavailable for this
              collaboration. Known conversation history remains accessible.
            </p>
            <span className="collab-status-pill">
              No execution actions available
            </span>
          </section>
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
                ? assignCollaborationPaneError(
                    "EXECUTION_COMMAND",
                    message,
                    current,
                  )
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
        <div className="collab-realtime-banner" role="status">
          <WifiOff size={18} aria-hidden="true" />
          <span>
            <strong>Realtime updates are delayed.</strong> Persisted
            collaboration data remains usable while reconnection continues.
          </span>
          <Button variant="secondary" onClick={() => void refreshAll()}>
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </Button>
        </div>
      ) : null}
      {stale ? (
        <p className="collab-workspace__notice">
          This collaboration changed. Showing the latest saved state.
        </p>
      ) : null}
      <div className="collab-workspace__desktop">
        <section className="collab-pane collab-pane--list">{listPane}</section>
        {unavailable ? (
          <section className="collab-workspace__empty-surface collab-workspace__unavailable-surface">
            <span
              className="collab-workspace__empty-icon collab-workspace__empty-icon--warning"
              aria-hidden="true"
            >
              <AlertTriangle size={34} />
            </span>
            <h2>Collaboration unavailable</h2>
            <p>
              This collaboration may no longer be available or you may not have
              access. No other collaboration was selected in its place.
            </p>
            <Button variant="secondary" onClick={backToCollaborations}>
              Back to Collaborations
            </Button>
          </section>
        ) : !selectedId ? (
          <CollaborationEmptyWorkspace
            state={
              loadingInbox
                ? "loading"
                : paneErrors.inbox && threads.length === 0
                  ? "read-error"
                  : threads.length === 0
                    ? "empty-inbox"
                    : "no-selection"
            }
          />
        ) : (
          <>
            <section className="collab-pane collab-pane--chat">
              {chatPane}
            </section>
            <section className="collab-pane collab-pane--execution">
              {executionPane}
            </section>
          </>
        )}
      </div>
      <div className="collab-workspace__mobile">
        {mobileStep > 1 ? (
          <div className="collab-mobile-bar">
            <Button
              className="collab-mobile-bar__back"
              variant="ghost"
              size="sm"
              onClick={() => setMobileStep((mobileStep - 1) as MobileStep)}
            >
              <ArrowLeft size={18} aria-hidden="true" /> Back
            </Button>
            <button
              type="button"
              className="collab-mobile-bar__counterpart"
              onClick={() => setContextOpen(true)}
            >
              <span className="collab-chat-head__avatar">
                {(counterpart?.displayName ?? "C").slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{counterpart?.displayName ?? "Collaboration"}</strong>
                {counterpart?.handle ? (
                  <small>@{counterpart.handle.replace(/^@/, "")}</small>
                ) : null}
              </span>
            </button>
            {mobileStep === 2 ? (
              <Button
                className="collab-mobile-bar__switch"
                size="sm"
                onClick={() => setMobileStep(3)}
              >
                Execute
              </Button>
            ) : (
              <Button
                className="collab-mobile-bar__switch"
                variant="secondary"
                size="sm"
                onClick={() => setMobileStep(2)}
              >
                Chat
              </Button>
            )}
          </div>
        ) : null}
        {unavailable ? (
          <section className="collab-workspace__empty-surface collab-workspace__unavailable-surface">
            <span
              className="collab-workspace__empty-icon collab-workspace__empty-icon--warning"
              aria-hidden="true"
            >
              <AlertTriangle size={34} />
            </span>
            <h2>Collaboration unavailable</h2>
            <p>
              This collaboration may no longer be available or you may not have
              access. No other collaboration was selected in its place.
            </p>
            <Button variant="secondary" onClick={backToCollaborations}>
              Back to Collaborations
            </Button>
          </section>
        ) : mobileStep === 1 ? (
          <section className="collab-pane collab-pane--list">
            {listPane}
          </section>
        ) : null}
        {mobileStep === 2 ? (
          <section className="collab-pane collab-pane--chat">
            {chatPane}
          </section>
        ) : null}
        {mobileStep === 3 ? (
          <section className="collab-pane collab-pane--execution">
            {executionPane}
          </section>
        ) : null}
      </div>
      {detail && role === "BRAND" ? (
        <CreatorContextDrawer
          detail={detail}
          open={contextOpen}
          onClose={() => setContextOpen(false)}
          onOpenCampaign={
            contextReferences.campaignId
              ? () => openCampaignContextDetail("campaign")
              : undefined
          }
          onOpenCampaignAsset={
            contextReferences.campaignAssetId
              ? () => openCampaignContextDetail("asset")
              : undefined
          }
          onOpenBrief={
            contextReferences.briefId
              ? () => openCampaignContextDetail("brief")
              : undefined
          }
        />
      ) : null}
      {detail && role === "CREATOR" ? (
        <BrandContextDrawer
          detail={detail}
          open={contextOpen}
          onClose={() => setContextOpen(false)}
        />
      ) : null}
      {detail && role === "BRAND" && contextReferences.campaignId ? (
        <CampaignContextDetailsDrawer
          campaignId={contextReferences.campaignId}
          campaignName={detail.sourceContext.campaign.name}
          isOpen={campaignContextDetail === "campaign"}
          onClose={closeCampaignContextDetail}
        />
      ) : null}
      {detail &&
      role === "BRAND" &&
      contextReferences.campaignId &&
      contextReferences.campaignAssetId ? (
        <CanonicalAssetDetailsDrawer
          campaignId={contextReferences.campaignId}
          campaignAssetId={contextReferences.campaignAssetId}
          campaignName={detail.sourceContext.campaign.name}
          isOpen={campaignContextDetail === "asset"}
          onClose={closeCampaignContextDetail}
        />
      ) : null}
      {detail &&
      role === "BRAND" &&
      contextReferences.campaignId &&
      contextReferences.campaignAssetId &&
      contextReferences.briefId ? (
        <CanonicalBriefDetailsDrawer
          campaignId={contextReferences.campaignId}
          campaignAssetId={contextReferences.campaignAssetId}
          briefId={contextReferences.briefId}
          campaignName={detail.sourceContext.campaign.name}
          isOpen={campaignContextDetail === "brief"}
          onClose={closeCampaignContextDetail}
        />
      ) : null}
    </div>
  );
}
