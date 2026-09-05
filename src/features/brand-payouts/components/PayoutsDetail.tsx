import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  useBrandPayoutsDetail,
  type BrandPayoutsDetailTarget,
} from "../hooks/use-brand-payouts-detail";
import {
  activityTone,
  formatPayoutsActivityAmount,
  formatPayoutsMoney,
  formatPayoutsTimestamp,
  obligationTone,
  payoutReason,
  readableState,
  shortReference,
  viewerRoleLabel,
} from "../utils/brand-payouts-presentation";
import { PayoutsSectionStatus } from "./PayoutsSectionStatus";

type DetailLocationState = { readonly fromPayoutsList?: boolean };

export function PayoutsDetail({
  target,
}: {
  readonly target: BrandPayoutsDetailTarget;
}) {
  const detail = useBrandPayoutsDetail(target);
  const location = useLocation();
  const navigate = useNavigate();
  const close = () => {
    const locationState =
      location.state && typeof location.state === "object"
        ? (location.state as DetailLocationState)
        : null;
    if (locationState?.fromPayoutsList) {
      navigate(-1);
      return;
    }
    navigate(AUTH_ROUTES.brandPayouts, { replace: true });
  };

  return (
    <div className="bp-workspace bp-detail-page">
      <Button variant="ghost" size="sm" className="bp-back" onClick={close}>
        <ArrowLeft size={18} aria-hidden /> Back to Payouts
      </Button>
      {detail.status === "LOADING" ? (
        <Card title="Financial detail" className="bp-section-card">
          <div
            className="bp-list-loading"
            role="status"
            aria-label="Loading financial detail"
          >
            <div className="bp-skeleton" />
            <div className="bp-skeleton" />
          </div>
        </Card>
      ) : null}
      {detail.status === "ACCESS_DENIED" ? (
        <Alert tone="error" title="Financial detail unavailable">
          Your current Brand membership does not permit this record.
        </Alert>
      ) : null}
      {detail.status === "UNAVAILABLE" ? (
        <Alert tone="error" title="Financial detail unavailable">
          {detail.error ?? "This record could not be verified."}
        </Alert>
      ) : null}
      {detail.status === "READY" &&
      detail.kind === "ACTIVITY" &&
      detail.response ? (
        <ActivityDetail response={detail.response} />
      ) : null}
      {detail.status === "READY" &&
      detail.kind === "OBLIGATION" &&
      detail.response ? (
        <ObligationDetail response={detail.response} />
      ) : null}
    </div>
  );
}

function ActivityDetail({
  response,
}: {
  readonly response: NonNullable<
    Extract<
      ReturnType<typeof useBrandPayoutsDetail>,
      { kind: "ACTIVITY" }
    >["response"]
  >;
}) {
  const section = response.sections[0];
  const item = section.payload;
  return (
    <Card
      eyebrow="Financial activity"
      title={item ? readableState(item.category) : "Activity unavailable"}
      className="bp-section-card"
    >
      {item ? (
        <>
          <div className="bp-detail-heading">
            <Badge tone={activityTone(item)}>
              {readableState(item.normalized_status)}
            </Badge>
            <Badge tone={item.is_financial_movement ? "success" : "neutral"}>
              {item.is_financial_movement ? "Money movement" : "Lifecycle only"}
            </Badge>
            {item.legacy ? (
              <Badge tone="pending">Legacy / limited</Badge>
            ) : null}
          </div>
          <dl className="bp-detail-grid">
            <DetailValue
              label="Amount"
              value={formatPayoutsActivityAmount(item)}
            />
            <DetailValue
              label="Recorded"
              value={formatPayoutsTimestamp(item.recorded_at)}
            />
            <DetailValue
              label="Occurred"
              value={formatPayoutsTimestamp(item.occurred_at)}
            />
            <DetailValue
              label="Activity reference"
              value={shortReference(item.public_reference)}
            />
            <DetailValue
              label="Campaign"
              value={
                item.references.campaign_id
                  ? shortReference(item.references.campaign_id)
                  : "Not linked"
              }
            />
            <DetailValue
              label="Collaboration"
              value={
                item.references.collaboration_id
                  ? shortReference(item.references.collaboration_id)
                  : "Not linked"
              }
            />
            <DetailValue
              label="Creator"
              value={
                item.references.creator_reference
                  ? shortReference(item.references.creator_reference)
                  : "Not linked"
              }
            />
            <DetailValue
              label="Observed source"
              value={formatPayoutsTimestamp(item.source_observed_at)}
            />
          </dl>
          <p className="bp-detail-note">
            Viewer: {viewerRoleLabel(response.viewer.role)}. This status is a
            normalized Creator Shop projection, not a provider statement.
          </p>
        </>
      ) : (
        <Alert tone="warning" title="Activity unavailable">
          This snapshot does not contain an authoritative activity record.
        </Alert>
      )}
      <PayoutsSectionStatus
        asOf={response.as_of}
        loadStatus="READY"
        metadata={section}
      />
    </Card>
  );
}

function ObligationDetail({
  response,
}: {
  readonly response: NonNullable<
    Extract<
      ReturnType<typeof useBrandPayoutsDetail>,
      { kind: "OBLIGATION" }
    >["response"]
  >;
}) {
  const section = response.sections[0];
  const item = section.payload;
  return (
    <Card
      eyebrow="Creator payout obligation"
      title={
        item ? shortReference(item.public_reference) : "Obligation unavailable"
      }
      className="bp-section-card"
    >
      {item ? (
        <>
          <div className="bp-detail-heading">
            <Badge tone={obligationTone(item)}>
              {readableState(item.lifecycle)}
            </Badge>
            <Badge tone="neutral">{readableState(item.current_gate)}</Badge>
            {item.legacy ? (
              <Badge tone="pending">Legacy / limited</Badge>
            ) : null}
          </div>
          {item.blocking_reason_code ? (
            <Alert tone="warning" title="Payment is currently blocked">
              {payoutReason(item.blocking_reason_code)}
            </Alert>
          ) : null}
          <dl className="bp-detail-grid">
            <DetailValue
              label="Agreed gross entitlement"
              value={formatPayoutsMoney(item.entitlement_value)}
            />
            <DetailValue
              label="Settled"
              value={formatPayoutsMoney(item.settled_value)}
            />
            <DetailValue
              label="Reversed"
              value={formatPayoutsMoney(item.reversed_value)}
            />
            <DetailValue
              label="Outstanding"
              value={formatPayoutsMoney(item.outstanding_value)}
            />
            <DetailValue
              label="Due date"
              value={
                item.payment_due_at
                  ? formatPayoutsTimestamp(item.payment_due_at)
                  : "Due date unavailable"
              }
            />
            <DetailValue
              label="Last observed"
              value={formatPayoutsTimestamp(item.last_observed_at)}
            />
            <DetailValue
              label="Campaign"
              value={shortReference(item.campaign_id)}
            />
            <DetailValue
              label="Collaboration"
              value={shortReference(item.collaboration_id)}
            />
            <DetailValue
              label="Creator"
              value={shortReference(item.creator_reference)}
            />
          </dl>
          <p className="bp-detail-note">
            Viewer: {viewerRoleLabel(response.viewer.role)}. The obligation,
            execution, and settlement states remain distinct.
          </p>
        </>
      ) : (
        <Alert tone="warning" title="Obligation unavailable">
          This snapshot does not contain an authoritative payout obligation.
        </Alert>
      )}
      <PayoutsSectionStatus
        asOf={response.as_of}
        loadStatus="READY"
        metadata={section}
      />
    </Card>
  );
}

function DetailValue({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
