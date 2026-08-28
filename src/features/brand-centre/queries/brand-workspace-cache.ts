import { fetchBrandCentreBrand } from "../api/brand-centre-brand-client";
import {
  mapBrandWorkspace,
  type BrandWorkspaceView,
} from "../adapters/map-brand-workspace";
import type { BrandWorkspaceProjection } from "../contracts/brand-centre-brand.contracts";
import { BrandConsumerContractError } from "../schemas/brand-centre-brand-schema";

export type BrandWorkspaceRequestState = {
  status:
    | "REQUEST_LOADING"
    | "CONTENT"
    | "BACKGROUND_LOADING"
    | "REQUEST_ERROR_WITH_CURRENT"
    | "REQUEST_ERROR_EMPTY";
  projection?: BrandWorkspaceProjection;
  view?: BrandWorkspaceView;
  issue?: "MALFORMED_RESPONSE" | "REQUEST_FAILED";
};

/** In-memory, route-instance cache. Never persists Brand data across sessions or owners. */
export function createBrandWorkspaceCache(read = fetchBrandCentreBrand) {
  let state: BrandWorkspaceRequestState = { status: "REQUEST_LOADING" };
  let controller: AbortController | undefined;
  let request = 0;
  const listeners = new Set<() => void>();
  const publish = (next: BrandWorkspaceRequestState) => {
    state = next;
    listeners.forEach((notify) => notify());
  };
  return {
    getSnapshot: () => state,
    subscribe: (notify: () => void) => {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
    cancel: () => {
      request++;
      controller?.abort();
    },
    async refresh() {
      const currentRequest = ++request;
      controller?.abort();
      controller = new AbortController();
      publish({
        ...state,
        status: state.projection ? "BACKGROUND_LOADING" : "REQUEST_LOADING",
        issue: undefined,
      });
      try {
        const projection = await read(controller.signal);
        if (currentRequest !== request) return;
        publish({
          status: "CONTENT",
          projection,
          view: mapBrandWorkspace(projection),
        });
      } catch (error) {
        if (currentRequest !== request) return;
        publish({
          ...state,
          status: state.projection
            ? "REQUEST_ERROR_WITH_CURRENT"
            : "REQUEST_ERROR_EMPTY",
          issue:
            error instanceof BrandConsumerContractError
              ? "MALFORMED_RESPONSE"
              : "REQUEST_FAILED",
        });
      }
    },
  };
}
