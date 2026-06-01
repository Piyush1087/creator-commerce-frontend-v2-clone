import { 
  Calendar, 
  Info, 
  Target, 
  Users, 
  Package, 
  FileText, 
  Rocket, 
  Trash2, 
  ChevronRight, 
  X,
  Zap,
  ShieldAlert,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  Menu
} from "lucide-react";
import { useState } from "react";

import { Alert } from "../../../design-system/aurora";
import type { BrandCentrePlannerDashboardResponse } from "../contracts/brand-centre.contracts";
import type { ApiJsonLoadState } from "../hooks/use-brand-centre-api-json";
import { displayField, EMPTY_FIELD } from "../utils/display-field";
import { PlannerAggregateStatusBanner } from "./PlannerAggregateStatusBanner";

type CampaignPlannerProps = {
  state: ApiJsonLoadState<BrandCentrePlannerDashboardResponse>;
};

export function CampaignPlanner({ state }: CampaignPlannerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const dashboard = state.status === "ready" ? state.data : null;
  const cards = dashboard?.cards ?? [];
  const newCards = cards.filter((c) => c.cardType === "NEW_CAMPAIGN");
  const updateCards = cards.filter((c) => c.cardType === "SUGGESTED_UPDATE");
  const autoPauseCards = cards.filter((c) => c.cardType === "AUTO_PAUSE_LOG");
  const totalCards = dashboard?.totalCards ?? 0;
  const pendingReviewCount = newCards.length + updateCards.length;
  const hasPlannerCards = totalCards > 0;
  const aggregateJob = dashboard?.plannerAggregateJob ?? null;
  const isPlannerAggregateRunning =
    aggregateJob?.status === "QUEUED" || aggregateJob?.status === "RUNNING";

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  return (
    <div className="campaign-planner-tab" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {isPlannerAggregateRunning ? (
        <PlannerAggregateStatusBanner jobStatus={aggregateJob?.status ?? null} />
      ) : null}

      {/* Dashboard Meta-Data */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "16px", 
        borderBottom: "1px solid var(--border-default)", 
        paddingBottom: "16px" 
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 12px", background: "var(--surface-container)", borderRadius: "100px", border: "1px solid var(--border-default)" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--status-error)" }}></span>
            <span>
              Status:{" "}
              <strong>
                {hasPlannerCards ? "Drafts Pending Review" : EMPTY_FIELD}
              </strong>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 12px", background: "var(--surface-workflow)", borderRadius: "100px", border: "1px solid var(--color-primary)", color: "var(--color-primary)" }}>
            <Zap size={14} />
            <span>
              Consolidation Engine:{" "}
              <strong>{hasPlannerCards ? "ACTIVE" : EMPTY_FIELD}</strong>
            </span>
          </div>
        </div>

        <div style={{ 
          background: "var(--surface-container-lowest)", 
          padding: "16px", 
          borderRadius: "12px", 
          border: "1px solid var(--border-default)", 
          display: "flex", 
          gap: "12px",
          boxShadow: "0 0 15px rgba(52, 211, 153, 0.2)"
        }}>
          <Info size={20} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            The system intelligently consolidates your approved insights. Rather than launching 15 separate briefs, it groups tasks automatically by <strong>[Objective × Influencer Size]</strong> into unified master campaigns.
          </p>
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <p className="brand-centre-page__loading">Loading planner…</p>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Could not load Planner">
          {state.message}
        </Alert>
      ) : null}

      {state.status === "ready" && !hasPlannerCards && !isPlannerAggregateRunning ? (
        <Alert tone="warning" title="No planner cards yet">
          Tab 3 fills after Tab 2 intelligence refresh completes and you move a
          leak into the planner (API: POST move-to-planner). The consolidation
          job then creates draft cards here.
        </Alert>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {/* Left Column: Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Orchestrated Drafts */}
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Orchestrated Drafts</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>New Objective/Tier combinations grouped into fresh master campaigns.</p>
            </div>

            {newCards.length === 0 ? (
              <p className="brand-centre-page__placeholder">{EMPTY_FIELD}</p>
            ) : null}

            {newCards.map((card) => (
              <div key={card.id} className="campaign-card" style={{ 
                background: "var(--surface-card)", 
                borderRadius: "12px", 
                border: "2px solid var(--color-primary)", 
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <span style={{ alignSelf: "flex-start", background: "var(--surface-workflow)", color: "var(--color-primary)", fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--color-primary)" }}>🟢 NEW CAMPAIGN</span>
                <h4 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
                  {displayField(card.aiContextHook)}
                </h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px 0", borderTop: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
                    <Target size={16} />
                    <span>
                      Objective: <strong>{displayField(card.objective)}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
                    <Users size={16} />
                    <span>
                      Tier: <strong>{displayField(card.targetCreatorTier)}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <p style={{ margin: 0 }}>
                    📦 Products assigned:{" "}
                    <strong>
                      {card.strategy?.assets?.length
                        ? String(card.strategy.assets.length)
                        : EMPTY_FIELD}
                    </strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    📝 Production briefs:{" "}
                    <strong>
                      {card.strategy?.assets?.length
                        ? String(
                            card.strategy.assets.reduce(
                              (sum, asset) => sum + (asset.briefName !== "-" ? 1 : 0),
                              0,
                            ) || card.strategy.assets.length,
                          )
                        : EMPTY_FIELD}
                    </strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    📝 Workflow:{" "}
                    <strong>{displayField(card.workflowStatus)}</strong>
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid var(--border-default)" }}>
                  <button 
                    onClick={() => undefined}
                    disabled
                    style={{ background: "none", border: "none", color: "var(--status-error)", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                  >
                    Discard ❌
                  </button>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button 
                      onClick={() => {
                        setSelectedCardId(card.id);
                        setIsDrawerOpen(true);
                      }}
                      style={{ background: "none", border: "none", color: "var(--text-high)", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                    >
                      Details 📄
                    </button>
                    <button style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                      Launch 🚀
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Pipeline Suggestions */}
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Pipeline Suggestions</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Injecting new directives into existing active campaigns.</p>
            </div>

            {updateCards.length === 0 ? (
              <p className="brand-centre-page__placeholder">{EMPTY_FIELD}</p>
            ) : null}

            {updateCards.map((card) => (
              <div key={card.id} className="campaign-card" style={{ 
                background: "var(--status-warning-bg)", 
                borderRadius: "12px", 
                border: "2px solid var(--tertiary-container)", 
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <span style={{ alignSelf: "flex-start", background: "var(--tertiary-fixed)", color: "var(--tertiary)", fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--tertiary-container)" }}>🟡 SUGGESTED UPDATE</span>
                <h4 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                  Append to: {displayField(card.existingTargetCampaignId)}
                </h4>
                <p style={{ margin: 0, fontSize: "14px", fontStyle: "italic" }}>
                  "{displayField(card.aiContextHook)}"
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", padding: "12px 0", borderTop: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)" }}>
                  <p style={{ margin: 0, color: "var(--text-muted)" }}>
                    Objective: <strong>{displayField(card.objective)}</strong>
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)" }}>
                    Tier: <strong>{displayField(card.targetCreatorTier)}</strong>
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid var(--border-default)" }}>
                  <button
                    onClick={() => undefined}
                    disabled
                    style={{ background: "none", border: "none", color: "var(--status-error)", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                  >
                    Discard ❌
                  </button>
                  <button style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Update 🚀</button>
                </div>
              </div>
            ))}
          </section>

          {/* Auto-Executed Actions */}
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Auto-Executed Pauses & Security</h3>
            <div style={{ background: "var(--status-warning-bg)", borderRadius: "12px", border: "2px solid var(--status-error)", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--status-error)", marginBottom: "16px" }}>
                <ShieldAlert size={24} />
                <p style={{ fontSize: "12px", fontWeight: 800, margin: 0, textTransform: "uppercase" }}>IMMEDIATE SYSTEM ACTIONS SUMMARY</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-default)", paddingTop: "16px" }}>
                {autoPauseCards.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "14px" }}>{EMPTY_FIELD}</p>
                ) : (
                  autoPauseCards.map((card) => (
                    <div key={card.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                      <PauseCircle size={16} color="var(--status-error)" />
                      <span>
                        Auto-paused: <strong>{displayField(card.aiContextHook)}</strong>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Health */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "var(--bg-sidebar)", padding: "24px", borderRadius: "12px", color: "white" }}>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary-container)", textTransform: "uppercase", margin: "0 0 16px 0" }}>Consolidation Health</h4>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "32px", fontWeight: 800 }}>{hasPlannerCards ? "Active" : EMPTY_FIELD}</span>
            </div>
            {hasPlannerCards ? (
              <div
                style={{
                  height: "6px",
                  width: "100%",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.round((pendingReviewCount / totalCards) * 100))}%`,
                    height: "100%",
                    background: "var(--primary-container)",
                  }}
                />
              </div>
            ) : null}
          </div>

          <div style={{ background: "var(--surface-card)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-default)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Pending Tasks</h4>
              <span style={{ background: "var(--status-error)", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "100px" }}>
                {pendingReviewCount > 0
                  ? `${pendingReviewCount} Priority`
                  : EMPTY_FIELD}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--surface-container-low)", borderRadius: "8px" }}>
                <AlertTriangle size={16} style={{ color: "var(--status-error)" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700 }}>
                    {pendingReviewCount > 0 ? "Review drafts" : "All clear"}
                  </p>
                  <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>
                    Consolidated from {hasPlannerCards ? String(totalCards) : EMPTY_FIELD} insights
                  </p>
                </div>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STRATEGY DRAWER */}
      {isDrawerOpen && (
        <>
          <div 
            onClick={() => setIsDrawerOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 300 }} 
          />
          <div style={{ 
            position: "fixed", 
            right: 0, 
            top: 0, 
            height: "100%", 
            width: "min(40%, 600px)", 
            background: "var(--surface-card)", 
            zIndex: 400, 
            boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, textTransform: "uppercase" }}>Strategy Overview Workspace</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Master Shell: "{displayField(selectedCard?.aiContextHook)}"
                </p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                <X size={18} /> CLOSE
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "32px" }}>
              <section>
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", marginBottom: "16px" }}>1. Core Strategy Blueprint</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                  <p>
                    🎯 <strong>Objective:</strong> {displayField(selectedCard?.strategy?.objective ?? selectedCard?.objective)}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p>👥 <strong>Persona Targeting:</strong></p>
                    <ul style={{ paddingLeft: "24px", margin: 0, listStyle: "disc", color: "var(--text-muted)" }}>
                      {(selectedCard?.strategy?.personaTargeting ?? [EMPTY_FIELD]).map((p, i) => (
                        <li key={i}>{displayField(p)}</li>
                      ))}
                    </ul>
                  </div>
                  <p>
                    💰 <strong>Budget:</strong> {displayField(selectedCard?.strategy?.budget)}
                  </p>
                  <p>
                    📅 <strong>Deadline:</strong> {displayField(selectedCard?.strategy?.deadline)}
                  </p>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", marginBottom: "16px" }}>2. Consolidated Products & Briefs Matrix</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {(selectedCard?.strategy?.assets ?? []).map((asset, i) => (
                    <div key={i} style={{ borderLeft: "2px solid var(--primary-container)", paddingLeft: "16px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>👉 ASSET {i + 1}: {displayField(asset.productName)}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                        <p style={{ margin: 0 }}>📝 <strong>Brief:</strong> {displayField(asset.briefName)}</p>
                        <p style={{ margin: 0 }}>✨ <strong>Pillars:</strong> {asset.pillars.map((p) => displayField(p)).join(", ")}</p>
                        <p style={{ margin: 0 }}>📦 <strong>Deliverables:</strong> {asset.deliverables.map((d) => displayField(d)).join(", ")}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedCard?.strategy?.assets || selectedCard.strategy.assets.length === 0) && (
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{EMPTY_FIELD}</p>
                  )}
                </div>
              </section>
            </div>

            <div style={{ padding: "24px", borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <button style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                Proceed to Setup Pipeline
              </button>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: "none", border: "1px solid var(--border-default)", padding: "12px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              >
                Close Workspace Drawer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
