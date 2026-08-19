import { useEffect, useState, type FormEvent } from "react";
import { PackageCheck } from "lucide-react";
import { Alert, Button, TextField } from "../../../../design-system/aurora";
import type { UserRole } from "../../../../shared/auth/user-role";
import type {
  ProvideFulfillmentPayload,
  ReportFulfillmentIssuePayload,
} from "../../api/collaboration-client";
import type {
  CollaborationBrandSupportType,
  CollaborationDetailResponse,
} from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
import { formatCommercialAmount } from "../../utils/collaboration-commercial-display";
import {
  buildFulfillmentIssuePayload,
  FULFILLMENT_ISSUE_DESCRIPTION_MAX,
} from "../../utils/collaboration-fulfillment-issue";
import { actionRequiredLabel } from "../../utils/stage-labels";
import { FulfillmentHistory } from "./FulfillmentHistory";
import { FulfillmentIssueHistory } from "./FulfillmentIssueHistory";

type Props = {
  detail: CollaborationDetailResponse;
  role: UserRole;
  busyAction: string | null;
  onProvide: (payload: ProvideFulfillmentPayload) => void;
  onConfirm: () => void;
  onReportIssue: (payload: ReportFulfillmentIssuePayload) => void;
  onRemediate: (evidenceRef: string) => void;
};
type FormValues = {
  tracking: string;
  courier: string;
  accessRef: string;
  redemptionCode: string;
  serviceRef: string;
  genericDescription: string;
  genericEvidenceRef: string;
};
const EMPTY_FORM: FormValues = {
  tracking: "",
  courier: "",
  accessRef: "",
  redemptionCode: "",
  serviceRef: "",
  genericDescription: "",
  genericEvidenceRef: "",
};

const supportCopy: Record<
  CollaborationBrandSupportType,
  { label: string; provide: string; confirm: string }
> = {
  PRODUCT: {
    label: "Product",
    provide: "Add shipment details",
    confirm: "Confirm you received the product",
  },
  ACCESS_SUBSCRIPTION: {
    label: "Access or subscription",
    provide: "Provide access details",
    confirm: "Confirm access works",
  },
  SERVICE: {
    label: "Service",
    provide: "Share fulfillment details",
    confirm: "Confirm the service was provided",
  },
  EXPERIENCE: {
    label: "Experience",
    provide: "Share fulfillment details",
    confirm: "Confirm the experience was provided",
  },
  OTHER: {
    label: "Other support",
    provide: "Share fulfillment details",
    confirm: "Confirm fulfillment",
  },
};
const trimmed = (value: string) => value.trim() || undefined;

const FULFILLMENT_STATE_LABELS: Record<
  NonNullable<CollaborationDetailResponse["fulfillment"]>["state"],
  string
> = {
  NOT_STARTED: "Not started",
  AWAITING_BRAND_FULFILLMENT: "Waiting for Brand",
  AWAITING_CREATOR_CONFIRMATION: "Waiting for Creator",
  REMEDIATION_REQUIRED: "Remediation required",
  COMPLETED: "Confirmed",
  SKIPPED: "Not required",
  HARD_STOP: "Could not be completed",
  BLOCKED: "Under review",
};

