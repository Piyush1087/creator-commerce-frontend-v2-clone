import {
  getAuthSessionSnapshot,
  subscribeToAuthSession,
} from "../../../shared/auth/auth-session";
import type { CreatorWorkspaceActorContext } from "../../../shared/creator/creator-workspace-actor.contract";

const scopes = new Set<CampaignScope>();
const attempts = new Map<string, string>();
let commandAuthority = "";
export function invalidateCampaignScopes() {
  attempts.clear();
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
  private pending = 0;
  private disposed = false;
  constructor(readonly authority = sessionIdentity()) {}
  private activate() {
    if (this.unsubscribe) return;
    if (commandAuthority !== this.authority) {
      attempts.clear();
      scopes.forEach((scope) => {
        if (scope.authority !== this.authority) scope.clear();
      });
      commandAuthority = this.authority;
    }
    scopes.add(this);
    this.unsubscribe = subscribeToAuthSession(() => {
      if (sessionIdentity() !== this.identity) {
        attempts.clear();
        this.clear();
      }
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
  begin() {
    this.assertCurrent();
    this.pending++;
  }
  end() {
    this.pending--;
    if (this.disposed && this.pending === 0) this.finishDispose();
  }
  command(intent: string, create: () => string) {
    this.assertCurrent();
    const key = `${this.authority}:${intent}`;
    let value = attempts.get(key);
    if (!value) {
      value = create();
      attempts.set(key, value);
    }
    return value;
  }
  finishCommand(intent: string) {
    attempts.delete(`${this.authority}:${intent}`);
  }
  clear = () => {
    if (this.signal.aborted) return;
    this.controller.abort();
    this.listeners.forEach((listener) => listener());
  };
  dispose() {
    this.disposed = true;
    // Shared RequireAuth temporarily unmounts during its single 401 refresh.
    // Keep in-flight commands subscribed to identity changes through that retry.
    if (this.pending > 0 && getAuthSessionSnapshot().status === "REFRESHING")
      return;
    this.finishDispose();
  }
  private finishDispose() {
    this.clear();
    this.unsubscribe?.();
    scopes.delete(this);
  }
}
