import { Alert } from "../../../../design-system/aurora";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { SettlementCard } from "../publishing/SettlementCard";
import { FeedbackPanel } from "./FeedbackPanel";

type Props = { detail: CollaborationDetailResponse; feedbackBusy: boolean; feedbackError: string | null; onSubmitFeedback: (rating: number, reviewText?: string) => void };
export function CompletedPanel({ detail, feedbackBusy, feedbackError, onSubmitFeedback }: Props) {
  const verified = detail.deliverables.filter((item) => item.publishing?.state === "COMPLIANCE_VERIFIED").length;
  const notRequired = detail.deliverables.filter((item) => !item.publishingRequired || item.publishing?.state === "PUBLISHING_NOT_REQUIRED").length;
  const approved = detail.deliverables.filter((item) => item.state === "APPROVED").length;
  const autoApproved = detail.deliverables.filter((item) => item.state === "AUTO_APPROVED").length;
  return <section className="collab-completed" aria-labelledby="collab-completed-title"><article className="collab-exec-card"><h4 id="collab-completed-title">Collaboration completed</h4><Alert tone="success" title="Execution complete">No normal execution action remains. Chat is still available.</Alert><dl className="collab-facts"><div><dt>Completed</dt><dd>{detail.lifecycle.completedAt ? new Date(detail.lifecycle.completedAt).toLocaleString() : "Completed"}</dd></div><div><dt>Campaign</dt><dd>{detail.sourceContext.campaign.name}</dd></div><div><dt>Brief</dt><dd>{detail.sourceContext.brief.title}</dd></div><div><dt>Deliverables completed</dt><dd>{detail.deliverables.length}</dd></div><div><dt>Approved by Brand</dt><dd>{approved}</dd></div><div><dt>Auto-approved</dt><dd>{autoApproved}</dd></div><div><dt>Published and verified</dt><dd>{verified}</dd></div><div><dt>Publishing not required</dt><dd>{notRequired}</dd></div>{detail.commercial ? <><div><dt>Creator fee</dt><dd>{detail.commercial.currency} {detail.commercial.agreedCreatorFee ?? 0}</dd></div><div><dt>Commercial terms</dt><dd>{detail.commercial.termsLocked ? "Confirmed" : "Not projected"}</dd></div></> : null}</dl></article><SettlementCard detail={detail} /><FeedbackPanel detail={detail} busy={feedbackBusy} actionError={feedbackError} onSubmit={onSubmitFeedback} /></section>;
}
