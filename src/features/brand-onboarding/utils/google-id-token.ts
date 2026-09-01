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
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
      locale?: string;
    },
  ) => void;
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

export function loadGisScript(): Promise<void> {
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

export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
}

/**
 * Mounts a Google Sign-In button that opens Google's account chooser / popup.
 * Prefer this over One Tap `prompt()` — One Tap often fails silently in local/dev.
 */
export async function mountGoogleIdButton(args: {
  container: HTMLElement;
  context?: "signin" | "signup" | "use";
  onCredential: (idToken: string) => void;
  onError?: (error: Error) => void;
}): Promise<() => void> {
  const clientId = getGoogleClientId();
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

  args.container.replaceChildren();

  accountsId.initialize({
    client_id: clientId,
    ux_mode: "popup",
    context: args.context ?? "signup",
    cancel_on_tap_outside: true,
    callback: (response) => {
      const token = response.credential?.trim();
      if (!token) {
        args.onError?.(
          new Error(
            "Authentication cancelled. Please click again to retry or verify using your work email instead.",
          ),
        );
        return;
      }
      args.onCredential(token);
    },
  });

  accountsId.renderButton(args.container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    width: 320,
  });

  return () => {
    try {
      accountsId.cancel();
    } catch {
      /* ignore */
    }
    args.container.replaceChildren();
  };
}
