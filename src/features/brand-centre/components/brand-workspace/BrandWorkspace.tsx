import { Alert } from "../../../../design-system/aurora";
import { useBrandCentreBrand } from "../../queries/use-brand-centre-brand";
import type { BrandWorkspaceRequestState } from "../../queries/brand-workspace-cache";
import { BrandWorkspaceNavigation } from "./BrandWorkspaceNavigation";
import { BrandWorkspaceView } from "./BrandWorkspaceView";
import "./brand-workspace.css";

const activityCopy = {
  NONE: "",
  LEARNING: "Creator Shop is still learning about your Brand.",
  REFRESHING:
    "Checking for changes. Your current Brand information is still shown.",
  TEMPORARILY_UNAVAILABLE:
    "Update temporarily unavailable. Your current Brand information is still shown.",
};

export function BrandWorkspaceState({
  state,
}: {
  state: BrandWorkspaceRequestState;
}) {
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="brand-workspace-status"
      >
        {state.status === "REQUEST_LOADING"
          ? "Loading Brand information…"
          : null}
        {state.status === "BACKGROUND_LOADING"
          ? "Checking for changes. Your current Brand information is still shown."
          : null}
        {state.status === "CONTENT" && state.view
          ? activityCopy[state.view.runtimeActivity]
          : null}
        {state.status === "REQUEST_ERROR_WITH_CURRENT"
          ? "We couldn’t check for updates right now. Your current Brand information is still shown."
          : null}
      </div>
      {state.status === "REQUEST_ERROR_EMPTY" ? (
        <Alert tone="error" title="Could not load Brand information">
          {state.issue === "MALFORMED_RESPONSE"
            ? "Brand information could not be read safely. Please try again later."
            : "Brand information is temporarily unavailable. Please try again later."}
        </Alert>
      ) : null}
      {state.view ? <BrandWorkspaceView view={state.view} /> : null}
    </>
  );
}

export function BrandWorkspace() {
  const state = useBrandCentreBrand();
  return (
    <div className="brand-workspace">
      <BrandWorkspaceNavigation />
      <div className="brand-workspace__body">
        <div className="brand-workspace__heading">
          <h1>Brand</h1>
          <p>
            A living view of what Creator Shop understands about your brand.
          </p>
        </div>
        <BrandWorkspaceState state={state} />
      </div>
    </div>
  );
}
