const LOCAL_API_ORIGIN = "http://localhost:3000";

export type PublicRuntimeEnvInput = {
  apiUrl?: string;
  dev: boolean;
  stage?: string;
  razorpayKeyId?: string;
  publicAppUrl?: string;
  googleMapsApiKey?: string;
};

export type PublicRuntimeEnv = {
  apiUrl: string;
  socketUrl: string;
  stage: string;
  razorpayKeyId: string;
  publicAppUrl: string;
  googleMapsApiKey: string;
};

function productionApiOrigin(value: string | undefined): string {
  const configured = value?.trim();
  if (!configured) {
    throw new Error("VITE_API_URL is required for production builds.");
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("VITE_API_URL must be a valid HTTP(S) URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("VITE_API_URL must use HTTP or HTTPS.");
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("VITE_API_URL must not target localhost in production.");
  }
  return configured.replace(/\/$/, "");
}

export function resolvePublicRuntimeEnv(
  input: PublicRuntimeEnvInput,
): PublicRuntimeEnv {
  const configured = input.apiUrl?.trim().replace(/\/$/, "");
  const isLocalRuntime = input.dev || input.stage === "local";
  const apiUrl = isLocalRuntime
    ? configured || ""
    : productionApiOrigin(configured);

  return {
    apiUrl,
    socketUrl: isLocalRuntime ? configured || LOCAL_API_ORIGIN : apiUrl,
    stage: input.stage || "local",
    razorpayKeyId: input.razorpayKeyId?.trim() || "",
    publicAppUrl: input.publicAppUrl?.trim().replace(/\/$/, "") || "",
    googleMapsApiKey: input.googleMapsApiKey?.trim() || "",
  };
}
