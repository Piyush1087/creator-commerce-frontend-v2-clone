import { useCallback, useEffect, useState } from "react";

import { Alert } from "../../../design-system/aurora";
import { AccountInfrastructure } from "../../../features/brand-centre/components/AccountInfrastructure";
import { BrandDnaCatalogSections } from "../../../features/brand-centre/components/BrandDnaCatalogSections";
import { BrandDNA } from "../../../features/brand-centre/components/BrandDNA";
import { BudgetManagement } from "../../../features/brand-centre/components/BudgetManagement";
import { BrandCentreTabs } from "../../../features/brand-centre/components/BrandCentreTabs";
import { DeepScanStatusBanner } from "../../../features/brand-centre/components/DeepScanStatusBanner";
import { IntelligenceGaps } from "../../../features/brand-centre/components/IntelligenceGaps";
import { CampaignPlanner } from "../../../features/brand-centre/components/CampaignPlanner";
import {
  fetchBrandCentreIntelligence,
  fetchBrandCentrePlanner,
} from "../../../features/brand-centre/api/brand-centre-client";
import type {
  BrandCentreIntelligenceResponse,
  BrandCentrePlannerDashboardResponse,
} from "../../../features/brand-centre/contracts/brand-centre.contracts";
import { useBrandCentreShell } from "../../../features/brand-centre/context/brand-centre-shell-context";
import { useBrandCentreApiJson } from "../../../features/brand-centre/hooks/use-brand-centre-api-json";
import { useBrandCentreDnaData } from "../../../features/brand-centre/hooks/use-brand-centre-dna-data";
import type { BrandCentreTabId } from "../../../features/brand-centre/constants/brand-centre-tabs";
import "../../../features/brand-centre/brand-centre.css";

export function BrandCentrePage() {
  const shell = useBrandCentreShell();
  const activeTabId = shell?.activeTabId ?? "dna";
  const { loadState, scanStatus, isDeepScanRunning } = useBrandCentreDnaData();
  const [plannerJobPoll, setPlannerJobPoll] = useState(false);

  const intelligence = useBrandCentreApiJson<BrandCentreIntelligenceResponse>(
    activeTabId === "intelligence",
    fetchBrandCentreIntelligence,
  );
  const planner = useBrandCentreApiJson<BrandCentrePlannerDashboardResponse>(
    activeTabId === "planner" || plannerJobPoll,
    fetchBrandCentrePlanner,
  );

  const plannerAggregateActive =
    planner.state.status === "ready" &&
    planner.state.data.plannerAggregateJob != null;

  const handlePlannerJobStarted = useCallback(() => {
    setPlannerJobPoll(true);
    void planner.reload({ silent: planner.state.status === "ready" });
  }, [planner.reload, planner.state.status]);

  useEffect(() => {
    if (!plannerJobPoll && !(activeTabId === "planner" && plannerAggregateActive)) {
      return;
    }
    const intervalId = setInterval(() => {
      void planner.reload({ silent: true });
    }, 2000);
    return () => clearInterval(intervalId);
  }, [activeTabId, plannerJobPoll, plannerAggregateActive, planner.reload]);

  useEffect(() => {
    if (planner.state.status !== "ready") {
      return;
    }
    if (!planner.state.data.plannerAggregateJob) {
      setPlannerJobPoll(false);
    }
  }, [planner.state]);

  const intelligenceRefreshActive =
    intelligence.state.status === "ready" &&
    intelligence.state.data.refreshJob != null;

  useEffect(() => {
    if (activeTabId !== "intelligence" || !intelligenceRefreshActive) {
      return;
    }
    const intervalId = setInterval(() => {
      void intelligence.reload({ silent: true });
    }, 2000);
    return () => clearInterval(intervalId);
  }, [activeTabId, intelligenceRefreshActive, intelligence.reload]);

  return (
    <div className="brand-centre-page">
      <BrandCentreTabs
        activeTabId={activeTabId}
        onTabChange={shell?.setActiveTabId}
      />

      <div className="brand-centre-page__content">
        <BrandCentreTabContent
          activeTabId={activeTabId}
          dnaLoadState={loadState}
          isDeepScanRunning={isDeepScanRunning}
          scanStatus={scanStatus?.scanStatus ?? null}
          scanJobStatus={scanStatus?.job?.status ?? null}
          intelligence={intelligence}
          planner={planner}
          onPlannerJobStarted={handlePlannerJobStarted}
        />
      </div>
    </div>
  );
}

type BrandCentreTabContentProps = {
  activeTabId: BrandCentreTabId;
  dnaLoadState: ReturnType<typeof useBrandCentreDnaData>["loadState"];
  isDeepScanRunning: boolean;
  scanStatus: string | null;
  scanJobStatus: string | null;
  intelligence: {
    state: ReturnType<
      typeof useBrandCentreApiJson<BrandCentreIntelligenceResponse>
    >["state"];
    reload: ReturnType<
      typeof useBrandCentreApiJson<BrandCentreIntelligenceResponse>
    >["reload"];
  };
  planner: {
    state: ReturnType<
      typeof useBrandCentreApiJson<BrandCentrePlannerDashboardResponse>
    >["state"];
    reload: ReturnType<
      typeof useBrandCentreApiJson<BrandCentrePlannerDashboardResponse>
    >["reload"];
  };
  onPlannerJobStarted: () => void;
};

function BrandCentreTabContent({
  activeTabId,
  dnaLoadState,
  isDeepScanRunning,
  scanStatus,
  scanJobStatus,
  intelligence,
  planner,
  onPlannerJobStarted,
}: BrandCentreTabContentProps) {
  if (activeTabId === "dna") {
    return (
      <>
        {isDeepScanRunning ? (
          <DeepScanStatusBanner
            scanStatus={scanStatus}
            jobStatus={scanJobStatus}
          />
        ) : null}

        {dnaLoadState.status === "loading" ? (
          <p className="brand-centre-page__loading">Loading brand data…</p>
        ) : null}

        {dnaLoadState.status === "error" ? (
          <Alert tone="error" title="Could not load Brand Centre">
            {dnaLoadState.message}
          </Alert>
        ) : null}

        {dnaLoadState.status === "ready" ? (
          <>
            <BrandDNA data={dnaLoadState.view} />
            <BrandDnaCatalogSections catalog={dnaLoadState.view.catalog} />
            <BudgetManagement data={dnaLoadState.view} />
            <AccountInfrastructure data={dnaLoadState.view} />
          </>
        ) : null}
      </>
    );
  }

  if (activeTabId === "intelligence") {
    return (
      <IntelligenceGaps
        state={intelligence.state}
        onReloadIntelligence={intelligence.reload}
        onPlannerJobStarted={onPlannerJobStarted}
      />
    );
  }

  return <CampaignPlanner state={planner.state} />;
}
