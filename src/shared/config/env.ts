const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const LOCAL_API_ORIGIN = "http://localhost:3000";

/** Local dev defaults to same-origin `/api` via Vite proxy to avoid CORS preflight issues. */
export const env = {
  apiUrl:
    configuredApiUrl && configuredApiUrl.length > 0
      ? configuredApiUrl
      : import.meta.env.DEV
        ? ""
        : LOCAL_API_ORIGIN,
  /**
   * Socket.IO must hit Nest directly in local dev. Routing through the Vite dev server
   * (`window.location.origin` + `/socket.io` proxy) spams `[vite] ws proxy error` when
   * the API is not running. Nest CORS already allows localhost:5173.
   */
  socketUrl:
    configuredApiUrl && configuredApiUrl.length > 0
      ? configuredApiUrl
      : LOCAL_API_ORIGIN,
  stage: import.meta.env.VITE_STAGE || "local",
};
