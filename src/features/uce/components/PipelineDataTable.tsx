import type { PipelineCollaborationRow } from "../contracts/brand-uce.contracts";
import { displayField } from "../utils/display-field";
import { formatPercent } from "../utils/uce-format";

type PipelineDataTableProps = {
  rows: PipelineCollaborationRow[];
  emptyLabel?: string;
};

export function PipelineDataTable({
  rows,
  emptyLabel = "No pipeline rows returned from API.",
}: PipelineDataTableProps) {
  if (rows.length === 0) {
    return <p className="uce-pipeline-empty">{emptyLabel}</p>;
  }

  return (
    <div className="uce-table-scroll">
      <table className="uce-pipeline-api-table">
        <thead>
          <tr>
            <th>Creator</th>
            <th>Brief</th>
            <th>Product</th>
            <th>Match</th>
            <th>Status</th>
            <th>Milestone</th>
            <th>Health</th>
            <th>Quote</th>
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
              <td>{displayField(row.product_sku_name)}</td>
              <td>{formatPercent(row.match_score)}</td>
              <td>{displayField(row.collab_status)}</td>
              <td>{displayField(row.current_milestone)}</td>
              <td>{displayField(row.pipeline_health)}</td>
              <td>
                {row.total_quote > 0
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(row.total_quote)
                  : displayField(null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
