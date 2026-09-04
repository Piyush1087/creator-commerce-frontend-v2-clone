import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Button, Card } from "../../../design-system/aurora";
import {
  completeCreatorInstagram,
  completeCreatorInstagramReconnect,
} from "../../../features/creator-onboarding/api/creator-entry-client";
import {
  clearCreatorInstagramFlowMode,
  readCreatorInstagramFlowMode,
} from "../../../features/creator-onboarding/utils/creator-entry-oauth-session";
import { isApiRequestError } from "../../../shared/api/parse-api-error";
import "../../../features/creator-onboarding/creator-onboarding.css";

type CapturedCallback = {
  state: string;
  code?: string;
  error?: string;
  errorDescription?: string;
};

function captureCallback(): CapturedCallback {
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

export function CreatorInstagramOAuthCallbackPage() {
  const navigate = useNavigate();
  const [callback] = useState(captureCallback);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
    const mode = readCreatorInstagramFlowMode();
    if (!mode || !callback.state || (!callback.code && !callback.error)) {
      setError(
        "This Instagram callback is incomplete or no longer active. Return to Creator Entry and try again.",
      );
      return;
    }
    let active = true;
    const complete =
      mode === "RECONNECT"
        ? completeCreatorInstagramReconnect
        : completeCreatorInstagram;
    void complete(callback)
      .then(() => {
        clearCreatorInstagramFlowMode();
        if (active) navigate("/creator/onboarding", { replace: true });
      })
      .catch((requestError: unknown) => {
        clearCreatorInstagramFlowMode();
        if (!active) return;
        const requestCode = isApiRequestError(requestError)
          ? requestError.code
          : undefined;
        if (requestCode === "INSTAGRAM_AUTHORIZATION_DENIED")
          setError(
            "Instagram authorization was not completed. Nothing was connected; you can try again.",
          );
        else if (requestCode === "INSTAGRAM_PROFESSIONAL_ACCOUNT_REQUIRED")
          setError(
            "A Professional Instagram account is required. Update the account, then try again.",
          );
        else if (requestCode === "INSTAGRAM_PROVIDER_RETRY_REQUIRED")
          setError(
            "Instagram could not complete the request. Please try again.",
          );
        else
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Instagram connection could not be completed.",
          );
      });
    return () => {
      active = false;
    };
  }, [callback, navigate]);

  return (
    <div className="cob-page cob-connect-layout" aria-busy={!error}>
      <Card className="cob-modal-panel cob-connect-card">
        <span className="cob-badge">Secure Instagram callback</span>
        {error ? (
          <>
            <div role="alert">
              <Alert tone="error" title="Instagram setup needs attention">
                {error}
              </Alert>
            </div>
            <div className="cob-connect-actions">
              <Button
                onClick={() =>
                  navigate("/creator/onboarding", { replace: true })
                }
              >
                Return to Creator Entry
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="cob-connect-title">
              Finishing Instagram authorization…
            </h1>
            <p className="cob-muted" role="status" aria-live="polite">
              Validating the provider response securely.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
