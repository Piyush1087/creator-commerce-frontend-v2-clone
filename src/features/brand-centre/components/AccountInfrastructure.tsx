import type { BrandCentreViewModel } from "../types";
import { hasDisplayValue } from "../utils/display-field";

interface AccountInfrastructureProps {
  data: BrandCentreViewModel;
}

function StatusBadge({ label }: { label: string }) {
  const muted = !hasDisplayValue(label);
  return (
    <span
      style={{
        background: muted ? "var(--surface-page)" : "rgba(52, 211, 153, 0.1)",
        color: muted ? "var(--text-muted)" : "var(--color-primary)",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

export function AccountInfrastructure({ data }: AccountInfrastructureProps) {
  return (
    <div className="aurora-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          Account & Setup Infrastructure
        </h2>
      </div>

      <div
        style={{
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "48px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Plan & Financials
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Escrow Status
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <StatusBadge label={data.escrowStatus} />
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Current Plan
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                {data.currentPlan}
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Outreach Quota
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                {data.outreachQuotaLabel}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Integrations & Team
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Meta Connection Status
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <StatusBadge label={data.metaConnectionStatus} />
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Team Management
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                  marginTop: 0,
                }}
              >
                {data.teamManagement}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
