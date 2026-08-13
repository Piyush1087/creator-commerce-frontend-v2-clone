import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../../design-system/aurora";
import { BriefingWizardDrawer } from "../../../features/uce/components/BriefingWizardDrawer";
import { BriefSnapshotDrawer } from "../../../features/uce/components/BriefSnapshotDrawer";
import {
  CampaignPipelineWorkspace,
  type PipelineTab,
} from "../../../features/uce/components/CampaignPipelineWorkspace";
import { CampaignProductsBriefsRepository } from "../../../features/uce/components/CampaignProductsBriefsRepository";
import { CampaignShareRouterModal } from "../../../features/uce/components/CampaignShareRouterModal";
import { CampaignHeroEditDrawer } from "../../../features/uce/components/CampaignHeroEditDrawer";
import { CampaignWorkspaceZone1 } from "../../../features/uce/components/CampaignWorkspaceZone1";
import { LinkAssetDrawer } from "../../../features/uce/components/LinkAssetDrawer";
import { ProductDetailDrawer } from "../../../features/uce/components/ProductDetailDrawer";
import {
  createCampaignBrief,
  createCampaignProduct,
  executeCampaignLifecycle,
  fetchCampaignAssetDetails,
  fetchCampaignBriefDetails,
  fetchCampaignPage,
  fetchCampaignShell,
  patchCampaignEssentials,
} from "../../../features/uce/api/brand-uce-client";
import { useUceApiJson } from "../../../features/uce/hooks/use-uce-api-json";
import {
  mapShellToRepositoryBriefs,
  mapShellToRepositoryProducts,
} from "../../../features/uce/mappers/map-shell-to-repository";
import type { RepositoryBrief, RepositoryProduct } from "../../../features/uce/types/repository";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import "../../../features/uce/components/CampaignProductsBriefsRepository.css";
import "../../../features/uce/components/CampaignShareRouterModal.css";
import "../../../features/uce/components/CampaignWorkspaceZone1.css";
import "./BrandUceCampaignDetailPage.css";
import "../../../features/uce/uce-responsive.css";

