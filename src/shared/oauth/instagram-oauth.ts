const OAUTH_STATE_KEY = "creator_instagram_oauth_state";
const OAUTH_FLOW_KEY = "creator_instagram_oauth_flow";

export function generateOAuthState(): string {
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function isMobileDevice(): boolean {
  if (window.opener) {
    return false;
  }
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUa =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  return isMobileUa || window.innerWidth <= 600;
}

function oauthStorage(): Storage {
  return isMobileDevice() ? localStorage : sessionStorage;
}

export function storeInstagramOAuthState(state: string): void {
  oauthStorage().setItem(
    OAUTH_STATE_KEY,
    JSON.stringify({ state, timestamp: Date.now() }),
  );
}

export function getStoredInstagramOAuthState(): string | null {
  try {
    const stored = oauthStorage().getItem(OAUTH_STATE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as { state?: string; timestamp?: number };
    if (!parsed.state || !parsed.timestamp) {
      removeInstagramOAuthState();
      return null;
    }
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      removeInstagramOAuthState();
      return null;
    }
    return parsed.state;
  } catch {
    removeInstagramOAuthState();
    return null;
  }
}

export function removeInstagramOAuthState(): void {
  oauthStorage().removeItem(OAUTH_STATE_KEY);
}

export function validateInstagramOAuthState(receivedState: string | null): boolean {
  const stored = getStoredInstagramOAuthState();
  return Boolean(receivedState && stored && receivedState === stored);
}

export function setInstagramOAuthFlow(flow: "onboarding" | "reconnect"): void {
  sessionStorage.setItem(OAUTH_FLOW_KEY, flow);
}

export function clearInstagramOAuthFlow(): void {
  sessionStorage.removeItem(OAUTH_FLOW_KEY);
}

function openCenteredPopup(url: string, name: string, width: number, height: number): Window | null {
  const screenWidth = window.screen.availWidth || window.screen.width || 1920;
  const screenHeight = window.screen.availHeight || window.screen.height || 1080;
  const adjustedWidth = Math.min(width, screenWidth - 100);
  const adjustedHeight = Math.min(height, screenHeight - 100);
  const left = Math.max(0, Math.round((screenWidth - adjustedWidth) / 2));
  const top = Math.max(0, Math.round((screenHeight - adjustedHeight) / 2));
  const features = [
    `width=${adjustedWidth}`,
    `height=${adjustedHeight}`,
    `left=${left}`,
    `top=${top}`,
    "scrollbars=yes",
    "resizable=yes",
    "toolbar=no",
    "menubar=no",
    "location=no",
    "status=no",
  ].join(",");
  const popup = window.open(url, name, features);
  if (popup) {
    window.setTimeout(() => {
      try {
        popup.moveTo(left, top);
      } catch {
        // Some browsers block moveTo on popups.
      }
    }, 100);
  }
  return popup;
}

export function openInstagramOAuth(url: string): void {
  if (isMobileDevice()) {
    window.location.href = url;
    return;
  }
  const popup = openCenteredPopup(url, "creator_instagram_oauth", 600, 700);
  if (!popup || popup.closed) {
    window.location.href = url;
  }
}
