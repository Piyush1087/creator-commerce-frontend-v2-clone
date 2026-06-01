import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BriefingWizardDrawer } from "../../../features/uce/components/BriefingWizardDrawer";
import { BriefSnapshotDrawer } from "../../../features/uce/components/BriefSnapshotDrawer";
import {
  CampaignPipelineWorkspace,
  type PipelineTab,
} from "../../../features/uce/components/CampaignPipelineWorkspace";
import { CampaignProductsBriefsRepository } from "../../../features/uce/components/CampaignProductsBriefsRepository";
import { CampaignShareRouterModal } from "../../../features/uce/components/CampaignShareRouterModal";
import { CampaignWorkspaceZone1 } from "../../../features/uce/components/CampaignWorkspaceZone1";
import { LinkAssetDrawer } from "../../../features/uce/components/LinkAssetDrawer";
import { ProductDetailDrawer } from "../../../features/uce/components/ProductDetailDrawer";
import { getCampaignById } from "../../../features/uce/mock-data/campaigns";
import {
  addBriefToProduct,
  enrichWorkspaceProducts,
  getCatalogProductsNotInCampaign,
  getInitialCampaignWorkspace,
  linkProductToCampaign,
  setProductActive,
  type CampaignBrief,
  type CampaignWorkspace,
} from "../../../features/uce/mock-data/campaign-workspace";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import "../../../features/uce/components/CampaignProductsBriefsRepository.css";
import "../../../features/uce/components/CampaignShareRouterModal.css";
import "../../../features/uce/components/CampaignWorkspaceZone1.css";
import "./BrandUceCampaignDetailPage.css";
import "../../../features/uce/uce-responsive.css";

export function BrandUceCampaignDetailPage() {
  const { id: rawId } = useParams();
  const campaign = getCampaignById(rawId);
  const campaignId = campaign?.id ?? rawId ?? "";

  const [workspace, setWorkspace] = useState<CampaignWorkspace>(() =>
    getInitialCampaignWorkspace(campaignId),
  );

  useEffect(() => {
    if (campaignId) {
      setWorkspace(getInitialCampaignWorkspace(campaignId));
    }
  }, [campaignId]);

  const enrichedProducts = useMemo(
    () => enrichWorkspaceProducts(workspace),
    [workspace],
  );

  const availableCatalogProducts = useMemo(
    () => getCatalogProductsNotInCampaign(workspace),
    [workspace],
  );

  const linkedProductIds = useMemo(
    () => workspace.products.map((p) => p.catalogProductId),
    [workspace],
  );

  const [activeWorkspaceTab, setWorkspaceTab] = useState<PipelineTab>("prospects");
  const [isLinkAssetOpen, setIsLinkAssetOpen] = useState(false);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isBriefSnapshotOpen, setIsBriefSnapshotOpen] = useState(false);
  const [isBriefWizardOpen, setIsBriefWizardOpen] = useState(false);
  const [briefWizardProductId, setBriefWizardProductId] = useState<string | null>(null);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [viewBrief, setViewBrief] = useState<CampaignBrief | null>(null);
  const [isShareRouterOpen, setIsShareRouterOpen] = useState(false);

  if (!campaign) {
    return (
      <div className="campaign-workspace-canvas campaign-workspace-canvas--missing">
        <h1>Campaign not found</h1>
        <p>We couldn&apos;t find a campaign with id &quot;{rawId}&quot;.</p>
        <Link to={AUTH_ROUTES.brandUceCampaigns} className="uce-back-to-list-link">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const campaignSlug = campaign.id.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  return (
    <div className="campaign-workspace-canvas">
      <CampaignWorkspaceZone1
        campaignName={campaign.name}
        onOpenShareRouter={() => setIsShareRouterOpen(true)}
      />

      <CampaignProductsBriefsRepository
        products={enrichedProducts}
        onAddProduct={() => setIsLinkAssetOpen(true)}
        onViewProduct={(productId) => {
          setViewProductId(productId);
          setIsProductDetailOpen(true);
        }}
        onViewBrief={(brief) => {
          setViewBrief(brief);
          setIsBriefSnapshotOpen(true);
        }}
        onCreateBrief={(productId) => {
          setBriefWizardProductId(productId);
          setIsBriefWizardOpen(true);
        }}
        onToggleProductActive={(productId, isActive) => {
          setWorkspace((prev) => setProductActive(prev, productId, isActive));
        }}
      />

      <CampaignPipelineWorkspace
        activeTab={activeWorkspaceTab}
        onTabChange={setWorkspaceTab}
      />

      <LinkAssetDrawer
        isOpen={isLinkAssetOpen}
        onClose={() => setIsLinkAssetOpen(false)}
        campaignName={campaign.name}
        campaignSlug={campaignSlug}
        availableProducts={availableCatalogProducts}
        onLinkProduct={(catalogProductId) => {
          setWorkspace((prev) => linkProductToCampaign(prev, catalogProductId));
        }}
      />

      <ProductDetailDrawer
        isOpen={isProductDetailOpen}
        onClose={() => setIsProductDetailOpen(false)}
        productId={viewProductId}
      />

      <BriefSnapshotDrawer
        isOpen={isBriefSnapshotOpen}
        onClose={() => {
          setIsBriefSnapshotOpen(false);
          setViewBrief(null);
        }}
        briefTitle={viewBrief?.name}
        formatType={viewBrief?.formatType}
      />

      <BriefingWizardDrawer
        isOpen={isBriefWizardOpen}
        onClose={() => {
          setIsBriefWizardOpen(false);
          setBriefWizardProductId(null);
        }}
        campaignName={campaign.name}
        initialProductId={briefWizardProductId}
        linkedProductIds={linkedProductIds}
        onBriefCreated={(catalogProductId, briefName) => {
          setWorkspace((prev) =>
            addBriefToProduct(prev, catalogProductId, {
              name: briefName,
              formatType: "Video Reel",
            }),
          );
        }}
      />

      <CampaignShareRouterModal
        isOpen={isShareRouterOpen}
        onClose={() => setIsShareRouterOpen(false)}
        campaignSlug={campaignSlug}
      />
    </div>
  );
}
