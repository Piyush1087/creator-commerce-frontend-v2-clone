import { resolvePublicRuntimeEnv } from "./resolve-env";

/** Local dev defaults to same-origin `/api` via Vite proxy to avoid CORS preflight issues. */
export const env = resolvePublicRuntimeEnv({
  apiUrl: import.meta.env.VITE_API_URL,
  dev: import.meta.env.DEV,
  stage: import.meta.env.VITE_STAGE,
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
  publicAppUrl: import.meta.env.VITE_PUBLIC_APP_URL,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
});
