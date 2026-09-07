import { useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";



import { MarketplaceDiscovery } from "../../../features/creator-campaigns/components/MarketplaceDiscovery";

import {

  EMPTY_MARKETPLACE_FILTERS,

  marketplaceFiltersToQuery,

  type MarketplaceFiltersState,

} from "../../../features/creator-campaigns/utils/marketplace-filters";

import { useCreatorMarketplace } from "../../../features/creator-campaigns/hooks/use-creator-marketplace";

import "../../../features/creator-campaigns/creator-campaigns.css";



export function PublicMarketplacePage() {

  const [searchParams, setSearchParams] = useSearchParams();

  const brandSlug = searchParams.get("brand_slug")?.trim() || undefined;



  const [searchQuery, setSearchQuery] = useState("");

  const [advancedFilters, setAdvancedFilters] =

    useState<MarketplaceFiltersState>(EMPTY_MARKETPLACE_FILTERS);



  const query = useMemo(

    () => ({

      search_query: searchQuery,

      brand_slug: brandSlug,

      ...marketplaceFiltersToQuery(advancedFilters),

    }),

    [searchQuery, brandSlug, advancedFilters],

  );



  const { campaigns, totalCount, loading, error } = useCreatorMarketplace(query, "guest");



  const brandFilterName = useMemo(() => {

    if (!brandSlug) return null;

    const match = campaigns.find((row) => row.brand_slug === brandSlug);

    return match?.brand_name ?? null;

  }, [campaigns, brandSlug]);



  const clearBrandFilter = () => {

    setSearchParams((prev) => {

      const next = new URLSearchParams(prev);

      next.delete("brand_slug");

      return next;

    });

  };



  return (

    <MarketplaceDiscovery

      mode="guest"

      campaigns={campaigns}

      totalCount={totalCount}

      loading={loading}

      error={error}

      matchEligibleOnly={false}

      onMatchEligibleOnlyChange={() => {}}

      searchQuery={searchQuery}

      onSearchQueryChange={setSearchQuery}

      advancedFilters={advancedFilters}

      onAdvancedFiltersChange={setAdvancedFilters}

      brandFilter={

        brandSlug ? { slug: brandSlug, name: brandFilterName } : undefined

      }

      onClearBrandFilter={brandSlug ? clearBrandFilter : undefined}

      onResetFilters={() => {

        setSearchQuery("");

        setAdvancedFilters(EMPTY_MARKETPLACE_FILTERS);

        clearBrandFilter();

      }}

    />

  );

}


