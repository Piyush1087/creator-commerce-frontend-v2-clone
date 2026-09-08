import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import type {
  BrandPayoutsObligation,
  BrandPayoutsObligationsResponse,
} from "../contracts/brand-payouts.contracts";
import type { PayoutsResourceState } from "../hooks/use-brand-payouts-workspace";
import {
  formatPayoutsMoney,
  formatPayoutsTimestamp,
  obligationTone,
  readableState,
  shortReference,
} from "../utils/brand-payouts-presentation";
import { PayoutsSectionStatus } from "./PayoutsSectionStatus";

type PayoutObligationsProps = {
  readonly state: PayoutsResourceState<BrandPayoutsObligationsResponse>;
  readonly onLoadMore: () => void;
  readonly onRetry: () => void;
};

export function PayoutObligations({
  onLoadMore,
  onRetry,
  state,
}: PayoutObligationsProps) {
  const location = useLocation();
  if (state.status === "INITIAL_LOADING" && !state.data) {
    return (
      <Card title="Creator payout obligations" className="bp-section-card">
        <div
          className="bp-list-loading"
          role="status"
          aria-label="Loading payout obligations"
        >
          <div className="bp-skeleton" />
          <div className="bp-skeleton" />
        </div>
      </Card>
    );
  }
  if (!state.data) {
    return (
      <Card title="Creator payout obligations" className="bp-section-card">
        <Alert tone="error" title="Obligations unavailable">
          {state.error ?? "Creator payout obligations could not be verified."}
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
    <Card title="Creator payout obligations" className="bp-section-card">
      <p className="bp-section-intro">
        An obligation records Creator Shop business entitlement. Provider
        processing and settlement remain separate states.
      </p>
      {rows.length === 0 ? (
        <div className="bp-empty-state">
          <h3>No visible payout obligations</h3>
          <p>
            No obligations are available for this server-authorized scope and
            snapshot.
          </p>
        </div>
      ) : (
        <>
          <div className="bp-table-wrap">
            <table className="bp-table">
              <caption className="bp-visually-hidden">
                Creator payout obligations
              </caption>
              <thead>
                <tr>
                  <th scope="col">Creator</th>
                  <th scope="col">Entitlement</th>
                  <th scope="col">Due date</th>
                  <th scope="col">State</th>
                  <th scope="col">Current gate</th>
                  <th scope="col">
                    <span className="bp-visually-hidden">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <ObligationTableRow
                    item={item}
                    key={item.obligation_id}
                    pathname={location.pathname}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="bp-mobile-list"
            aria-label="Creator payout obligations"
          >
            {rows.map((item) => (
              <ObligationCard
                item={item}
                key={item.obligation_id}
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
          {state.status === "REFRESHING" ? "Loading…" : "Load more obligations"}
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

function ObligationTableRow({
  item,
  pathname,
}: {
  readonly item: BrandPayoutsObligation;
  readonly pathname: string;
}) {
  return (
    <tr>
      <td>
        <strong>{shortReference(item.creator_reference)}</strong>
        <span className="bp-cell-subtext">
          {shortReference(item.public_reference)}
        </span>
      </td>
      <td>{formatPayoutsMoney(item.entitlement_value)}</td>
      <td>
        {item.payment_due_at
          ? formatPayoutsTimestamp(item.payment_due_at)
          : "Due date unavailable"}
      </td>
      <td>
        <Badge tone={obligationTone(item)}>
          {readableState(item.lifecycle)}
        </Badge>
        {item.legacy ? <Badge tone="pending">Legacy / limited</Badge> : null}
      </td>
      <td>{readableState(item.current_gate)}</td>
      <td>
        <DetailLink item={item} pathname={pathname} />
      </td>
    </tr>
  );
}

function ObligationCard({
  item,
  pathname,
}: {
  readonly item: BrandPayoutsObligation;
  readonly pathname: string;
}) {
  return (
    <article className="bp-mobile-row">
      <div className="bp-mobile-row__header">
        <div>
          <h3>{shortReference(item.creator_reference)}</h3>
          <p>{shortReference(item.public_reference)}</p>
        </div>
        <Badge tone={obligationTone(item)}>
          {readableState(item.lifecycle)}
        </Badge>
      </div>
      <dl className="bp-definition-grid">
        <div>
          <dt>Entitlement</dt>
          <dd>{formatPayoutsMoney(item.entitlement_value)}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>
            {item.payment_due_at
              ? formatPayoutsTimestamp(item.payment_due_at)
              : "Due date unavailable"}
          </dd>
        </div>
        <div>
          <dt>Current gate</dt>
          <dd>{readableState(item.current_gate)}</dd>
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
  readonly item: BrandPayoutsObligation;
  readonly pathname: string;
}) {
  return (
    <Link
      className="bp-detail-link"
      to={`${pathname}?obligation=${encodeURIComponent(item.public_reference)}`}
      state={{ fromPayoutsList: true }}
      aria-label={`View payout obligation ${item.public_reference}`}
    >
      View details <ChevronRight size={16} aria-hidden />
    </Link>
  );
}
