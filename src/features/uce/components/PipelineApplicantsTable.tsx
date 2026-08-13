import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../design-system/aurora";
import { collaborationsThreadUrl } from "../../auth/constants";
import {
  approveCanonicalApplication,
  rejectCanonicalApplication,
} from "../api/brand-uce-client";
import type { CanonicalApplicant } from "../contracts/brand-uce.contracts";
import { displayField } from "../utils/display-field";

type PipelineApplicantsTableProps = {
  campaignId: string;
  rows: CanonicalApplicant[];
  onChanged: () => void;
};

export function PipelineApplicantsTable({ campaignId, rows, onChanged }: PipelineApplicantsTableProps) {
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approve = async (row: CanonicalApplicant) => {
    setBusyId(row.applicationId);
    setError(null);
    try {
      const result = await approveCanonicalApplication(campaignId, row.applicationId);
      onChanged();
      if (result.workflowCollaborationId) {
        navigate(collaborationsThreadUrl(result.workflowCollaborationId));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (row: CanonicalApplicant) => {
    const reason = window.prompt("Rejection reason (required):");
    if (!reason?.trim()) return;
    setBusyId(row.applicationId);
    setError(null);
    try {
      await rejectCanonicalApplication(campaignId, row.applicationId, reason.trim());
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reject failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) return <p className="uce-pipeline-empty">No applicants yet.</p>;
  return (
    <>
      {error ? <p role="alert" style={{ color: "var(--color-danger)", fontSize: 14 }}>{error}</p> : null}
      <div className="uce-table-scroll">
        <table className="uce-pipeline-api-table">
          <thead><tr><th>Creator</th><th>Application</th><th>Canonical selection</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.applicationId}>
                <td><strong>{displayField(row.name)}</strong><div className="uce-pipeline-sub">{displayField(row.socialHandle ?? row.email)}</div></td>
                <td><code>{row.applicationId}</code></td>
                <td>{row.canonicalCampaignAssetId && row.canonicalBriefId ? "Asset + Brief persisted" : "Validated by canonical approval"}</td>
                <td>{displayField(row.applicationStatus)}</td>
                <td>
                  {row.applicationStatus === "PENDING" ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button size="sm" disabled={busyId === row.applicationId} onClick={() => void approve(row)}>Approve</Button>
                      <Button size="sm" variant="secondary" disabled={busyId === row.applicationId} onClick={() => void reject(row)}>Decline</Button>
                    </div>
                  ) : <span className="uce-pipeline-sub">{row.applicationStatus}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
