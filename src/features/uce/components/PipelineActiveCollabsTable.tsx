import { Link } from "react-router-dom";

import { collaborationsThreadUrl } from "../../auth/constants";
import type { PipelineCollaborationRow } from "../contracts/brand-uce.contracts";
import { displayField } from "../utils/display-field";
import { formatPercent } from "../utils/uce-format";

type PipelineActiveCollabsTableProps = {
  rows: PipelineCollaborationRow[];
};

export function PipelineActiveCollabsTable({ rows }: PipelineActiveCollabsTableProps) {
  if (rows.length === 0) {
    return <p className="uce-pipeline-empty">No active collaborations yet.</p>;
  }

  return (
    <div className="uce-table-scroll">
      <table className="uce-pipeline-api-table">
        <thead>
          <tr>
            <th>Creator</th>
            <th>Brief</th>
            <th>Match</th>
            <th>Milestone</th>
            <th>Workflow</th>
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
              <td>{displayField(row.current_milestone)}</td>
              <td>
                {row.workflow_collaboration_id ? (
                  <Link to={collaborationsThreadUrl(row.workflow_collaboration_id)}>
                    Open collaboration
                  </Link>
                ) : (
                  <span className="uce-pipeline-sub">Provisioning…</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
