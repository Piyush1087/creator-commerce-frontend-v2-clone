import { Alert, Badge, Card } from "../../../design-system/aurora";
import type { BrandPayoutsOverviewResponse } from "../contracts/brand-payouts.contracts";
import type { PayoutsResourceState } from "../hooks/use-brand-payouts-workspace";
import {
  formatAmountBucket,
  payoutReason,
  readableState,
} from "../utils/brand-payouts-presentation";
import { PayoutsSectionStatus } from "./PayoutsSectionStatus";

type PayoutsOverviewProps = {
  readonly state: PayoutsResourceState<BrandPayoutsOverviewResponse>;
  readonly onRetry: () => void;
};

export function PayoutsOverview({ onRetry, state }: PayoutsOverviewProps) {
  if (state.status === "INITIAL_LOADING" && !state.data) {
    return <OverviewLoading />;
  }
  if (!state.data) {
    return (
      <Card title="Financial overview" className="bp-section-card">
        <Alert tone="error" title="Overview unavailable">
          {state.error ?? "The financial overview could not be verified."}
        </Alert>
        <button className="bp-text-action" type="button" onClick={onRetry}>
          Try again
        </button>
      </Card>
    );
  }

  const response = state.data;
  const section = response.sections[0];
  const summary = section.payload;
  if (!summary) {
    return (
      <Card title="Financial overview" className="bp-section-card">
        <Alert tone="warning" title="Overview source unavailable">
          The service did not return an authoritative financial summary.
        </Alert>
        <PayoutsSectionStatus
          asOf={response.as_of}
          loadStatus={state.status}
          metadata={section}
        />
      </Card>
    );
  }

  if (summary.projection === "CAMPAIGN_OPERATIONAL") {
    return (
      <Card title="Campaign payment overview" className="bp-section-card">
        <div className="bp-operational-summary">
          <div>
            <p className="bp-metric__label">Treasury capacity</p>
            <p className="bp-metric__value">
              {readableState(summary.treasury_capacity)}
            </p>
          </div>
          <div>
            <p className="bp-metric__label">Action-required items</p>
            <p className="bp-metric__value">
              {summary.action_required_count.status === "AUTHORITATIVE"
                ? summary.action_required_count.value
                : "Unavailable"}
            </p>
          </div>
        </div>
        <Alert tone="warning" title="Operational read-only access">
          Financial rows remain hidden until canonical Campaign and
          Collaboration scope can be enforced server-side.
        </Alert>
        <PayoutsSectionStatus
          asOf={response.as_of}
          loadStatus={state.status}
          metadata={section}
        />
      </Card>
    );
  }

  const emptyBrand =
    summary.available_funds.status === "UNAVAILABLE" &&
    summary.available_funds.limitation_reason_code === "VAULT_NOT_ESTABLISHED";
  const buckets = [
    [
      "Available funds",
      summary.available_funds,
      "Unused funds currently available",
    ],
    ["Pending funding", summary.pending_funding, "Funding not yet available"],
    [
      "Committed / protected",
      summary.committed_protected_funds,
      "Funds allocated to protected obligations",
    ],
    [
      "Active Brand Return",
      summary.active_brand_return_commitment,
      "Available funds currently being returned",
    ],
    [
      "Scheduled obligations",
      summary.scheduled_creator_obligations,
      "Creator obligations not yet processing",
    ],
    [
      "Processing obligations",
      summary.processing_creator_obligations,
      "Creator obligations in execution",
    ],
    [
      "Settled activity",
      summary.settled_activity,
      `${readableState(summary.settled_activity.basis)} evidence`,
    ],
  ] as const;

  return (
    <Card title="Financial overview" className="bp-section-card">
      {emptyBrand ? (
        <div className="bp-empty-state">
          <h3>No financial activity yet</h3>
          <p>
            This new Brand has no established pooled vault snapshot. Reading
            this page does not initialize or provision one.
          </p>
        </div>
      ) : null}
      <div className="bp-metric-grid">
        {buckets.map(([label, bucket, hint]) => (
          <article className="bp-metric" key={label}>
            <div className="bp-metric__heading">
              <p className="bp-metric__label">{label}</p>
              <Badge
                tone={bucket.status === "AUTHORITATIVE" ? "success" : "pending"}
              >
                {bucket.status === "AUTHORITATIVE"
                  ? "Authoritative"
                  : "Unavailable"}
              </Badge>
            </div>
            <p className="bp-metric__value">{formatAmountBucket(bucket)}</p>
            <p className="bp-metric__hint">
              {bucket.status === "UNAVAILABLE"
                ? payoutReason(bucket.limitation_reason_code)
                : hint}
            </p>
          </article>
        ))}
        <article className="bp-metric">
          <div className="bp-metric__heading">
            <p className="bp-metric__label">Action required</p>
            <Badge
              tone={
                summary.action_required_count.status === "AUTHORITATIVE"
                  ? "success"
                  : "pending"
              }
            >
              {summary.action_required_count.status === "AUTHORITATIVE"
                ? "Authoritative"
                : "Unavailable"}
            </Badge>
          </div>
          <p className="bp-metric__value">
            {summary.action_required_count.status === "AUTHORITATIVE"
              ? summary.action_required_count.value
              : "Unavailable"}
          </p>
          <p className="bp-metric__hint">
            {summary.action_required_count.status === "UNAVAILABLE"
              ? payoutReason(
                  summary.action_required_count.limitation_reason_code,
                )
              : "Material financial items needing attention"}
          </p>
        </article>
      </div>
      <PayoutsSectionStatus
        asOf={response.as_of}
        loadStatus={state.status}
        metadata={section}
      />
    </Card>
  );
}

function OverviewLoading() {
  return (
    <Card
      title="Financial overview"
      className="bp-section-card"
      aria-busy="true"
    >
      <div
        className="bp-metric-grid"
        role="status"
        aria-label="Loading financial overview"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div className="bp-skeleton bp-skeleton--metric" key={index} />
        ))}
      </div>
    </Card>
  );
}
