import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, TextField } from "../../../design-system/aurora";
import { loadAuthSession } from "../../../shared/auth/auth-session";
import { normalizeUserRole, type UserRole } from "../../../shared/auth/user-role";
import { fetchCollaborationMessages, fetchCollaborationThread, fetchCollaborationThreads, postCollaborationMessage } from "../api/collaboration-client";
import type { CollaborationDetailResponse, CollaborationMessageRow, CollaborationThreadRow } from "../contracts/collaboration.contracts";
import { useCollaborationRealtime } from "../hooks/use-collaboration-realtime";
import { actionRequiredLabel, collaborationPrimaryStatus } from "../utils/stage-labels";
import { CollaborationExecutionHub } from "./CollaborationExecutionHub";
import { BrandContextDrawer } from "./context/BrandContextDrawer";
import { CreatorContextDrawer } from "./context/CreatorContextDrawer";
import "./collaboration-workspace.css";

type MobileStep = 1 | 2 | 3;
export function CollaborationWorkspace() {
  const [params, setParams] = useSearchParams();
  const requestedThreadId = params.get("thread") ?? params.get("collaboration");
  const session = loadAuthSession(); const role = (normalizeUserRole(session?.user.role) ?? "BRAND") as UserRole; const userId = session?.user.id;
  const [threads, setThreads] = useState<CollaborationThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedThreadId);
  const [detail, setDetail] = useState<CollaborationDetailResponse | null>(null);
  const [messages, setMessages] = useState<CollaborationMessageRow[]>([]);
  const [search, setSearch] = useState(""); const [draft, setDraft] = useState(""); const [mobileStep, setMobileStep] = useState<MobileStep>(1);
  const [loadingInbox, setLoadingInbox] = useState(true); const [hydrating, setHydrating] = useState(false); const [error, setError] = useState<string | null>(null); const [stale, setStale] = useState(false); const [contextOpen, setContextOpen] = useState(false);
  const selected = threads.find((row) => row.collaborationId === selectedId) ?? null;

  const loadThreads = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const rows = await fetchCollaborationThreads(search.trim() ? { search: search.trim() } : undefined); setThreads(rows);
      setSelectedId((current) => {
        const deepLink = params.get("thread") ?? params.get("collaboration"); const preferred = deepLink && rows.some((row) => row.collaborationId === deepLink) ? deepLink : current;
        return preferred && rows.some((row) => row.collaborationId === preferred) ? preferred : rows[0]?.collaborationId ?? null;
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to load collaborations."); }
    finally { setLoadingInbox(false); }
  }, [params, search]);

  const hydrate = useCallback(async (id: string, silent = false) => {
    if (!silent) setHydrating(true);
    try { const [nextDetail, nextMessages] = await Promise.all([fetchCollaborationThread(id), fetchCollaborationMessages(id)]); setDetail(nextDetail); setMessages(nextMessages); setStale(false); }
    catch (cause) { if (!silent) setError(cause instanceof Error ? cause.message : "Failed to load collaboration."); }
    finally { if (!silent) setHydrating(false); }
  }, []);

  useEffect(() => { void loadThreads(); }, [loadThreads]);
  useEffect(() => { if (selectedId) { setDetail(null); setMessages([]); void hydrate(selectedId); } else { setDetail(null); setMessages([]); } }, [hydrate, selectedId]);
  const refreshAll = useCallback(async () => {
    await Promise.all([loadThreads(), selectedId ? hydrate(selectedId, true) : Promise.resolve()]);
  }, [hydrate, loadThreads, selectedId]);
  const realtime = useCollaborationRealtime({ enabled: Boolean(userId), selectedCollaborationId: selectedId, onThreadEvent: async (event) => { if (event.collaboration_id === selectedId) await hydrate(event.collaboration_id, true); }, onInboxEvent: async (event) => { await loadThreads(); if (event.collaboration_id === selectedId) await hydrate(event.collaboration_id, true); }, onReconnect: refreshAll });

  const pick = (id: string) => { setSelectedId(id); setParams({ thread: id }); setMobileStep(2); };
  const send = async () => { if (!selectedId || !draft.trim()) return; try { await postCollaborationMessage(selectedId, draft.trim()); setDraft(""); await hydrate(selectedId, true); } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to send message."); } };
  const counterpart = detail ? (role === "BRAND" ? detail.identity.creator : detail.identity.brand) : selected?.counterpart;

  const listPane = <><div className="collab-pane__head"><TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="collab-pane__scroll">
    {loadingInbox ? <p className="collab-empty">Loading collaborations…</p> : null}
    {!loadingInbox && !threads.length ? <p className="collab-empty">No collaboration threads yet.</p> : null}
    {threads.map((row) => <button type="button" key={row.collaborationId} className={`collab-thread ${row.collaborationId === selectedId ? "collab-thread--active" : ""}`} onClick={() => pick(row.collaborationId)}>
      <span className="collab-thread__avatar">{(row.counterpart.displayName ?? "C").slice(0, 1).toUpperCase()}</span><span className="collab-thread__meta"><span className="collab-thread__title">{row.counterpart.displayName}</span><span className="collab-thread__snippet">{row.inbox.lastMessageSnippet ?? row.sourceContext.campaign.name}</span><span className="collab-chip">{collaborationPrimaryStatus(row.lifecycle, row.workflow.stage)}</span><small>{row.lifecycle === "ACTIVE" ? actionRequiredLabel(row.workflow.actionRequiredBy) : "No execution action required"}</small></span>
    </button>)}
  </div></>;

  const chatPane = selected ? <><header className="collab-chat-head"><button type="button" className="collab-context-trigger" onClick={() => setContextOpen(true)}><h3>{counterpart?.displayName}</h3></button><p>{selected.sourceContext.campaign.name} · {detail ? collaborationPrimaryStatus(detail.lifecycle.state, detail.workflow.stage) : collaborationPrimaryStatus(selected.lifecycle, selected.workflow.stage)}</p><Button className="collab-show-mobile-only collab-chat-head__hub-cta" variant="secondary" onClick={() => setMobileStep(3)}>Open execution hub</Button></header>
    <div className="collab-chat-feed">{hydrating && !detail ? <p>Loading persisted conversation…</p> : messages.map((message) => message.kind === "SYSTEM" ? <div key={message.message_id} className="collab-msg--system">{message.body}</div> : <div key={message.message_id} className={`collab-msg--user ${message.sender_user_id === userId ? "is-mine" : "is-theirs"}`}>{message.body}</div>)}</div>
    <div className="collab-composer"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message…" onKeyDown={(event) => { if (event.key === "Enter") void send(); }} /><Button onClick={() => void send()}>Send</Button></div>
  </> : <div className="collab-empty">Select a conversation</div>;

  const executionPane = <><header className="collab-pane__head collab-pane__head--execution"><h3>Execution hub</h3>{detail ? <><p>{detail.sourceContext.campaign.name} · {detail.sourceContext.brief.title}</p><p>{collaborationPrimaryStatus(detail.lifecycle.state, detail.workflow.stage)} · {detail.lifecycle.state === "ACTIVE" ? actionRequiredLabel(detail.workflow.actionRequiredBy) : "No execution action required"}</p></> : null}</header><CollaborationExecutionHub role={role} detail={detail} collaborationId={selectedId} onRefresh={refreshAll} onDetailUpdated={setDetail} onError={setError} onStale={() => setStale(true)} /></>;

  return <div className="collab-workspace">
    {realtime === "degraded" ? <p className="collab-workspace__notice" role="status">Realtime updates temporarily unavailable. Persisted collaboration data remains available.</p> : null}
    {stale ? <p className="collab-workspace__notice">This collaboration changed. Showing the latest saved state.</p> : null}
    {error ? <p role="alert" className="collab-workspace__alert">{error}</p> : null}
    <div className="collab-workspace__desktop"><section className="collab-pane collab-pane--list">{listPane}</section><section className="collab-pane collab-pane--chat">{chatPane}</section><section className="collab-pane collab-pane--execution">{executionPane}</section></div>
    <div className="collab-workspace__mobile">{mobileStep > 1 ? <div className="collab-mobile-bar"><Button variant="secondary" onClick={() => setMobileStep((mobileStep - 1) as MobileStep)}>Back</Button></div> : null}{mobileStep === 1 ? <section className="collab-pane collab-pane--list">{listPane}</section> : null}{mobileStep === 2 ? <section className="collab-pane collab-pane--chat">{chatPane}</section> : null}{mobileStep === 3 ? <section className="collab-pane collab-pane--execution">{executionPane}</section> : null}</div>
    {detail && role === "BRAND" ? <CreatorContextDrawer detail={detail} open={contextOpen} onClose={() => setContextOpen(false)} /> : null}
    {detail && role === "CREATOR" ? <BrandContextDrawer detail={detail} open={contextOpen} onClose={() => setContextOpen(false)} /> : null}
  </div>;
}
