import { Alert, Badge } from "../../../design-system/aurora";
import type { BrandPayoutsSectionMetadata } from "../contracts/brand-payouts.contracts";
import type { PayoutsLoadStatus } from "../hooks/use-brand-payouts-workspace";
import {
  formatPayoutsTimestamp,
  payoutReason,
  readableState,
} from "../utils/brand-payouts-presentation";

type PageMetadata = {
  readonly next_cursor: string | null;
  readonly page_complete: boolean;
  readonly source_complete: boolean;
};

type PayoutsSectionStatusProps = {
  readonly metadata: BrandPayoutsSectionMetadata;
  readonly asOf: string;
  readonly loadStatus: PayoutsLoadStatus;
  readonly page?: PageMetadata;
};

export function PayoutsSectionStatus({
  asOf,
  loadStatus,
  metadata,
  page,
}: PayoutsSectionStatusProps) {
  const limited =
    metadata.coverage !== "COMPLETE" ||
    metadata.source_coverage.some((source) => source.status !== "AVAILABLE");

  return (
    <div className="bp-section-status">
      {loadStatus === "STALE" ? (
        <Alert tone="warning" title="Showing last-known data">
          Refresh failed. Values remain anchored to{" "}
          {formatPayoutsTimestamp(asOf)}.
        </Alert>
      ) : null}
      {loadStatus === "REFRESHING" ? (
        <p className="bp-inline-status" role="status" aria-live="polite">
          Refreshing while the current snapshot remains visible…
        </p>
      ) : null}
      <div className="bp-section-status__line">
        <Badge tone={metadata.coverage === "COMPLETE" ? "success" : "pending"}>
          {readableState(metadata.coverage)} coverage
        </Badge>
        <Badge tone={metadata.freshness === "CURRENT" ? "success" : "pending"}>
          {readableState(metadata.freshness)} source
        </Badge>
        <span>As of {formatPayoutsTimestamp(asOf)}</span>
        <span>
          Source observed {formatPayoutsTimestamp(metadata.source_observed_at)}
        </span>
      </div>
      {page ? (
        <div
          className="bp-section-status__line"
          aria-label="Pagination completeness"
        >
          <span>
            {page.page_complete ? "Page set complete" : "More rows available"}
          </span>
          <span>
            {page.source_complete
              ? "Authoritative source complete"
              : "Authoritative source coverage incomplete"}
          </span>
        </div>
      ) : null}
      {limited ? (
        <details className="bp-coverage">
          <summary>Data coverage and limitations</summary>
          <ul>
            {metadata.source_coverage.map((source) => (
              <li key={source.source}>
                <strong>{readableState(source.source)}</strong>:{" "}
                {readableState(source.status)}
                {source.limitation_reason_code
                  ? ` — ${payoutReason(source.limitation_reason_code)}`
                  : ""}
                {source.recovery_hint ? ` ${source.recovery_hint}` : ""}
              </li>
            ))}
            {metadata.legacy_limitations.map((limitation) => (
              <li key={`${limitation.source}:${limitation.reason_code}`}>
                <strong>{readableState(limitation.source)} history</strong>:{" "}
                {limitation.detail}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
