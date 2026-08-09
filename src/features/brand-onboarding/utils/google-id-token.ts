const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
    context?: "signin" | "signup" | "use";
  }) => void;
  prompt: (
    momentListener?: (notification: {
      isNotDisplayed: () => boolean;
      isSkippedMoment: () => boolean;
      isDismissedMoment: () => boolean;
      getNotDisplayedReason: () => string;
      getSkippedReason: () => string;
      getDismissedReason: () => string;
    }) => void,
  ) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity Services.")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Opens Google Identity Services and resolves with an ID token (JWT).
 * Requires VITE_GOOGLE_CLIENT_ID (same OAuth client as backend GOOGLE_CLIENT_ID).
 */
export async function requestGoogleIdToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error(
      "Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend env.",
    );
  }

  await loadGisScript();
  const accountsId = window.google?.accounts?.id;
  if (!accountsId) {
    throw new Error("Google Identity Services failed to initialize.");
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (err: Error | null, token?: string) => {
      if (settled) {
        return;
      }
      settled = true;
      try {
        accountsId.cancel();
      } catch {
        /* ignore */
      }
      if (err || !token) {
        reject(
          err ??
            new Error(
              "Authentication cancelled. Please click again to retry or verify using your work email instead.",
            ),
        );
        return;
      }
      resolve(token);
    };

    accountsId.initialize({
      client_id: clientId,
      ux_mode: "popup",
      context: "signup",
      cancel_on_tap_outside: true,
      callback: (response) => {
        const token = response.credential?.trim();
        if (!token) {
          finish(
            new Error(
              "Authentication cancelled. Please click again to retry or verify using your work email instead.",
            ),
          );
          return;
        }
        finish(null, token);
      },
    });

    accountsId.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        finish(
          new Error(
            "Authentication cancelled. Please click again to retry or verify using your work email instead.",
          ),
        );
      } else if (notification.isDismissedMoment()) {
        const reason = notification.getDismissedReason();
        if (reason === "credential_returned") {
          return;
        }
        finish(
          new Error(
            "Authentication cancelled. Please click again to retry or verify using your work email instead.",
          ),
        );
      }
    });
  });
}
