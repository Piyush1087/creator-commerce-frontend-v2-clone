import {
  getAuthSessionSnapshot,
  subscribeToAuthSession,
} from "../../../shared/auth/auth-session";
import type { CreatorWorkspaceActorContext } from "../../../shared/creator/creator-workspace-actor.contract";

const scopes = new Set<CampaignScope>();
export function invalidateCampaignScopes() {
  scopes.forEach((scope) => scope.clear());
}

export function sessionIdentity() {
  const user = getAuthSessionSnapshot().currentUser;
  return user
    ? JSON.stringify([
        user.id,
        user.sessionId ?? null,
        user.organizationId ?? null,
      ])
    : "anonymous";
}
export function actorIdentity(actor: CreatorWorkspaceActorContext) {
  return JSON.stringify([
    actor.actorUserId,
    actor.actorMembershipId,
    actor.actorRole,
    actor.workspaceId,
    actor.organizationId,
    actor.subjectCreatorProfileId,
    actor.subjectOwnerUserId,
    actor.allowedActions,
  ]);
}
/** Each mounted authority owns requests and memory. Never a durable payload cache. */
export class CampaignScope {
  private controller = new AbortController();
  private listeners = new Set<() => void>();
  private unsubscribe?: () => void;
  private identity = sessionIdentity();
  private activate() {
    if (this.unsubscribe) return;
    scopes.add(this);
    this.unsubscribe = subscribeToAuthSession(() => {
      if (sessionIdentity() !== this.identity) this.clear();
    });
  }
  get signal() {
    return this.controller.signal;
  }
  getSnapshot = () => !this.signal.aborted;
  subscribe = (listener: () => void) => {
    this.activate();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  assertCurrent() {
    this.activate();
    if (sessionIdentity() !== this.identity) this.clear();
    if (this.signal.aborted)
      throw new DOMException("Access changed", "AbortError");
  }
  clear = () => {
    if (this.signal.aborted) return;
    this.controller.abort();
    this.listeners.forEach((listener) => listener());
  };
  dispose() {
    this.clear();
    this.unsubscribe?.();
    scopes.delete(this);
  }
}
