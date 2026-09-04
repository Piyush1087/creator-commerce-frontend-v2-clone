import { Badge } from "../../../design-system/aurora";
import type { BrandReturnRequestApiResponse } from "../contracts/escrow.contracts";
import {
  BRAND_RETURN_PRESENTATION,
  BRAND_RETURN_REASON_COPY,
} from "../utils/brand-return-presentation";
import { formatEscrowCurrency } from "../utils/format-escrow-currency";

type BrandReturnHistoryProps = { requests: BrandReturnRequestApiResponse[] };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BrandReturnHistory({ requests }: BrandReturnHistoryProps) {
  return (
    <section className="brand-return-history" aria-labelledby="brand-return-history-title">
      <div className="brand-return-history__heading">
        <div>
          <h3 id="brand-return-history-title">Brand Return requests</h3>
          <p>External returns only. Collaboration refunds remain a separate workflow.</p>
        </div>
      </div>
      {requests.length === 0 ? (
        <p className="brand-return-history__empty">No Brand Return requests yet.</p>
      ) : (
        <ol className="brand-return-history__list">
          {requests.map((request) => {
            const state = BRAND_RETURN_PRESENTATION[request.status];
            return (
              <li key={request.brand_return_request_id} className="brand-return-history__item">
                <div className="brand-return-history__item-head">
                  <div>
                    <strong>{state.label}</strong>
                    <span>{formatDate(request.updated_at)}</span>
                  </div>
                  <Badge tone={state.tone}>{state.label}</Badge>
                </div>
                <p>{state.description}</p>
                <dl className="brand-return-history__amounts">
                  <div>
                    <dt>Requested</dt>
                    <dd>{formatEscrowCurrency(request.requested_amount, request.currency)}</dd>
                  </div>
                  <div>
                    <dt>Confirmed complete</dt>
                    <dd>{formatEscrowCurrency(request.successful_amount, request.currency)}</dd>
                  </div>
                  <div>
                    <dt>Still unresolved</dt>
                    <dd>{formatEscrowCurrency(request.unresolved_amount, request.currency)}</dd>
                  </div>
                  <div>
                    <dt>Released back to available</dt>
                    <dd>{formatEscrowCurrency(request.released_amount, request.currency)}</dd>
                  </div>
                </dl>
                {request.action_required_reason ? (
                  <p role="status" className="brand-return-history__reason">
                    {BRAND_RETURN_REASON_COPY[request.action_required_reason]}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
