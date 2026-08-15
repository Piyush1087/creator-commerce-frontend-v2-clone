import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "../../../design-system/aurora";
import { BriefSnapshotDrawer } from "../../../features/uce/components/BriefSnapshotDrawer";
import { CampaignProductsBriefsRepository } from "../../../features/uce/components/CampaignProductsBriefsRepository";
import { CampaignShareRouterModal } from "../../../features/uce/components/CampaignShareRouterModal";
import { CampaignHeroEditDrawer } from "../../../features/uce/components/CampaignHeroEditDrawer";
import { CampaignWorkspaceZone1 } from "../../../features/uce/components/CampaignWorkspaceZone1";
import { CampaignAssetReconciliationCard } from "../../../features/uce/components/CampaignAssetReconciliationCard";
import { CanonicalCampaignBriefsCard } from "../../../features/uce/components/CanonicalCampaignBriefsCard";
import { CampaignParticipationCard } from "../../../features/uce/components/CampaignParticipationCard";
import { ProductDetailDrawer } from "../../../features/uce/components/ProductDetailDrawer";
import {
  fetchCampaignShell,
  patchCampaignEssentials,
  patchCampaignStatus,
} from "../../../features/uce/api/brand-uce-client";
import type { UceCampaignStatus } from "../../../features/uce/contracts/brand-uce.contracts";
import { useUceApiJson } from "../../../features/uce/hooks/use-uce-api-json";
import {
  mapShellToRepositoryBriefs,
  mapShellToRepositoryProducts,
} from "../../../features/uce/mappers/map-shell-to-repository";
import type { RepositoryBrief } from "../../../features/uce/types/repository";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import "../../../features/uce/components/CampaignProductsBriefsRepository.css";
import "../../../features/uce/components/CampaignShareRouterModal.css";
import "../../../features/uce/components/CampaignWorkspaceZone1.css";
import "./BrandUceCampaignDetailPage.css";
import "../../../features/uce/uce-responsive.css";

export function BrandUceCampaignDetailPage() {
  const { id: campaignId = "" } = useParams();

  const shellFetcher = useCallback(
    () => fetchCampaignShell(campaignId),
    [campaignId],
  );
  const { state, reload } = useUceApiJson(Boolean(campaignId), shellFetcher);

  const shell = state.status === "ready" ? state.data : null;
  const products = useMemo(
    () => (shell ? mapShellToRepositoryProducts(shell) : []),
    [shell],
  );
  const briefs = useMemo(
    () => (shell ? mapShellToRepositoryBriefs(shell) : []),
    [shell],
  );

  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isBriefSnapshotOpen, setIsBriefSnapshotOpen] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [viewBrief, setViewBrief] = useState<RepositoryBrief | null>(null);
  const [isShareRouterOpen, setIsShareRouterOpen] = useState(false);
  const [isHeroEditOpen, setIsHeroEditOpen] = useState(false);
  const [isSavingEssentials, setIsSavingEssentials] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const viewProduct = products.find((p) => p.id === viewProductId) ?? null;

  const handleStatusChange = async (nextActive: boolean) => {
    if (!shell) return;
    setStatusError(null);
    setStatusUpdating(true);
    const next: UceCampaignStatus = nextActive ? "ACTIVE" : "PAUSED";
    try {
      await patchCampaignStatus(shell.campaign_id, next);
      await reload({ silent: true });
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Could not update campaign status.",
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  if (!campaignId) {
    return (
      <div className="campaign-workspace-canvas campaign-workspace-canvas--missing">
        <h1>Campaign not found</h1>
        <p>Missing campaign id in URL.</p>
        <Link to={AUTH_ROUTES.brandUceCampaigns} className="uce-back-to-list-link">
          Back to campaigns
        </Link>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="campaign-workspace-canvas campaign-workspace-canvas--missing">
        <p>Loading campaign workspace…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="campaign-workspace-canvas campaign-workspace-canvas--missing">
        <h1>Campaign not found</h1>
        <Alert tone="error" title="Could not load campaign">
          {state.message}
        </Alert>
        <Link to={AUTH_ROUTES.brandUceCampaigns} className="uce-back-to-list-link">
          Back to campaigns
        </Link>
      </div>
    );
  }

  if (state.status !== "ready") {
    return null;
  }
  const loadedShell = state.data;
  const campaignSlug = loadedShell.campaign_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

  return (
    <div className="campaign-workspace-canvas">
      {statusError ? (
        <Alert tone="error" title="Status update failed">
          {statusError}
        </Alert>
      ) : null}

      <CampaignWorkspaceZone1
        shell={loadedShell}
        onOpenShareRouter={() => setIsShareRouterOpen(true)}
        onOpenEdit={() => setIsHeroEditOpen(true)}
        onStatusChange={(active) => void handleStatusChange(active)}
        statusUpdating={statusUpdating}
      />

      <CampaignHeroEditDrawer
        isOpen={isHeroEditOpen}
        onClose={() => setIsHeroEditOpen(false)}
        shell={loadedShell}
        isSubmitting={isSavingEssentials}
        onSubmit={async (body) => {
          setIsSavingEssentials(true);
          try {
            await patchCampaignEssentials(loadedShell.campaign_id, body);
            await reload({ silent: true });
          } finally {
            setIsSavingEssentials(false);
          }
        }}
      />

      <CampaignProductsBriefsRepository
        products={products}
        briefs={briefs}
        onAddProduct={() => undefined}
        onViewProduct={(productId) => {
          setViewProductId(productId);
          setIsProductDetailOpen(true);
        }}
        onViewBrief={(brief) => {
          setViewBrief(brief);
          setIsBriefSnapshotOpen(true);
        }}
        onCreateBrief={(productId) => {
          void productId;
        }}
        allowLegacyWrites={false}
      />

      <CanonicalCampaignBriefsCard
        campaignId={loadedShell.campaign_id}
        assets={loadedShell.campaign_assets}
        briefs={loadedShell.zone_2_tactics.canonical_briefs}
        canCreate={loadedShell.capabilities.can_create_canonical_brief}
        onCreated={() => reload({ silent: true }).then(() => undefined)}
      />

      <CampaignAssetReconciliationCard
        campaignId={loadedShell.campaign_id}
        assets={loadedShell.campaign_assets}
        reconciliation={loadedShell.reconciliation}
        canSelect={loadedShell.capabilities.can_select_campaign_asset}
        onLinked={() => reload({ silent: true }).then(() => undefined)}
      />

      {loadedShell.capabilities.can_execute_campaign ? (
        <CampaignParticipationCard campaignId={loadedShell.campaign_id} />
      ) : null}

      <ProductDetailDrawer
        isOpen={isProductDetailOpen}
        onClose={() => setIsProductDetailOpen(false)}
        product={viewProduct}
      />

      <BriefSnapshotDrawer
        isOpen={isBriefSnapshotOpen}
        onClose={() => {
          setIsBriefSnapshotOpen(false);
          setViewBrief(null);
        }}
        brief={viewBrief}
      />

      <CampaignShareRouterModal
        isOpen={isShareRouterOpen}
        onClose={() => setIsShareRouterOpen(false)}
        campaignName={loadedShell.campaign_name}
        campaignSlug={campaignSlug}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
