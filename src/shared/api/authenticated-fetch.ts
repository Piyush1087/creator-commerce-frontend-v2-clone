import {
  getAccessToken,
  getAuthSessionSnapshot,
  refreshAuthSession,
} from "../auth/auth-session";

function withAccessToken(
  init: RequestInit,
  accessToken: string | null,
): RequestInit {
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    headers.delete("Authorization");
  }
  return {
    ...init,
    credentials: init.credentials ?? "include",
    headers,
  };
}

/**
 * Protected HTTP primitive: attach the in-memory token, refresh once on 401,
 * then replay the original request once. A 403 is returned untouched.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const requestAccessToken = getAccessToken();
  const firstResponse = await fetch(
    input,
    withAccessToken(init, requestAccessToken),
  );
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const latestAccessToken = getAccessToken();
  if (latestAccessToken && latestAccessToken !== requestAccessToken) {
    return fetch(input, withAccessToken(init, latestAccessToken));
  }
  if (getAuthSessionSnapshot().status === "UNAUTHENTICATED") {
    return firstResponse;
  }

  try {
    await refreshAuthSession();
  } catch {
    return firstResponse;
  }

  return fetch(input, withAccessToken(init, getAccessToken()));
}
