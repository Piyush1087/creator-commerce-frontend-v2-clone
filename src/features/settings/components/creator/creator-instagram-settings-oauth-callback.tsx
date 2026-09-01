import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Button, Card } from "../../../../design-system/aurora";
import { completeCreatorInstagramSettingsReconnect } from "../../api/creator-instagram-settings-client";
import type { CreatorInstagramCallbackBody } from "../../contracts/creator-instagram-settings.contracts";
import {
  clearCreatorInstagramSettingsReconnect,
  hasCreatorInstagramSettingsReconnect,
} from "../../utils/creator-instagram-settings-oauth-session";
import { creatorInstagramFriendlyError } from "../../utils/creator-instagram-settings-state";

const SETTINGS_ROUTE = "/creator/settings/social";

function captureCallback(): CreatorInstagramCallbackBody {
  const params = new URLSearchParams(window.location.search);
  return {
    state: params.get("state") ?? "",
    ...(params.get("code") ? { code: params.get("code")! } : {}),
    ...(params.get("error") ? { error: params.get("error")! } : {}),
    ...(params.get("error_description")
      ? { errorDescription: params.get("error_description")! }
      : {}),
  };
}

/** P2 composes this into the existing Creator OAuth callback route. */
export function CreatorInstagramSettingsOAuthCallback() {
  const navigate = useNavigate();
  const [callback] = useState(captureCallback);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
    if (
      !hasCreatorInstagramSettingsReconnect() ||
      !callback.state ||
      (!callback.code && !callback.error)
    ) {
      setError(
        "This Settings reconnect is incomplete or no longer active. Return to Instagram Settings and start again.",
      );
      return;
    }

    let active = true;
    void completeCreatorInstagramSettingsReconnect(callback)
      .then(() => {
        clearCreatorInstagramSettingsReconnect();
        if (active) navigate(SETTINGS_ROUTE, { replace: true });
      })
      .catch((caught: unknown) => {
        clearCreatorInstagramSettingsReconnect();
        if (active) setError(creatorInstagramFriendlyError(caught));
      });
    return () => {
      active = false;
    };
  }, [callback, navigate]);

  return (
    <div className="creator-instagram-settings-callback">
      <Card>
        {error ? (
          <>
            <div role="alert">
              <Alert tone="error" title="Instagram reconnect needs attention">
                {error}
              </Alert>
            </div>
            <Button onClick={() => navigate(SETTINGS_ROUTE, { replace: true })}>
              Return to Instagram Settings
            </Button>
          </>
        ) : (
          <p role="status" aria-live="polite">
            Validating the permanent Instagram identity…
          </p>
        )}
      </Card>
    </div>
  );
}
