import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../../design-system/aurora";
import { collaborationsThreadUrl } from "../../auth/constants";
import {
  postApproveApplicant,
  postRejectApplicant,
} from "../api/brand-uce-client";
import type { PipelineCollaborationRow } from "../contracts/brand-uce.contracts";
import { displayField } from "../utils/display-field";
import { formatPercent } from "../utils/uce-format";

type PipelineApplicantsTableProps = {
  campaignId: string;
  rows: PipelineCollaborationRow[];
  onChanged: () => void;
};

export function PipelineApplicantsTable({
  campaignId,
  rows,
  onChanged,
}: PipelineApplicantsTableProps) {
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (row: PipelineCollaborationRow) => {
    setBusyId(row.collaboration_id);
    setError(null);
    try {
      const updated = await postApproveApplicant(campaignId, row.collaboration_id);
      onChanged();
      if (updated.workflow_collaboration_id) {
        navigate(collaborationsThreadUrl(updated.workflow_collaboration_id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (row: PipelineCollaborationRow) => {
    const reason = window.prompt("Rejection reason (required):");
    if (!reason?.trim()) {
      return;
    }
    setBusyId(row.collaboration_id);
    setError(null);
    try {
      await postRejectApplicant(campaignId, row.collaboration_id, reason.trim());
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) {
    return <p className="uce-pipeline-empty">No applicants yet.</p>;
  }

  return (
    <>
      {error ? (
        <p role="alert" style={{ color: "var(--color-danger)", fontSize: 14 }}>
          {error}
        </p>
      ) : null}
      <div className="uce-table-scroll">
        <table className="uce-pipeline-api-table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Brief</th>
              <th>Match</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.collaboration_id}>
                <td>
                  <strong>{displayField(row.instagram_handle)}</strong>
                  <div className="uce-pipeline-sub">{displayField(row.creator_email)}</div>
                </td>
                <td>{displayField(row.brief_internal_title)}</td>
                <td>{formatPercent(row.match_score)}</td>
                <td>{displayField(row.collab_status)}</td>
                <td>
                  {row.collab_status === "APPLICANT_PENDING" ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button
                        size="sm"
                        disabled={busyId === row.collaboration_id}
                        onClick={() => void handleApprove(row)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === row.collaboration_id}
                        onClick={() => void handleReject(row)}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : row.workflow_collaboration_id ? (
                    <Link to={collaborationsThreadUrl(row.workflow_collaboration_id)}>
                      Open chat
                    </Link>
                  ) : (
                    <span className="uce-pipeline-sub">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
