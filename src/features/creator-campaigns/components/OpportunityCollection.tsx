import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../design-system/aurora";
import { fetchOpportunities } from "../api/c03-client";
import type { CampaignScope } from "../api/c03-scope";
import { useCampaignResource } from "../hooks/use-c03-resource";
import { messageForError } from "../utils/c03-errors";
import { DateValue } from "./CampaignContent";
import { OptionalMedia } from "./OptionalMedia";

export function OpportunityCollection() {
  const [cursor, setCursor] = useState<string | null>(null);
  const load = useCallback(
    (scope: CampaignScope) => fetchOpportunities(scope, cursor),
    [cursor],
  );
  const resource = useCampaignResource(load);
  return (
    <section className="c03-content">
      <header className="cc-command-header">
        <div>
          <h1 className="cc-page-title">Opportunities</h1>
          <p className="cc-muted">
            Campaign opportunities available to your Creator workspace.
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
      {resource.loading && <p role="status">Loading opportunities…</p>}
      {!!resource.error && (
        <p role="alert">{messageForError(resource.error)}</p>
      )}
      {resource.data && (
        <>
          <div className="c03-grid">
            {resource.data.items.map(
              (item) =>
                item.state === "AUTHORIZED" && (
                  <article className="cc-detail-panel" key={item.campaign.id}>
                    <OptionalMedia
                      src={item.campaign.brand?.logoUrl}
                      className="cc-detail-product-thumb"
                      placeholderClassName="cc-media-placeholder cc-detail-product-thumb"
                    />
                    <p className="cc-muted">
                      {item.campaign.brand?.name ?? "Brand"}
                    </p>
                    <h2>
                      <Link
                        to={`/creator/campaigns/opportunities/${item.campaign.id}`}
                      >
                        {item.campaign.name}
                      </Link>
                    </h2>
                    <p>
                      {item.campaign.platforms.join(" · ") ||
                        "Platforms not provided"}
                    </p>
                    <p>{item.campaign.objective ?? "Objective not provided"}</p>
                    <p>
                      Application deadline:{" "}
                      <DateValue value={item.applicationDeadline} />
                    </p>
                    <p>
                      {item.applicationsOpen
                        ? "Applications open"
                        : "Applications closed"}
                    </p>
                  </article>
                ),
            )}
          </div>
          {resource.data.items.length === 0 && (
            <p role="status">
              No opportunities are available right now. You can still read My
              Applications.
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
