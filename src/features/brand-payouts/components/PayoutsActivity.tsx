import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import type {
  BrandPayoutsActivity,
  BrandPayoutsActivityResponse,
} from "../contracts/brand-payouts.contracts";
import type { PayoutsResourceState } from "../hooks/use-brand-payouts-workspace";
import {
  activityTone,
  formatPayoutsActivityAmount,
  formatPayoutsTimestamp,
  readableState,
  shortReference,
} from "../utils/brand-payouts-presentation";
import { PayoutsSectionStatus } from "./PayoutsSectionStatus";

type PayoutsActivityProps = {
  readonly state: PayoutsResourceState<BrandPayoutsActivityResponse>;
  readonly onLoadMore: () => void;
  readonly onRetry: () => void;
};

export function PayoutsActivity({
  onLoadMore,
  onRetry,
  state,
}: PayoutsActivityProps) {
  const location = useLocation();
  if (state.status === "INITIAL_LOADING" && !state.data) {
    return (
      <Card title="Financial activity" className="bp-section-card">
        <div
          className="bp-list-loading"
          role="status"
          aria-label="Loading financial activity"
        >
          <div className="bp-skeleton" />
          <div className="bp-skeleton" />
          <div className="bp-skeleton" />
        </div>
      </Card>
    );
  }
  if (!state.data) {
    return (
      <Card title="Financial activity" className="bp-section-card">
        <Alert tone="error" title="Activity unavailable">
          {state.error ?? "Financial activity could not be verified."}
        </Alert>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </Card>
    );
  }

  const response = state.data;
  const section = response.sections[0];
  const rows = section.payload ?? [];
  return (
    <Card title="Financial activity" className="bp-section-card">
      <p className="bp-section-intro">
        Money movements and lifecycle events are classified separately. A
        lifecycle event is not proof of settlement.
      </p>
      {rows.length === 0 ? (
        <div className="bp-empty-state">
          <h3>No visible financial activity</h3>
          <p>
            No activity is available for this server-authorized scope and
            snapshot.
          </p>
        </div>
      ) : (
        <>
          <div className="bp-table-wrap">
            <table className="bp-table">
              <caption className="bp-visually-hidden">
                Brand financial activity
              </caption>
              <thead>
                <tr>
                  <th scope="col">Activity</th>
                  <th scope="col">Meaning</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Recorded</th>
                  <th scope="col">
                    <span className="bp-visually-hidden">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <ActivityTableRow
                    item={item}
                    key={item.activity_id}
                    pathname={location.pathname}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="bp-mobile-list" aria-label="Brand financial activity">
            {rows.map((item) => (
              <ActivityCard
                item={item}
                key={item.activity_id}
                pathname={location.pathname}
              />
            ))}
          </div>
        </>
      )}
      {section.page.next_cursor ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={state.status === "REFRESHING"}
        >
          {state.status === "REFRESHING" ? "Loading…" : "Load more activity"}
        </Button>
      ) : null}
      <PayoutsSectionStatus
        asOf={response.as_of}
        loadStatus={state.status}
        metadata={section}
        page={section.page}
      />
    </Card>
  );
}

function ActivityTableRow({
  item,
  pathname,
}: {
  readonly item: BrandPayoutsActivity;
  readonly pathname: string;
}) {
  return (
    <tr>
      <td>
        <strong>{readableState(item.category)}</strong>
        <span className="bp-cell-subtext">
          {shortReference(item.public_reference)}
        </span>
      </td>
      <td>
        {item.is_financial_movement ? "Money movement" : "Lifecycle only"}
      </td>
      <td>{formatPayoutsActivityAmount(item)}</td>
      <td>
        <Badge tone={activityTone(item)}>
          {readableState(item.normalized_status)}
        </Badge>
        {item.legacy ? <Badge tone="pending">Legacy / limited</Badge> : null}
      </td>
      <td>{formatPayoutsTimestamp(item.recorded_at)}</td>
      <td>
        <DetailLink item={item} pathname={pathname} />
      </td>
    </tr>
  );
}

function ActivityCard({
  item,
  pathname,
}: {
  readonly item: BrandPayoutsActivity;
  readonly pathname: string;
}) {
  return (
    <article className="bp-mobile-row">
      <div className="bp-mobile-row__header">
        <div>
          <h3>{readableState(item.category)}</h3>
          <p>
            {item.is_financial_movement ? "Money movement" : "Lifecycle only"}
          </p>
        </div>
        <Badge tone={activityTone(item)}>
          {readableState(item.normalized_status)}
        </Badge>
      </div>
      <dl className="bp-definition-grid">
        <div>
          <dt>Amount</dt>
          <dd>{formatPayoutsActivityAmount(item)}</dd>
        </div>
        <div>
          <dt>Recorded</dt>
          <dd>{formatPayoutsTimestamp(item.recorded_at)}</dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd>{shortReference(item.public_reference)}</dd>
        </div>
        {item.legacy ? (
          <div>
            <dt>History</dt>
            <dd>Legacy / limited</dd>
          </div>
        ) : null}
      </dl>
      <DetailLink item={item} pathname={pathname} />
    </article>
  );
}

function DetailLink({
  item,
  pathname,
}: {
  readonly item: BrandPayoutsActivity;
  readonly pathname: string;
}) {
  return (
    <Link
      className="bp-detail-link"
      to={`${pathname}?activity=${encodeURIComponent(item.public_reference)}`}
      state={{ fromPayoutsList: true }}
      aria-label={`View activity ${item.public_reference}`}
    >
      View details <ChevronRight size={16} aria-hidden />
    </Link>
  );
}
