import {
  BarChart3,
  Brain,
  ChevronDown,
  Folder as FolderIcon,
  Lightbulb as LightbulbIcon,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Alert } from "../../../design-system/aurora";
import {
  fetchBrandCentreLeakDetail,
  postMoveLeakToPlanner,
  type BrandCentreLeakDetailResponse,
} from "../api/brand-centre-client";
import type {
  BrandCentreIntelligenceLeakSummary,
  BrandCentreIntelligenceResponse,
} from "../contracts/brand-centre.contracts";
import type { ApiJsonLoadState } from "../hooks/use-brand-centre-api-json";
import { displayField, displayPercentLift, EMPTY_FIELD } from "../utils/display-field";
import { IntelligenceRefreshStatusBanner } from "./IntelligenceRefreshStatusBanner";
import { ShareOfVoiceDonut } from "./ShareOfVoiceDonut";

type IntelligenceGapsProps = {
  state: ApiJsonLoadState<BrandCentreIntelligenceResponse>;
  onReloadIntelligence: () => Promise<void>;
  onPlannerJobStarted: () => void;
};

export function IntelligenceGaps({
  state,
  onReloadIntelligence,
  onPlannerJobStarted,
}: IntelligenceGapsProps) {
  const [activeZone, setActiveZone] = useState<string | null>("zone2");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLeakId, setSelectedLeakId] = useState<string | null>(null);
  const [drawerLeak, setDrawerLeak] = useState<BrandCentreLeakDetailResponse | null>(
    null,
  );
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [movingLeakId, setMovingLeakId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    tone: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const toggleAccordion = (id: string) => {
    setActiveZone(activeZone === id ? null : id);
  };

  const data = state.status === "ready" ? state.data : null;
  const baseline = data?.baseline;

  const activeLeaks = useMemo(
    () =>
      (data?.leaks ?? []).filter(
        (leak) =>
          !leak.isArchived && leak.plannerStatus === "PENDING_USER_REVIEW",
      ),
    [data?.leaks],
  );

  const movedToPlannerCount = useMemo(
    () =>
      (data?.leaks ?? []).filter(
        (leak) => !leak.isArchived && leak.plannerStatus === "PUSHED_TO_PLANNER",
      ).length,
    [data?.leaks],
  );

  const selectedLeak =
    activeLeaks.find((leak) => leak.id === selectedLeakId) ?? null;

  const openDrawer = useCallback(async (leak: BrandCentreIntelligenceLeakSummary) => {
    setSelectedLeakId(leak.id);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerLeak(null);
    try {
      const detail = await fetchBrandCentreLeakDetail(leak.id);
      setDrawerLeak(detail);
    } catch {
      setDrawerLeak({
        ...leak,
      });
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const handleMoveToPlanner = useCallback(
    async (leakId: string) => {
      setMovingLeakId(leakId);
      setActionNotice(null);
      try {
        await postMoveLeakToPlanner(leakId);
        await onReloadIntelligence();
        onPlannerJobStarted();
        setActionNotice({
          tone: "success",
          message:
            "Insight approved. Open Tab 3: Campaign Planner — a draft is building (loader shown while Gemini runs).",
        });
      } catch (err) {
        setActionNotice({
          tone: "error",
          message:
            err instanceof Error
              ? err.message
              : "Could not move insight to planner.",
        });
      } finally {
        setMovingLeakId(null);
      }
    },
    [onReloadIntelligence, onPlannerJobStarted],
  );

  const refreshJob = data?.refreshJob ?? null;
  const isIntelligenceRefreshRunning =
    refreshJob?.status === "QUEUED" || refreshJob?.status === "RUNNING";

  return (
    <div
      className="intelligence-gaps-tab"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {isIntelligenceRefreshRunning ? (
        <IntelligenceRefreshStatusBanner
          jobStatus={refreshJob?.status ?? null}
          jobId={refreshJob?.id ?? null}
        />
      ) : null}

      <div
        style={{
          background: "var(--surface-container-low)",
          padding: "12px 0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "16px",
          fontSize: "12px",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--color-primary)",
              animation: "pulse 2s infinite",
            }}
          />
          <span>
            System Status:{" "}
            <strong style={{ color: "var(--color-primary)" }}>
              {displayField(data?.systemStatus)}
            </strong>
          </span>
        </div>
        <div
          style={{
            height: "16px",
            width: "1px",
            background: "var(--border-default)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart3 size={14} />
          <span>Data Refreshed: {displayField(data?.dataRefreshedAt)}</span>
        </div>
        <div
          style={{
            height: "16px",
            width: "1px",
            background: "var(--border-default)",
          }}
        />
        <span>Date Range: {displayField(data?.dateRangeLabel)}</span>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <p className="brand-centre-page__loading">Loading intelligence…</p>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Could not load Intelligence">
          {state.message}
        </Alert>
      ) : null}

      {actionNotice ? (
        <Alert tone={actionNotice.tone} title="Campaign Planner">
          {actionNotice.message}
        </Alert>
      ) : null}

      <section
        className={`aurora-card ${
          activeZone === "zone1" ? "accordion-active" : ""
        }`}
        style={{ padding: 0, overflow: "hidden" }}
      >
        <header
          onClick={() => toggleAccordion("zone1")}
          style={{
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            background: "var(--surface-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: "var(--surface-container)",
                display: "flex",
                alignItems: "center",
                justifyItems: "center",
              }}
            >
              <BarChart3
                size={24}
                style={{ margin: "auto", color: "var(--secondary)" }}
              />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              Influencer Performance & Alignment Dashboard (
              {displayField(data?.dateRangeLabel)})
            </h2>
          </div>
          <ChevronDown
            style={{
              transform:
                activeZone === "zone1" ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.3s",
            }}
          />
        </header>

        {activeZone === "zone1" && (
          <div
            style={{
              padding: "24px",
              borderTop: "1px solid var(--border-default)",
              display: "flex",
              flexDirection: "column",
              gap: "48px",
            }}
          >
            {/* Section 1: Predictive Impact */}
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                  }}
                >
                  Growth Opportunities & Predictive Impact
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                  This section isolates our current baseline ("As-Is") and projects the immediate revenue lift available.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    📈 IMPACT INDEX
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "var(--color-primary)",
                      fontWeight: 700,
                      fontSize: "20px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                      }}
                    />
                    <span>
                      {baseline?.growthImpactMatrix?.totalRevenueLiftPercentage != null
                        ? `+${baseline.growthImpactMatrix.totalRevenueLiftPercentage}% Revenue Lift`
                        : EMPTY_FIELD}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {displayField(baseline?.growthImpactMatrix?.statusIndicator)}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                    Individual Revenue Lift Potential
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                      {
                        label: "PDP Alignment",
                        value: baseline?.growthImpactMatrix?.levers?.pdpAlignmentLift,
                        note: "(Low conversion fix)",
                        color: "var(--color-primary)",
                      },
                      {
                        label: "Instagram Perf.",
                        value: baseline?.growthImpactMatrix?.levers?.igPerformanceLift,
                        note: "(Hook rate optimization)",
                        color: "#F59E0B",
                      },
                      {
                        label: "Meta Ad Boost",
                        value: baseline?.growthImpactMatrix?.levers?.metaAdBoostLift,
                        note: "(Paid amplification)",
                        color: "var(--color-primary)",
                      },
                    ].map((lever) => (
                      <div
                        key={lever.label}
                        style={{ display: "flex", flexDirection: "column", gap: "4px" }}
                      >
                        <div
                          style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: lever.color,
                              }}
                            />
                            {lever.label}
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            {lever.value != null ? `+${lever.value}%` : EMPTY_FIELD} {lever.note}
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            background: "var(--surface-container-highest)",
                            height: "8px",
                            borderRadius: "4px",
                          }}
                        >
                          <div
                            style={{
                              background: lever.color,
                              width: lever.value != null ? `${Math.min(100, lever.value * 2)}%` : "0%",
                              height: "100%",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Ecosystem Health */}
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px 0" }}>
                  Baseline, Influencer Health & Brand Integrity
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                  A deep-dive comparison tracking core metrics against contracted creators.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Brand Base Metrics</p>
                  <MetricRow label="Reach" value={baseline?.baselineHealth?.reach?.value} growth={baseline?.baselineHealth?.reach?.growth} />
                  <MetricRow label="Engagement" value={baseline?.baselineHealth?.engagement?.value} subValue={`Benchmark: ${displayField(baseline?.baselineHealth?.engagement?.benchmark)}`} />
                  <MetricRow label="Follower Growth" value={baseline?.baselineHealth?.followerGrowth?.value} />
                  <MetricRow label="Creator Volume" value={baseline?.baselineHealth?.creatorVolume?.value} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Influencer Cohort Health</p>
                  <MetricRow label="Audience Overlap" value={baseline?.baselineHealth?.audienceOverlap?.value} subValue={`Target: ${displayField(baseline?.baselineHealth?.audienceOverlap?.target)}`} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Archetype Match</p>
                    <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                      {displayField(baseline?.baselineHealth?.archetypeMatch?.primary)} | {displayField(baseline?.baselineHealth?.archetypeMatch?.secondary)} | {displayField(baseline?.baselineHealth?.archetypeMatch?.tertiary)}
                    </p>
                  </div>
                  <MetricRow label="Content Alignment" value={baseline?.baselineHealth?.alignmentIndex?.value} subValue={displayField(baseline?.baselineHealth?.alignmentIndex?.context)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Quality & Risk</p>
                  <MetricRow label="Quality Score" value={baseline?.baselineHealth?.qualityRating?.score} subValue={`Hook rate: ${displayField(baseline?.baselineHealth?.qualityRating?.hookRate)}`} />
                  <MetricRow label="Brand Safety" value={baseline?.baselineHealth?.brandSafety?.percentage} subValue={`Flags: ${displayField(baseline?.baselineHealth?.brandSafety?.flags)}`} color="var(--color-primary)" />
                </div>
              </div>
            </div>

            {/* Section 3: Competitive Intelligence */}
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px 0" }}>
                  Competitive Intelligence & Landscape Matrix
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                  How our brand voice slices through the market.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "16px" }}>Share of Voice (SOV)</p>
                  <ShareOfVoiceDonut shareOfVoice={baseline?.shareOfVoice} />
                </div>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "16px" }}>Archetype Matrix</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ background: "var(--surface-container-low)", padding: "12px", borderRadius: "8px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 4px 0" }}>OUR BRAND</p>
                      <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{displayField(baseline?.archetypeMatrix?.ourBrand?.primary)} | {displayField(baseline?.archetypeMatrix?.ourBrand?.secondary)}</p>
                    </div>
                    <div style={{ background: "var(--surface-container-low)", padding: "12px", borderRadius: "8px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 4px 0" }}>COMPETITORS</p>
                      <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{displayField(baseline?.archetypeMatrix?.competitors?.primary)} | {displayField(baseline?.archetypeMatrix?.competitors?.secondary)}</p>
                    </div>
                    <div style={{ background: "rgba(52, 211, 153, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)", margin: 0, lineHeight: 1.4 }}>
                        {displayField(baseline?.archetypeMatrix?.takeaway)}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "16px" }}>Comp. Content Pillars</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(baseline?.competitivePillars ?? []).map((pillar, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{i + 1}. {displayField(pillar.theme)}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{displayField(pillar.context)}</p>
                      </div>
                    ))}
                    <div style={{ background: "rgba(52, 211, 153, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(52, 211, 153, 0.2)", marginTop: "8px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)", margin: 0, lineHeight: 1.4 }}>
                        {displayField(baseline?.competitiveTakeaway)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        className={`aurora-card ${
          activeZone === "zone2" ? "accordion-active" : ""
        }`}
        style={{
          padding: 0,
          overflow: "hidden",
          boxShadow:
            activeZone === "zone2" ? "0 0 15px rgba(52, 211, 153, 0.4)" : "none",
          borderColor:
            activeZone === "zone2"
              ? "var(--primary-container)"
              : "var(--border-default)",
        }}
      >
        <header
          onClick={() => toggleAccordion("zone2")}
          style={{
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            background: "var(--surface-card)",
            borderBottom:
              activeZone === "zone2" ? "1px solid var(--border-default)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: "var(--primary-container)",
                display: "flex",
                alignItems: "center",
                justifyItems: "center",
              }}
            >
              <Brain
                size={24}
                style={{ margin: "auto", color: "var(--on-primary-container)" }}
              />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              AI-Driven Actionable Insights
            </h2>
          </div>
          <ChevronDown
            style={{
              transform:
                activeZone === "zone2" ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.3s",
            }}
          />
        </header>

        {activeZone === "zone2" && (
          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  margin: "0 0 4px 0",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Actionable Opportunities
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                Prioritized, data-backed interventions designed to correct funnel leaks.
              </p>
            </div>

            {activeLeaks.length === 0 ? (
              <p className="brand-centre-page__placeholder">
                {isIntelligenceRefreshRunning
                  ? "Generating insight cards — see banner above."
                  : movedToPlannerCount > 0
                    ? "All active insights were moved to Tab 3 or archived."
                    : EMPTY_FIELD}
              </p>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {activeLeaks.map((leak) => (
                <div
                  key={leak.id}
                  className="opportunity-card"
                  style={{
                    background: "var(--surface-container-lowest)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "12px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px" }}>
                      <LightbulbIcon style={{ color: "#34D399" }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                          {displayField(leak.insightTitle)}
                        </h4>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {displayField(leak.shortDescription)}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        background: "var(--status-warning-bg)",
                        color: "var(--status-error)",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "10px",
                        fontWeight: 700,
                        border: "1px solid rgba(202, 15, 28, 0.2)",
                      }}
                    >
                      {displayField(leak.priorityRank)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: "var(--surface-container)",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {displayField(leak.leakBucket)}
                    </span>
                    <span
                      style={{
                        background: "#F0FDF4",
                        color: "#34D399",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "10px",
                        fontWeight: 700,
                        border: "1px solid rgba(52, 211, 153, 0.3)",
                      }}
                    >
                      Est. Lift: {displayPercentLift(leak.projectedLiftPercentage)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => void openDrawer(leak)}
                      style={{
                        background: "var(--surface-page)",
                        border: "1px solid var(--border-default)",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleMoveToPlanner(leak.id)}
                      disabled={movingLeakId !== null}
                      style={{
                        background: "var(--color-primary)",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: movingLeakId !== null ? "wait" : "pointer",
                        opacity: movingLeakId === leak.id ? 0.7 : 1,
                      }}
                    >
                      {movingLeakId === leak.id
                        ? "Moving…"
                        : "Approve & Move to Planner"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--color-primary)",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              <FolderIcon size={16} />
              <span>
                Moved to planner: {movedToPlannerCount} · Archive: {EMPTY_FIELD}
              </span>
            </div>
          </div>
        )}
      </section>

      {isDrawerOpen && (
        <>
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 300,
            }}
          />
          <div
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              height: "100%",
              width: "min(40%, 600px)",
              background: "var(--surface-card)",
              zIndex: 400,
              boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    margin: 0,
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  Opportunity Deep-Dive
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  {displayField(selectedLeak?.insightTitle ?? drawerLeak?.insightTitle)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setSelectedLeakId(null);
                  setDrawerLeak(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {drawerLoading ? (
                <p className="brand-centre-page__loading">Loading deep-dive…</p>
              ) : null}
              <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {displayField(drawerLeak?.shortDescription ?? selectedLeak?.shortDescription)}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                Bucket: {displayField(drawerLeak?.leakBucket ?? selectedLeak?.leakBucket)}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                Performance:{" "}
                {displayField(drawerLeak?.performanceStatus ?? selectedLeak?.performanceStatus)}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                Lift:{" "}
                {displayPercentLift(
                  drawerLeak?.projectedLiftPercentage ??
                    selectedLeak?.projectedLiftPercentage,
                )}
              </p>
              {drawerLeak?.drawerDeepDive ? (
                <>
                  <p style={{ margin: "16px 0 0", fontSize: "13px", fontWeight: 700 }}>
                    Underlying data logic
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                    {displayField(drawerLeak.drawerDeepDive.underlyingDataLogic)}
                  </p>
                  <p style={{ margin: "12px 0 0", fontSize: "13px", fontWeight: 700 }}>
                    Competitive discrepancy
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                    {displayField(drawerLeak.drawerDeepDive.competitiveDiscrepancy)}
                  </p>
                  {drawerChecklistSteps(drawerLeak.drawerDeepDive).length > 0 ? (
                    <>
                      <p style={{ margin: "12px 0 0", fontSize: "13px", fontWeight: 700 }}>
                        Step-by-step directives
                      </p>
                      <ul style={{ margin: "8px 0 0", paddingLeft: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
                        {drawerChecklistSteps(drawerLeak.drawerDeepDive).map((step) => (
                          <li key={step.id}>{displayField(step.label)}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function drawerChecklistSteps(
  drawerDeepDive: BrandCentreLeakDetailResponse["drawerDeepDive"],
): Array<{ id: string; label: string }> {
  if (!drawerDeepDive || typeof drawerDeepDive !== "object") {
    return [];
  }
  const raw = drawerDeepDive as Record<string, unknown>;
  const steps = raw.actionableStepsChecklist ?? raw.actionableChecklist;
  if (!Array.isArray(steps)) {
    return [];
  }
  return steps
    .filter((step): step is Record<string, unknown> => typeof step === "object" && step !== null)
    .map((step, index) => ({
      id: typeof step.stepId === "string" ? step.stepId : `step-${index}`,
      label: typeof step.stepLabel === "string" ? step.stepLabel : "-",
    }));
}

function MetricRow({ label, value, growth, subValue, color }: { label: string; value?: string; growth?: string; subValue?: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: color }}>{displayField(value)}</p>
        {growth ? <span style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 700 }}>📈 {displayField(growth)}</span> : null}
      </div>
      {subValue ? <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{subValue}</p> : null}
    </div>
  );
}
