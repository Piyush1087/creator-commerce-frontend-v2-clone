const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

/** Local dev defaults to same-origin `/api` via Vite proxy to avoid CORS preflight issues. */
export const env = {
  apiUrl:
    configuredApiUrl && configuredApiUrl.length > 0
      ? configuredApiUrl
      : import.meta.env.DEV
        ? ""
        : "http://localhost:3000",
  stage: import.meta.env.VITE_STAGE || "local",
};
