import { Link } from "react-router-dom";

import { Alert, Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import type { CampaignsHistoryResponse } from "../contracts/creator-campaigns.contracts";
import {
  displayCurrency,
  displayValue,
  formatClosedDate,
} from "../utils/display-value";

import "../creator-campaigns.css";

type HistoryArchiveWorkspaceProps = {
  history: CampaignsHistoryResponse | null;
  loading: boolean;
  error: string | null;
};

export function HistoryArchiveWorkspace({
  history,
  loading,
  error,
}: HistoryArchiveWorkspaceProps) {
  const stats = history?.stats;
  const rows = history?.rows ?? [];

  return (
    <div className="cc-workspace">
      <header className="cc-command-header">
        <div>
          <h1 className="cc-page-title">Campaign History</h1>
          <p className="cc-muted" style={{ marginTop: 8 }}>
            Read-only archive of closed collaborations.
          </p>
        </div>
        <Link to={AUTH_ROUTES.creatorCampaigns}>
          <Button variant="outline">Back to Command Center</Button>
        </Link>
      </header>

      {error ? (
        <div className="cc-alert-block">
          <Alert tone="error" title="Could not load history">
            {error}
          </Alert>
        </div>
      ) : null}

      {loading ? <p className="cc-muted">Loading history…</p> : null}

      {!loading ? (
        <>
          <section className="cc-history-stats" aria-label="Historical summary">
            <div className="cc-history-stat">
              <p className="cc-history-stat__label">Total Escrow Value Extracted</p>
              <p className="cc-history-stat__value">
                {displayCurrency(stats?.total_escrow_extracted)}
              </p>
            </div>
            <div className="cc-history-stat">
              <p className="cc-history-stat__label">Deliverables Dispatched</p>
              <p className="cc-history-stat__value">
                {displayValue(stats?.deliverables_dispatched)}
              </p>
            </div>
            <div className="cc-history-stat">
              <p className="cc-history-stat__label">Avg Brand Match Retention</p>
              <p className="cc-history-stat__value">
                {stats?.avg_match_retention !== null && stats?.avg_match_retention !== undefined
                  ? `${displayValue(stats.avg_match_retention)}%`
                  : "-"}
              </p>
            </div>
          </section>

          <div className="cc-production-table-wrap">
            <h2>Closed collaborations</h2>
            {rows.length === 0 ? (
              <p className="cc-muted">-</p>
            ) : (
              <>
                <table className="cc-production-table">
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Campaign</th>
                      <th>Outcome</th>
                      <th>Payout</th>
                      <th>Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.collaboration_id}>
                        <td>
                          <strong>{displayValue(row.brand_name)}</strong>
                        </td>
                        <td>{displayValue(row.campaign_name)}</td>
                        <td>{displayValue(row.closed_label)}</td>
                        <td>{displayCurrency(row.payout_amount)}</td>
                        <td>{formatClosedDate(row.closed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="cc-mobile-rows">
                  {rows.map((row) => (
                    <div key={row.collaboration_id} className="cc-mobile-row">
                      <div className="cc-mobile-row__text">
                        <strong>{displayValue(row.brand_name)}</strong>
                        <span>
                          {displayValue(row.campaign_name)} · {displayValue(row.closed_label)}
                        </span>
                      </div>
                      <span className="cc-row-sub">{displayCurrency(row.payout_amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
