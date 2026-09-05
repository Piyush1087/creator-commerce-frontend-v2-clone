import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button } from "../../../design-system/aurora";
import { fetchApplications } from "../api/c03-client";
import type { CampaignScope } from "../api/c03-scope";
import { useCampaignResource } from "../hooks/use-c03-resource";
import { messageForError } from "../utils/c03-errors";
import { DateValue, assetName } from "./CampaignContent";

export function ApplicationCollection() {
  const [cursor, setCursor] = useState<string | null>(null);
  const load = useCallback(
    (scope: CampaignScope) => fetchApplications(scope, cursor),
    [cursor],
  );
  const resource = useCampaignResource(load);
  return (
    <section className="c03-content">
      <header className="cc-command-header">
        <div>
          <h1 className="cc-page-title">My Applications</h1>
          <p className="cc-muted">
            Each Application records its own Asset, Brief and outcome.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={resource.loading}
          onClick={() => void resource.refresh()}
        >
          Refresh
        </Button>
      </header>
      {resource.loading && <p role="status">Loading Applications…</p>}
      {!!resource.error && (
        <p role="alert">{messageForError(resource.error)}</p>
      )}
      {resource.data && (
        <>
          <ol className="c03-list">
            {resource.data.items.map((item) => (
              <li className="cc-detail-panel" key={item.applicationId}>
                <p className="cc-muted">
                  {item.campaign.brand?.name ?? "Brand not provided"}
                </p>
                <h2>
                  <Link
                    to={`/creator/campaigns/applications/${item.applicationId}`}
                  >
                    {item.campaign.name ?? "Campaign"} —{" "}
                    {item.brief.briefName ?? "Brief"}
                  </Link>
                </h2>
                <p>
                  Asset:{" "}
                  {item.asset.kind
                    ? assetName({ ...item.asset, kind: item.asset.kind })
                    : "Not provided"}
                </p>
                <Badge tone="neutral">{item.status}</Badge>
                <p>
                  Applied: <DateValue value={item.appliedAt} />
                </p>
                <p className="cc-muted">Application {item.applicationId}</p>
              </li>
            ))}
          </ol>
          {resource.data.items.length === 0 && (
            <p role="status">
              No Applications yet. Your submitted Applications will appear here.
            </p>
          )}
        </>
      )}
      <div className="cc-detail-cta-row">
        {Boolean(cursor || resource.error) && (
          <Button
            variant="outline"
            disabled={resource.loading}
            onClick={() => {
              if (cursor) setCursor(null);
              else void resource.refresh();
            }}
          >
            Reload first page
          </Button>
        )}
        {resource.data?.nextCursor && (
          <Button
            disabled={resource.loading}
            onClick={() => setCursor(resource.data!.nextCursor)}
          >
            Next page
          </Button>
        )}
      </div>
    </section>
  );
}
