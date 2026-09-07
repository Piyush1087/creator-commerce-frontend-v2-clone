const DELEGATED_INSTAGRAM_HANDOFF_PREFIX =
  "creator-shop:instagram-invite-oauth:";
const OAUTH_STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function handoffKey(state: string): string {
  if (!OAUTH_STATE_PATTERN.test(state)) {
    throw new Error("Invalid delegated Instagram OAuth state.");
  }
  return `${DELEGATED_INSTAGRAM_HANDOFF_PREFIX}${state}`;
}

export function storeDelegatedInstagramInvitation(
  state: string,
  invitationToken: string,
): void {
  if (!invitationToken) {
    throw new Error("Missing delegated Instagram invitation token.");
  }
  window.sessionStorage.setItem(handoffKey(state), invitationToken);
}

export function takeDelegatedInstagramInvitation(state: string): string | null {
  const key = handoffKey(state);
  const invitationToken = window.sessionStorage.getItem(key);
  if (invitationToken === null) {
    return null;
  }
  window.sessionStorage.removeItem(key);
  return invitationToken || null;
}

export function discardDelegatedInstagramInvitation(state: string): void {
  window.sessionStorage.removeItem(handoffKey(state));
}
