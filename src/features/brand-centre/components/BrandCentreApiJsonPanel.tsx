import { RefreshCw } from "lucide-react";

import { Alert, Button } from "../../../design-system/aurora";
import type { ApiJsonLoadState } from "../hooks/use-brand-centre-api-json";

type BrandCentreApiJsonPanelProps = {
  title: string;
  endpoint: string;
  note?: string;
  state: ApiJsonLoadState<unknown>;
  onReload: () => void;
};

export function BrandCentreApiJsonPanel({
  title,
  endpoint,
  note,
  state,
  onReload,
}: BrandCentreApiJsonPanelProps) {
  const isLoading = state.status === "loading" || state.status === "idle";

  return (
    <div className="aurora-card brand-centre-json-panel">
      <div className="brand-centre-json-panel__header">
        <div>
          <h2 className="brand-centre-json-panel__title">{title}</h2>
          <p className="brand-centre-json-panel__endpoint">{endpoint}</p>
          {note ? (
            <p className="brand-centre-json-panel__note">{note}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading}
          onClick={() => void onReload()}
        >
          <RefreshCw
            size={14}
            className={isLoading ? "brand-centre-json-panel__spin" : undefined}
          />
          Refresh
        </Button>
      </div>

      <div className="brand-centre-json-panel__body">
        {isLoading ? (
          <p className="brand-centre-page__loading">Loading API response…</p>
        ) : null}

        {state.status === "error" ? (
          <Alert tone="error" title="Request failed">
            {state.message}
          </Alert>
        ) : null}

        {state.status === "ready" ? (
          <pre className="brand-centre-json-panel__pre">
            {JSON.stringify(state.data, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
