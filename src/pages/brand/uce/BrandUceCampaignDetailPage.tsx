import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Alert } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import {
  createCampaignBrief,
  createCampaignProduct,
  fetchCampaignBriefDetails,
  fetchCampaignPageView,
  fetchCampaignProductDetails,
  fetchCampaignShell,
} from "../../../features/uce/api/brand-uce-client";
import { CanonicalCampaignPage } from "../../../features/uce/campaign-page/CanonicalCampaignPage";
import type { CampaignPageView } from "../../../features/uce/campaign-page/types";
import { BriefingWizardDrawer } from "../../../features/uce/components/BriefingWizardDrawer";
import { BriefSnapshotDrawer } from "../../../features/uce/components/BriefSnapshotDrawer";
import { CampaignShareRouterModal } from "../../../features/uce/components/CampaignShareRouterModal";
import { LinkAssetDrawer } from "../../../features/uce/components/LinkAssetDrawer";
import { ProductDetailDrawer } from "../../../features/uce/components/ProductDetailDrawer";
import { useUceApiJson } from "../../../features/uce/hooks/use-uce-api-json";
import type { RepositoryBrief, RepositoryProduct } from "../../../features/uce/types/repository";
import "../../../features/uce/uce-responsive.css";
import "./BrandUceCampaignDetailPage.css";

type ProductDetailsDto = {
  campaignAssetId: string;
  name: string;
  skuCode?: string | null;
  inventoryCount: number;
  imageUrl?: string | null;
};

type BriefDetailsDto = {
  briefId: string;
  name: string;
  campaignAssetId?: string | null;
  creativeGuidelines: string;
  deliverableFormatTags: string[];
  requiredPlatforms: string[];
  briefType?: string | null;
};

function toRepositoryProduct(dto: ProductDetailsDto): RepositoryProduct {
  return {
    id: dto.campaignAssetId,
    name: dto.name,
    skuCode: dto.skuCode ?? null,
    basePrice: "—",
    inventoryCount: dto.inventoryCount,
    outOfStock: dto.inventoryCount <= 0,
  };
}

function toRepositoryBrief(dto: BriefDetailsDto): RepositoryBrief {
  return {
    id: dto.briefId,
    productId: dto.campaignAssetId,
    name: dto.name,
    formatType: dto.deliverableFormatTags[0] ?? "—",
    formatTags: dto.deliverableFormatTags,
    platforms: dto.requiredPlatforms,
    platformsLabel: dto.requiredPlatforms.join(", "),
    creativeGuidelines: dto.creativeGuidelines,
    briefType: dto.briefType,
    createdAt: null,
  };
}

