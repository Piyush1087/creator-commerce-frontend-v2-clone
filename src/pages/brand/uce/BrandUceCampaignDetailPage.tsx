import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Alert, Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import {
  fetchCampaignBriefDetails,
  fetchCampaignPageView,
  fetchCampaignProductDetails,
} from "../../../features/uce/api/brand-uce-client";
import { CanonicalCampaignPage } from "../../../features/uce/campaign-page/CanonicalCampaignPage";
import { BriefSnapshotDrawer } from "../../../features/uce/components/BriefSnapshotDrawer";
import { CampaignShareRouterModal } from "../../../features/uce/components/CampaignShareRouterModal";
import { ProductDetailDrawer } from "../../../features/uce/components/ProductDetailDrawer";
import { useUceApiJson } from "../../../features/uce/hooks/use-uce-api-json";
import type {
  RepositoryBrief,
  RepositoryProduct,
} from "../../../features/uce/types/repository";
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
    () => fetchCampaignPageView(campaignId),
    [campaignId],
  );

  const { state, reload } = useUceApiJson(Boolean(campaignId), pageFetcher);

  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isBriefSnapshotOpen, setIsBriefSnapshotOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<RepositoryProduct | null>(
    null,
  );
  const [viewBrief, setViewBrief] = useState<RepositoryBrief | null>(null);
  const [isShareRouterOpen, setIsShareRouterOpen] = useState(false);

  const reloadAll = useCallback(async () => {
    await reload();
  }, [reload]);

  if (!campaignId) {
    return (
      <div className="campaign-workspace-canvas campaign-workspace-canvas--missing">
        <h1>Campaign not found</h1>
        <p>Missing campaign id in URL.</p>
        <Link
          to={AUTH_ROUTES.brandUceCampaigns}
          className="uce-back-to-list-link"
        >
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
        <h1>Campaign unavailable</h1>
        <Alert tone="error" title="Could not load campaign">
          {state.message}
        </Alert>
        <Button onClick={() => void reload()} variant="outline">
          Retry campaign
        </Button>
        <Link
          to={AUTH_ROUTES.brandUceCampaigns}
          className="uce-back-to-list-link"
        >
          Back to campaigns
        </Link>
      </div>
    );
  }

  if (state.status !== "ready") {
    return null;
  }

  const pageView = state.data;

  return (
    <div className="campaign-workspace-canvas">
      <CanonicalCampaignPage
        onOpenLegacyBrief={async (briefId) => {
          const dto = (await fetchCampaignBriefDetails(
            campaignId,
            briefId,
          )) as BriefDetailsDto;
          setViewBrief(toRepositoryBrief(dto));
          setIsBriefSnapshotOpen(true);
        }}
        onOpenLegacyProduct={async (campaignAssetId) => {
          const dto = (await fetchCampaignProductDetails(
            campaignId,
            campaignAssetId,
          )) as ProductDetailsDto;
          setViewProduct(toRepositoryProduct(dto));
          setIsProductDetailOpen(true);
        }}
        onOpenShareFallback={() => setIsShareRouterOpen(true)}
        onReload={reloadAll}
        view={pageView}
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
        products={pageView.assetsBriefsSummary.assets.map((asset) => ({
          id: asset.campaignAssetId,
          name: asset.name,
        }))}
        supportedChannels={pageView.share.supportedChannels}
      />
    </div>
  );
}
