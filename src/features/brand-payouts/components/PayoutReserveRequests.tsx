import { useEffect, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  SideDrawer,
} from "../../../design-system/aurora";
import {
  approveBrandPayoutsReserve,
  BrandPayoutsApiError,
} from "../api/brand-payouts-client";
import type {
  BrandPayoutsReserveRequest,
  BrandPayoutsReserveRequestsResponse,
} from "../contracts/brand-payouts.contracts";
import type { PayoutsResourceState } from "../hooks/use-brand-payouts-workspace";
import {
  formatPayoutsMoney,
  formatPayoutsTimestamp,
  readableState,
  shortReference,
} from "../utils/brand-payouts-presentation";
import { PayoutsSectionStatus } from "./PayoutsSectionStatus";

type Props = {
  readonly state: PayoutsResourceState<BrandPayoutsReserveRequestsResponse>;
  readonly onLoadMore: () => void;
  readonly onRefresh: () => void;
};

export function PayoutReserveRequests({ state, onLoadMore, onRefresh }: Props) {
  const [selected, setSelected] = useState<BrandPayoutsReserveRequest | null>(
    null,
  );
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    setIdempotencyKey(`reserve-approval:${crypto.randomUUID()}`);
    setSubmitting(false);
    setError(null);
  }, [selected]);

  useEffect(() => {
    if (error) {
      document
        .querySelector<HTMLButtonElement>("[data-reserve-submit]")
        ?.focus();
    }
  }, [error]);

  if (state.status === "INITIAL_LOADING" && !state.data) {
    return (
      <Card title="Reserve requests" className="bp-section-card">
        <div role="status">Loading reserve requests…</div>
      </Card>
    );
  }
  if (!state.data) {
    return (
      <Card title="Reserve requests" className="bp-section-card">
        <Alert tone="error" title="Reserve requests unavailable">
          {state.error ?? "Reserve authority could not be verified."}
        </Alert>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Try again
        </Button>
      </Card>
    );
  }

  const response = state.data;
  const section = response.sections[0];
  const rows = section.payload ?? [];
  const actions = section.available_actions.filter(
    (action) =>
      action.action === "APPROVE_RESERVE" &&
      action.authorized_as_of === response.as_of,
  );
  const canApprove = (item: BrandPayoutsReserveRequest) =>
    state.status === "READY" &&
    section.freshness === "CURRENT" &&
    response.viewer.projection_scope === "FULL_FINANCIAL" &&
    item.approval_required &&
    actions.some(
      (action) =>
        action.resource_reference === item.reserve_instruction_id &&
        action.resource_version === item.resource_version,
    );

  const approve = async () => {
    if (!selected || !idempotencyKey || submitting || !canApprove(selected))
      return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await approveBrandPayoutsReserve({
        reserveInstructionId: selected.reserve_instruction_id,
        idempotencyKey,
      });
      setSelected(null);
      setNotice(
        result.approval.status === "COMPLETED"
          ? "Reserve approved and protected funds confirmed."
          : `Reserve updated: ${readableState(result.approval.status)}.`,
      );
      onRefresh();
    } catch (caught) {
      setSubmitting(false);
      setError(
        caught instanceof BrandPayoutsApiError
          ? caught.message
          : "The reserve was not approved. Refresh its current state before retrying.",
      );
    }
  };

  return (
    <Card title="Reserve requests" className="bp-section-card">
      <p className="bp-section-intro">
        Review server-owned Collaboration reserve instructions. Display
        references are never used as command IDs.
      </p>
      {notice ? (
        <Alert tone="success" title="Reserve updated">
          {notice}
        </Alert>
      ) : null}
      {rows.length === 0 ? (
        <div className="bp-empty-state">
          <h3>No visible reserve requests</h3>
          <p>
            No reserve instructions are available for this server-authorized
            scope.
          </p>
        </div>
      ) : (
        <div className="bp-reserve-list">
          {rows.map((item) => (
            <article className="bp-mobile-row" key={item.reserve_request_id}>
              <div className="bp-mobile-row__header">
                <div>
                  <h3>{shortReference(item.public_reference)}</h3>
                  <p>Campaign {shortReference(item.campaign_id)}</p>
                </div>
                <Badge
                  tone={
                    item.status === "COMPLETED"
                      ? "success"
                      : item.status === "ACTION_REQUIRED"
                        ? "error"
                        : "pending"
                  }
                >
                  {readableState(item.status)}
                </Badge>
              </div>
              <dl className="bp-definition-grid">
                <div>
                  <dt>Protected amount</dt>
                  <dd>{formatPayoutsMoney(item.reserve_value)}</dd>
                </div>
                <div>
                  <dt>Requested</dt>
                  <dd>{formatPayoutsTimestamp(item.requested_at)}</dd>
                </div>
                <div>
                  <dt>Collaboration</dt>
                  <dd>{shortReference(item.collaboration_id)}</dd>
                </div>
              </dl>
              {canApprove(item) ? (
                <Button onClick={() => setSelected(item)}>
                  Review reserve approval
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      )}
      {section.page.next_cursor ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={state.status === "REFRESHING"}
        >
          {state.status === "REFRESHING"
            ? "Loading…"
            : "Load more reserve requests"}
        </Button>
      ) : null}
      <PayoutsSectionStatus
        asOf={response.as_of}
        loadStatus={state.status}
        metadata={section}
        page={section.page}
      />
      <SideDrawer
        isOpen={Boolean(selected)}
        onClose={() => {
          if (!submitting) setSelected(null);
        }}
        title="Approve protected reserve"
        subtitle="Confirm the exact server-calculated amount. No amount can be edited here."
        width="500px"
        footer={
          <div className="settings-drawer-footer bp-reserve-drawer-footer">
            <Button
              variant="ghost"
              onClick={() => setSelected(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              data-reserve-submit
              onClick={() => void approve()}
              disabled={!selected || !canApprove(selected)}
              aria-disabled={submitting ? true : undefined}
            >
              {submitting ? "Approving reserve…" : "Confirm reserve approval"}
            </Button>
          </div>
        }
      >
        <div className="settings-drawer-body">
          {error ? (
            <Alert tone="error" title="Reserve not approved">
              {error}
            </Alert>
          ) : null}
          {selected ? (
            <>
              <dl className="bp-detail-grid">
                <div>
                  <dt>Reserve request</dt>
                  <dd>{shortReference(selected.public_reference)}</dd>
                </div>
                <div>
                  <dt>Protected amount</dt>
                  <dd>{formatPayoutsMoney(selected.reserve_value)}</dd>
                </div>
                <div>
                  <dt>Campaign</dt>
                  <dd>{shortReference(selected.campaign_id)}</dd>
                </div>
                <div>
                  <dt>Collaboration</dt>
                  <dd>{shortReference(selected.collaboration_id)}</dd>
                </div>
              </dl>
              <p className="bp-detail-note">
                The backend revalidates Brand authority, currentness,
                supersession, requester membership, idempotency, and exact
                economics inside the transaction.
              </p>
            </>
          ) : null}
        </div>
      </SideDrawer>
    </Card>
  );
}