export function BrandUceCampaignDetailPage() {
  const { id: campaignId = "" } = useParams();

  const pageFetcher = useCallback(
    () => fetchCampaignPageView(campaignId) as Promise<CampaignPageView>,
    [campaignId],
  );
  // Shell retained only for Add Brief logistics defaults (mature ADAPT surface).
  const shellFetcher = useCallback(
    () => fetchCampaignShell(campaignId),
    [campaignId],
  );

  const { state, reload } = useUceApiJson(Boolean(campaignId), pageFetcher);
  const { state: shellState, reload: reloadShell } = useUceApiJson(
    Boolean(campaignId),
    shellFetcher,
  );

  const shell = shellState.status === "ready" ? shellState.data : null;

  const [isLinkAssetOpen, setIsLinkAssetOpen] = useState(false);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isBriefSnapshotOpen, setIsBriefSnapshotOpen] = useState(false);
  const [isBriefWizardOpen, setIsBriefWizardOpen] = useState(false);
  const [briefWizardProductId, setBriefWizardProductId] = useState<string | null>(
    null,
  );
  const [viewProduct, setViewProduct] = useState<RepositoryProduct | null>(null);
  const [viewBrief, setViewBrief] = useState<RepositoryBrief | null>(null);
  const [isShareRouterOpen, setIsShareRouterOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingBrief, setIsSavingBrief] = useState(false);

  const pageProducts = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.data.productsBriefsSummary.products;
  }, [state]);

  const briefWizardProducts = useMemo(
    () =>
      pageProducts.map((p) => ({
        id: p.campaignAssetId,
        name: p.name,
        sku: null as string | null,
      })),
    [pageProducts],
  );

  const reloadAll = useCallback(async () => {
    await Promise.all([reload({ silent: true }), reloadShell({ silent: true })]);
  }, [reload, reloadShell]);

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

  const pageView = state.data;

  const briefWizard = shell ? (
    <BriefingWizardDrawer
      isOpen={isBriefWizardOpen}
      onClose={() => {
        setIsBriefWizardOpen(false);
        setBriefWizardProductId(null);
      }}
      campaignId={shell.campaign_id}
      campaignName={shell.campaign_name}
      initialProductId={briefWizardProductId}
      campaignProducts={briefWizardProducts}
      archetypeOptions={shell.zone_1_targeting?.creator_archetypes ?? []}
      logisticsDefaults={{
        deadlineDescriptor:
          shell.zone_1_master?.timeline_type === "DYNAMIC_ROLLING"
            ? `Dynamic rolling (${shell.zone_1_master.dynamic_days_limit ?? "n/a"} days)`
            : "Fixed campaign end date",
        fixedCalendarTargetDate:
          shell.zone_1_master?.fixed_end_date ??
          new Date(Date.now() + 14 * 86400000).toISOString(),
        baseEscrowPayout:
          shell.zone_1_commercials?.fixed_fee_amount ??
          shell.zone_1_commercials?.negotiable_min_fee ??
          0,
        commissionPercent:
          shell.zone_1_commercials?.advance_payment_percentage ?? 0,
        samplesRequired: true,
      }}
      isSubmitting={isSavingBrief}
      onSubmitBrief={async (body) => {
        setIsSavingBrief(true);
        try {
          await createCampaignBrief(shell.campaign_id, body);
          await reloadAll();
        } finally {
          setIsSavingBrief(false);
        }
      }}
    />
  ) : null;

  if (isBriefWizardOpen && briefWizard) {
    return briefWizard;
  }

  return (
    <div className="campaign-workspace-canvas">
      <CanonicalCampaignPage
        onAddBrief={(campaignAssetId) => {
          setBriefWizardProductId(campaignAssetId);
          setIsBriefWizardOpen(true);
        }}
        onAddProduct={() => setIsLinkAssetOpen(true)}
        onOpenBrief={async (briefId) => {
          const dto = (await fetchCampaignBriefDetails(
            campaignId,
            briefId,
          )) as BriefDetailsDto;
          setViewBrief(toRepositoryBrief(dto));
          setIsBriefSnapshotOpen(true);
        }}
        onOpenProduct={async (campaignAssetId) => {
          const dto = (await fetchCampaignProductDetails(
            campaignId,
            campaignAssetId,
          )) as ProductDetailsDto;
          setViewProduct(toRepositoryProduct(dto));
          setIsProductDetailOpen(true);
        }}
        onOpenShareFallback={() => setIsShareRouterOpen(true)}
        onReload={() => void reloadAll()}
        view={pageView}
      />

      <LinkAssetDrawer
        isOpen={isLinkAssetOpen}
        onClose={() => setIsLinkAssetOpen(false)}
        campaignId={campaignId}
        campaignName={pageView.campaign.name}
        linkedProductNames={pageProducts.map((p) => p.name)}
        isSubmitting={isSavingProduct}
        onCreateProduct={async (body) => {
          setIsSavingProduct(true);
          try {
            await createCampaignProduct(campaignId, body);
            await reloadAll();
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
        campaignId={campaignId}
        campaignName={pageView.campaign.name}
        products={pageProducts.map((p) => ({
          id: p.campaignAssetId,
          name: p.name,
        }))}
        supportedChannels={pageView.share.supportedChannels}
      />
    </div>
  );
}