export function FulfillmentPanel({
  detail,
  role,
  busyAction,
  onProvide,
  onConfirm,
  onReportIssue,
  onRemediate,
}: Props) {
  const fulfillment = detail.fulfillment;
  const capabilities = collaborationCapabilities(detail);
  const type = fulfillment?.brandSupportType;
  const copy = type ? supportCopy[type] : null;
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [provideError, setProvideError] = useState<string>();
  const [issueDescription, setIssueDescription] = useState("");
  const [issueEvidence, setIssueEvidence] = useState("");
  const [issueError, setIssueError] = useState<string>();
  const [remediationRef, setRemediationRef] = useState("");
  const [remediationError, setRemediationError] = useState<string>();

  useEffect(() => {
    setForm(EMPTY_FORM);
    setProvideError(undefined);
    setIssueDescription("");
    setIssueEvidence("");
    setIssueError(undefined);
    setRemediationRef("");
    setRemediationError(undefined);
  }, [detail.workflow.aggregateVersion]);

  if (
    !fulfillment ||
    fulfillment.applies === false ||
    fulfillment.state === "SKIPPED"
  ) {
    return (
      <section className="collab-exec-card collab-stage-card collab-fulfillment">
        <header className="collab-stage-card__header">
          <span className="collab-stage-card__icon" aria-hidden="true">
            <PackageCheck size={20} />
          </span>
          <div>
            <p className="collab-stage-card__eyebrow">Brand support</p>
            <h4>Fulfillment</h4>
          </div>
        </header>
        <Alert tone="success" title="No fulfillment required">
          This collaboration does not require Brand-provided support.
        </Alert>
      </section>
    );
  }

  const patchForm = (key: keyof FormValues, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submitProvision = (event: FormEvent) => {
    event.preventDefault();
    if (!type) return;
    let payload: ProvideFulfillmentPayload;
    if (type === "PRODUCT") {
      const description = form.genericDescription.trim();
      if (
        (!form.tracking.trim() && description.length < 3) ||
        (description.length > 0 && description.length < 3)
      ) {
        setProvideError(
          "Add a tracking reference or describe the fulfillment evidence in at least three characters.",
        );
        return;
      }
      payload = {
        shipmentTrackingRef: trimmed(form.tracking),
        courierName: trimmed(form.courier),
        genericFulfillmentEvidence: description
          ? { description, evidenceRef: trimmed(form.genericEvidenceRef) }
          : undefined,
      };
    } else if (type === "ACCESS_SUBSCRIPTION") {
      if (!form.accessRef.trim() && !form.redemptionCode.trim()) {
        setProvideError("Add an access evidence reference or redemption code.");
        return;
      }
      payload = {
        accessEvidenceRef: trimmed(form.accessRef),
        redemptionCode: trimmed(form.redemptionCode),
      };
    } else if (type === "SERVICE" || type === "EXPERIENCE") {
      if (!form.serviceRef.trim()) {
        setProvideError("Add a service or experience evidence reference.");
        return;
      }
      payload = { serviceEvidenceRef: form.serviceRef.trim() };
    } else {
      if (form.genericDescription.trim().length < 3) {
        setProvideError("Describe how fulfillment was provided.");
        return;
      }
      payload = {
        genericFulfillmentEvidence: {
          description: form.genericDescription.trim(),
          evidenceRef: trimmed(form.genericEvidenceRef),
        },
      };
    }
    setProvideError(undefined);
    onProvide(payload);
  };
  const submitIssue = (event: FormEvent) => {
    event.preventDefault();
    const built = buildFulfillmentIssuePayload(issueDescription, issueEvidence);
    if (!built.ok) {
      setIssueError(built.error);
      return;
    }
    setIssueError(undefined);
    onReportIssue(built.payload);
  };
  const submitRemediation = (event: FormEvent) => {
    event.preventDefault();
    if (!remediationRef.trim()) {
      setRemediationError("Add a remediation evidence reference.");
      return;
    }
    setRemediationError(undefined);
    onRemediate(remediationRef.trim());
  };

  const evidence = fulfillment.evidence;
  const assetName = detail.sourceContext.campaignAsset?.name;
  const supportName =
    typeof assetName === "string" && assetName.trim()
      ? assetName.trim()
      : (copy?.label ?? "Brand support");
  const stateCopy = (() => {
    switch (fulfillment.state) {
      case "AWAITING_BRAND_FULFILLMENT":
        return role === "BRAND"
          ? (copy?.provide ?? "Share fulfillment details")
          : "Waiting for the Brand to provide fulfillment details.";
      case "AWAITING_CREATOR_CONFIRMATION":
        return role === "CREATOR"
          ? "Review what the Brand provided and confirm or report an issue."
          : "Waiting for the Creator to review fulfillment.";
      case "REMEDIATION_REQUIRED":
        return role === "BRAND"
          ? "Review the reported issue and provide one remediation."
          : "Issue reported. Waiting for the Brand to provide remediation.";
      case "COMPLETED":
        return "Fulfillment confirmed.";
      case "HARD_STOP":
        return "Fulfillment could not be completed after the permitted attempts.";
      case "BLOCKED":
        return "Fulfillment is under review.";
      default:
        return "Fulfillment details are not yet available.";
    }
  })();
  return (
    <section
      className="collab-exec-card collab-stage-card collab-fulfillment"
      aria-labelledby="collab-fulfillment-title"
    >
      <header className="collab-stage-card__header">
        <span className="collab-stage-card__icon" aria-hidden="true">
          <PackageCheck size={20} />
        </span>
        <div>
          <p className="collab-stage-card__eyebrow">Brand support</p>
          <h4 id="collab-fulfillment-title">Fulfillment</h4>
        </div>
        <span className="collab-stage-card__status">
          {actionRequiredLabel(detail.workflow.actionRequiredBy)}
        </span>
      </header>
      <p className="collab-stage-card__lead" role="status">
        {stateCopy}
      </p>

      <section className="collab-support-card" aria-label="Fulfillment details">
        <header>
          <div>
            <span>{copy?.label ?? "Brand support"}</span>
            <strong>{supportName}</strong>
          </div>
          <span className="collab-support-card__status">
            {FULFILLMENT_STATE_LABELS[fulfillment.state]}
          </span>
        </header>
        {evidence.brandFulfilledAt ? (
          <dl className="collab-facts collab-facts--stage">
            {fulfillment.brandSupportEstimatedValue != null ? (
              <div>
                <dt>Estimated support value</dt>
                <dd>
                  {formatCommercialAmount(
                    fulfillment.brandSupportEstimatedValue,
                    detail.commercial?.currency,
                  )}
                </dd>
              </div>
            ) : null}
            {evidence.courierName ? (
              <div>
                <dt>Courier</dt>
                <dd>{evidence.courierName}</dd>
              </div>
            ) : null}
            {evidence.shipmentTrackingRef ? (
              <div>
                <dt>Tracking reference</dt>
                <dd className="collab-evidence-ref">
                  {evidence.shipmentTrackingRef}
                </dd>
              </div>
            ) : null}
            {evidence.accessEvidenceRef ? (
              <div>
                <dt>Access evidence</dt>
                <dd className="collab-evidence-ref">
                  {evidence.accessEvidenceRef}
                </dd>
              </div>
            ) : null}
            {evidence.redemptionCode ? (
              <div>
                <dt>Redemption code</dt>
                <dd className="collab-evidence-ref">
                  {evidence.redemptionCode}
                </dd>
              </div>
            ) : null}
            {evidence.serviceEvidenceRef ? (
              <div>
                <dt>Fulfillment evidence</dt>
                <dd className="collab-evidence-ref">
                  {evidence.serviceEvidenceRef}
                </dd>
              </div>
            ) : null}
            {evidence.genericFulfillmentEvidence?.description ? (
              <div>
                <dt>Details</dt>
                <dd>{evidence.genericFulfillmentEvidence.description}</dd>
              </div>
            ) : null}
            {evidence.genericFulfillmentEvidence?.evidenceRef ? (
              <div>
                <dt>Evidence reference</dt>
                <dd className="collab-evidence-ref">
                  {evidence.genericFulfillmentEvidence.evidenceRef}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </section>

      <FulfillmentHistory
        fulfillment={fulfillment}
        supportLabel={supportName}
      />

      {capabilities.has("provide-fulfillment") && type ? (
        <form
          className="collab-command-form collab-command-form--stage"
          onSubmit={submitProvision}
          aria-busy={busyAction === "provide-fulfillment"}
        >
          <h5>{copy?.provide}</h5>
          {type === "PRODUCT" ? (
            <>
              <TextField
                label="Shipment tracking reference"
                value={form.tracking}
                onChange={(event) => patchForm("tracking", event.target.value)}
                disabled={busyAction !== null}
              />
              <TextField
                label="Courier name"
                value={form.courier}
                onChange={(event) => patchForm("courier", event.target.value)}
                disabled={busyAction !== null}
              />
              <TextField
                label="Evidence description"
                multiline
                value={form.genericDescription}
                onChange={(event) =>
                  patchForm("genericDescription", event.target.value)
                }
                disabled={busyAction !== null}
                helperText="Optional when a tracking reference is provided."
              />
              <TextField
                label="Supporting evidence reference"
                value={form.genericEvidenceRef}
                onChange={(event) =>
                  patchForm("genericEvidenceRef", event.target.value)
                }
                disabled={busyAction !== null}
              />
            </>
          ) : null}
          {type === "ACCESS_SUBSCRIPTION" ? (
            <>
              <TextField
                label="Access evidence reference"
                value={form.accessRef}
                onChange={(event) => patchForm("accessRef", event.target.value)}
                disabled={busyAction !== null}
              />
              <TextField
                label="Redemption code"
                value={form.redemptionCode}
                onChange={(event) =>
                  patchForm("redemptionCode", event.target.value)
                }
                disabled={busyAction !== null}
              />
            </>
          ) : null}
          {type === "SERVICE" || type === "EXPERIENCE" ? (
            <TextField
              label={`${copy?.label ?? "Fulfillment"} evidence reference`}
              value={form.serviceRef}
              onChange={(event) => patchForm("serviceRef", event.target.value)}
              disabled={busyAction !== null}
            />
          ) : null}
          {type === "OTHER" ? (
            <>
              <TextField
                label="Fulfillment description"
                multiline
                value={form.genericDescription}
                onChange={(event) =>
                  patchForm("genericDescription", event.target.value)
                }
                disabled={busyAction !== null}
              />
              <TextField
                label="Evidence reference"
                value={form.genericEvidenceRef}
                onChange={(event) =>
                  patchForm("genericEvidenceRef", event.target.value)
                }
                disabled={busyAction !== null}
              />
            </>
          ) : null}
          {provideError ? (
            <p className="collab-form-error" role="alert">
              {provideError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={busyAction !== null}
            fullWidthOnMobile
          >
            {busyAction === "provide-fulfillment"
              ? "Saving details…"
              : copy?.provide}
          </Button>
        </form>
      ) : null}

      {capabilities.has("confirm-fulfillment") ? (
        <div
          className="collab-exec-actions collab-stage-actions"
          aria-busy={busyAction === "confirm-fulfillment"}
        >
          <p>Review the details above before confirming.</p>
          <Button
            className="collab-stage-actions__primary"
            disabled={busyAction !== null}
            onClick={onConfirm}
            fullWidthOnMobile
          >
            {busyAction === "confirm-fulfillment"
              ? "Confirming…"
              : (copy?.confirm ?? "Confirm fulfillment")}
          </Button>
        </div>
      ) : null}

      {capabilities.has("report-fulfillment-issue") ? (
        <form
          className="collab-command-form collab-command-form--stage collab-command-form--secondary"
          onSubmit={submitIssue}
          aria-busy={busyAction === "report-fulfillment-issue"}
        >
          <h5>Report fulfillment issue</h5>
          <TextField
            label="Describe the issue"
            multiline
            value={issueDescription}
            onChange={(event) => {
              setIssueDescription(event.target.value);
              setIssueError(undefined);
            }}
            error={issueError}
            disabled={busyAction !== null}
            maxLength={FULFILLMENT_ISSUE_DESCRIPTION_MAX}
            helperText="Describe what needs attention. Evidence is optional."
          />
          <TextField
            label="Evidence reference (optional)"
            value={issueEvidence}
            onChange={(event) => setIssueEvidence(event.target.value)}
            disabled={busyAction !== null}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={busyAction !== null}
            fullWidthOnMobile
          >
            {busyAction === "report-fulfillment-issue"
              ? "Reporting…"
              : "Report fulfillment issue"}
          </Button>
        </form>
      ) : null}

      <FulfillmentIssueHistory issues={fulfillment.issues} />
      {fulfillment.state === "REMEDIATION_REQUIRED" && role === "CREATOR" ? (
        <Alert tone="warning" title="Issue reported">
          Waiting for the Brand to provide remediation.
        </Alert>
      ) : null}
      {capabilities.has("remediate-fulfillment") ? (
        <form
          className="collab-command-form collab-command-form--stage"
          onSubmit={submitRemediation}
          aria-busy={busyAction === "remediate-fulfillment"}
        >
          <h5>Provide remediation</h5>
          <p>Address the reported issue and share updated evidence.</p>
          <TextField
            label="Remediation evidence reference"
            value={remediationRef}
            onChange={(event) => {
              setRemediationRef(event.target.value);
              setRemediationError(undefined);
            }}
            error={remediationError}
            disabled={busyAction !== null}
          />
          <Button
            type="submit"
            disabled={busyAction !== null}
            fullWidthOnMobile
          >
            {busyAction === "remediate-fulfillment"
              ? "Submitting…"
              : "Provide remediation"}
          </Button>
        </form>
      ) : null}
      {fulfillment.state === "COMPLETED" ? (
        <Alert tone="success" title="Fulfillment confirmed">
          Fulfillment is complete. The collaboration can proceed.
        </Alert>
      ) : null}
      {fulfillment.state === "HARD_STOP" ? (
        <Alert tone="warning" title="Fulfillment could not be completed">
          The collaboration outcome is shown in the resolution summary.
        </Alert>
      ) : null}
    </section>
  );
}