export function BrandUceCampaignDetailPage() {
  const navigate = useNavigate();
  const { id: campaignId = "" } = useParams();

  const shellFetcher = useCallback(
    async () => {
      const [shell, page] = await Promise.all([
        fetchCampaignShell(campaignId),
        fetchCampaignPage(campaignId),
      ]);
      return { shell, page };
    },
    [campaignId],
  );
  const { state, reload } = useUceApiJson(Boolean(campaignId), shellFetcher);

  const shell = state.status === "ready" ? state.data.shell : null;
  const page = state.status === "ready" ? state.data.page : null;
  const products = useMemo(
    () => (shell ? mapShellToRepositoryProducts(shell, page ?? undefined) : []),
    [page, shell],
  );
  const briefs = useMemo(
    () => (shell ? mapShellToRepositoryBriefs(shell, page ?? undefined) : []),
    [page, shell],
  );

  const [activeWorkspaceTab, setWorkspaceTab] = useState<PipelineTab>("prospects");
  const [isLinkAssetOpen, setIsLinkAssetOpen] = useState(false);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isBriefSnapshotOpen, setIsBriefSnapshotOpen] = useState(false);
  const [isBriefWizardOpen, setIsBriefWizardOpen] = useState(false);
  const [briefWizardProductId, setBriefWizardProductId] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<RepositoryProduct | null>(null);
  const [viewBrief, setViewBrief] = useState<RepositoryBrief | null>(null);
  const [isShareRouterOpen, setIsShareRouterOpen] = useState(false);
  const [isHeroEditOpen, setIsHeroEditOpen] = useState(false);
  const [isSavingEssentials, setIsSavingEssentials] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingBrief, setIsSavingBrief] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const briefWizardProducts = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        canonicalAssetId: p.canonicalAssetId ?? "",
        name: p.name,
        sku: p.skuCode,
      })),
    [products],
  );

  const handleStatusChange = async (nextActive: boolean) => {
    if (!shell) return;
    setStatusError(null);
    setStatusUpdating(true);
    try {
      const capabilities = page?.campaign.capabilities;
      const action = nextActive
        ? capabilities?.resume.available ? "resume" : capabilities?.goLive.available ? "go-live" : capabilities?.publish.available ? "publish" : null
        : capabilities?.pause.available ? "pause" : null;
      if (!action) throw new Error("This lifecycle action is not available for the Campaign.");
      await executeCampaignLifecycle(shell.campaign_id, action);
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
  const loadedShell = state.data.shell;
  const loadedPage = state.data.page;
  const campaignSlug = loadedShell.campaign_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

  const briefWizard = (
    <BriefingWizardDrawer
      isOpen={isBriefWizardOpen}
      onClose={() => {
        setIsBriefWizardOpen(false);
        setBriefWizardProductId(null);
      }}
      campaignId={loadedShell.campaign_id}
      campaignName={loadedShell.campaign_name}
      initialProductId={briefWizardProductId}
      campaignProducts={briefWizardProducts}
      archetypeOptions={
        loadedShell.zone_1_targeting?.creator_archetypes ?? []
      }
      logisticsDefaults={{
        deadlineDescriptor:
          loadedShell.zone_1_master?.timeline_type === "DYNAMIC_ROLLING"
            ? `Dynamic rolling (${loadedShell.zone_1_master.dynamic_days_limit ?? "n/a"} days)`
            : "Fixed campaign end date",
        fixedCalendarTargetDate:
          loadedShell.zone_1_master?.fixed_end_date ??
          new Date(Date.now() + 14 * 86400000).toISOString(),
        baseEscrowPayout:
          loadedShell.zone_1_commercials?.fixed_fee_amount ??
          loadedShell.zone_1_commercials?.negotiable_min_fee ??
          0,
        commissionPercent:
          loadedShell.zone_1_commercials?.advance_payment_percentage ?? 0,
        samplesRequired: true,
      }}
      isSubmitting={isSavingBrief}
      onSubmitBrief={async (body) => {
        setIsSavingBrief(true);
        try {
          await createCampaignBrief(loadedShell.campaign_id, body);
          await reload({ silent: true });
        } finally {
          setIsSavingBrief(false);
        }
      }}
    />
  );

  /* Same pattern as Create Campaign: wizard is page content under real AppShell chrome */
  if (isBriefWizardOpen) {
    return briefWizard;
  }

  return (
    <div className="campaign-workspace-canvas">
      {statusError ? (
        <Alert tone="error" title="Status update failed">
          {statusError}
        </Alert>
      ) : null}

      <CampaignWorkspaceZone1
        shell={loadedShell}
        canShare={loadedPage.campaign.capabilities.share.available}
        canEdit={loadedPage.campaign.capabilities.edit.available}
        onOpenShareRouter={() => setIsShareRouterOpen(true)}
        onOpenEdit={() => loadedPage.campaign.lifecycleStatus === "DRAFT" ? navigate(`${AUTH_ROUTES.brandUceCampaignCreate}?draft=${encodeURIComponent(loadedPage.campaign.id)}`) : setIsHeroEditOpen(true)}
        onStatusChange={loadedPage.campaign.capabilities.pause.available || loadedPage.campaign.capabilities.resume.available || loadedPage.campaign.capabilities.goLive.available || loadedPage.campaign.capabilities.publish.available ? (active) => void handleStatusChange(active) : undefined}
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
        onAddProduct={() => setIsLinkAssetOpen(true)}
        onViewProduct={(productId) => {
          const product = products.find((candidate) => candidate.id === productId);
          if (!product?.canonicalAssetId) {
            setStatusError("Canonical Campaign Asset details are unavailable.");
            return;
          }
          void fetchCampaignAssetDetails(loadedShell.campaign_id, product.canonicalAssetId)
            .then((details) => {
              setViewProduct({ ...product, name: details.name, assetType: details.kind ?? product.assetType });
              setIsProductDetailOpen(true);
            })
            .catch((error: unknown) => setStatusError(error instanceof Error ? error.message : "Could not load Campaign Asset details."));
        }}
        onViewBrief={(brief) => {
          if (!brief.canonicalBriefId) {
            setStatusError("Canonical Brief details are unavailable.");
            return;
          }
          void fetchCampaignBriefDetails(loadedShell.campaign_id, brief.canonicalBriefId)
            .then((details) => {
              setViewBrief({ ...brief, name: details.name, creativeGuidelines: details.creativeGuidelines ?? brief.creativeGuidelines });
              setIsBriefSnapshotOpen(true);
            })
            .catch((error: unknown) => setStatusError(error instanceof Error ? error.message : "Could not load Brief details."));
        }}
        onCreateBrief={(productId) => {
          setBriefWizardProductId(productId);
          setIsBriefWizardOpen(true);
        }}
      />

      <CampaignPipelineWorkspace
        campaignId={loadedShell.campaign_id}
        campaignName={loadedShell.campaign_name}
        activeTab={activeWorkspaceTab}
        onTabChange={setWorkspaceTab}
      />

      <LinkAssetDrawer
        isOpen={isLinkAssetOpen}
        onClose={() => setIsLinkAssetOpen(false)}
        campaignId={loadedShell.campaign_id}
        campaignName={loadedShell.campaign_name}
        linkedProductNames={products.map((p) => p.name)}
        isSubmitting={isSavingProduct}
        onCreateProduct={async (body) => {
          setIsSavingProduct(true);
          try {
            await createCampaignProduct(loadedShell.campaign_id, body);
            await reload({ silent: true });
          } finally {
            setIsSavingProduct(false);
          }
        }}
      />

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
        campaignId={loadedPage.campaign.id}
        shareAvailable={loadedPage.campaign.capabilities.share.available}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
