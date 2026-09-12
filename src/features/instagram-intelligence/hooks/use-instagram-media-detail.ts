import { useEffect, useState } from "react";
import {
  getInstagramMediaDetail,
  InstagramMediaDetailError,
  type InstagramMediaDetailErrorKind,
} from "../api/instagram-b4-client";
import type { InstagramMediaDetail } from "../contracts/instagram-b4.schemas";

export type InstagramMediaDetailState =
  | { kind: "DETAIL_LOADING" | "DETAIL_RETRYING" }
  | { kind: "DETAIL_READY"; detail: InstagramMediaDetail }
  | {
      kind:
        | "DETAIL_INVALID_RESPONSE"
        | "DETAIL_NOT_FOUND"
        | "DETAIL_UNAUTHORIZED"
        | "DETAIL_FORBIDDEN"
        | "DETAIL_TRANSIENT_ERROR"
        | "DETAIL_STALE_OR_CHANGED_GENERATION"
        | "DETAIL_REMOVED_AFTER_REFRESH";
    };

const stateByError: Record<
  InstagramMediaDetailErrorKind,
  Exclude<InstagramMediaDetailState, { kind: "DETAIL_READY" }>["kind"]
> = {
  INVALID_RESPONSE: "DETAIL_INVALID_RESPONSE",
  NOT_FOUND: "DETAIL_NOT_FOUND",
  UNAUTHORIZED: "DETAIL_UNAUTHORIZED",
  FORBIDDEN: "DETAIL_FORBIDDEN",
  TRANSIENT_ERROR: "DETAIL_TRANSIENT_ERROR",
  STALE_OR_CHANGED_GENERATION: "DETAIL_STALE_OR_CHANGED_GENERATION",
  REMOVED_AFTER_REFRESH: "DETAIL_REMOVED_AFTER_REFRESH",
};

export function useInstagramMediaDetail(
  mediaId: string | null,
  contextKey: string,
) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<InstagramMediaDetailState>({
    kind: "DETAIL_LOADING",
  });

  useEffect(() => {
    if (!mediaId) return;
    const controller = new AbortController();
    let active = true;
    setState({ kind: attempt ? "DETAIL_RETRYING" : "DETAIL_LOADING" });
    // Deferring one task prevents React Strict Mode's probe effect from issuing
    // a duplicate request while retaining immediate accessible loading state.
    const start = window.setTimeout(() => {
      void getInstagramMediaDetail(mediaId, controller.signal)
        .then((detail) => {
          if (active) setState({ kind: "DETAIL_READY", detail });
        })
        .catch((error: unknown) => {
          if (!active || controller.signal.aborted) return;
          setState({
            kind:
              error instanceof InstagramMediaDetailError
                ? stateByError[error.kind]
                : "DETAIL_TRANSIENT_ERROR",
          });
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(start);
      controller.abort();
    };
  }, [attempt, contextKey, mediaId]);

  return {
    state,
    retry: () => setAttempt((value) => value + 1),
  };
}
