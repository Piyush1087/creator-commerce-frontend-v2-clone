export type BrandCentreScanStatus =
  | "PENDING"
  | "SURFACE_COMPLETE"
  | "VERIFIED"
  | "DEEP_SCAN_IN_PROGRESS"
  | "READY";

export type BrandCentreJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type BrandCentreOfferingRow = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  url: string;
  sellingPoints: string[];
  doNotSay: string[];
  isDeepScanned?: boolean;
};

export type BrandCentreOfferRow = {
  id: string;
  offerName: string;
  promoCode: string;
  applicabilityScope: string;
  validityStart: string;
  validityEnd: string;
  description: string | null;
};

export type BrandCentreCompetitorRow = {
  id: string;
  name: string;
  websiteUrl: string;
  logoUrl: string | null;
  whyCompetitor: string | null;
};

export type BrandCentreRoutingTemplate = {
  section4: { header: string; maxCount: number };
  section5: { header: string; maxCount: number };
};

export type BrandCentreDnaResponse = {
  profile: {
    id: string;
    logoUrl: string | null;
    brandName: string;
    websiteUrl: string;
    igHandle: string | null;
    ytHandle: string | null;
    tiktokHandle: string | null;
    countryCode: string | null;
    currencyCode: string;
    industry: string | null;
    subIndustry: string | null;
    industryNiche: string | null;
    lifecycleStage: string;
    brandRoutingType: string;
    scanStatus: BrandCentreScanStatus;
    isVerified: boolean;
  };
  narrative: {
    tagline: string | null;
    briefDescription: string | null;
    brandUsps: string[];
    toneOfVoice: string[];
    doNotSayList: string[];
  };
  identity: {
    palette: string[];
    fonts: string[];
    aesthetics: string[];
  };
  personas: Array<{
    id: string;
    personaName: string;
    psychographicsText: string | null;
  }>;
  offeringsPrimary: BrandCentreOfferingRow[];
  offeringsCollections: BrandCentreOfferingRow[];
  offers: BrandCentreOfferRow[];
  competitors: BrandCentreCompetitorRow[];
  routingTemplate: BrandCentreRoutingTemplate;
  completeness: {
    hasNarrative: boolean;
    hasPersonas: boolean;
    hasPrimaryOfferings: boolean;
    hasBudget: boolean;
  };
};

export type BrandCentreBudgetResponse = {
  masterMonthlyBudget: number;
  allocationPhase: string;
  assetMix: { product: number; collection: number; sale: number };
  tierMix: {
    nano: number;
    micro: number;
    midTier: number;
    mega: number;
    celebrity: number;
  };
  objectiveMix: {
    pulse: number;
    proof: number;
    push: number;
    production: number;
  };
  utilizedBooked: number;
  utilizedSpent: number;
  utilizationPercentage: number;
};

export type BrandCentreAccountResponse = {
  escrowStatus: string;
  metaConnectionStatus: string;
  subscriptionTier: string;
  outreachQuota: { used: number; total: number };
};

export type BrandCentreScanStatusResponse = {
  scanStatus: BrandCentreScanStatus;
  deepIntelStatus: string;
  deepScanCompletedAt: string | null;
  job: {
    id: string;
    type: string;
    status: BrandCentreJobStatus;
    attempt: number;
    errorMessage: string | null;
    queuedAt: string;
    startedAt: string | null;
    finishedAt: string | null;
  } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isBrandCentreDnaResponse(
  value: unknown,
): value is BrandCentreDnaResponse {
  return (
    isRecord(value) &&
    isRecord(value.profile) &&
    isRecord(value.narrative) &&
    Array.isArray(value.offeringsPrimary) &&
    Array.isArray(value.competitors)
  );
}

export function isBrandCentreBudgetResponse(
  value: unknown,
): value is BrandCentreBudgetResponse {
  return (
    isRecord(value) &&
    typeof value.masterMonthlyBudget === "number" &&
    isRecord(value.assetMix)
  );
}

export function isBrandCentreAccountResponse(
  value: unknown,
): value is BrandCentreAccountResponse {
  return (
    isRecord(value) &&
    typeof value.escrowStatus === "string" &&
    isRecord(value.outreachQuota)
  );
}

export function isBrandCentreScanStatusResponse(
  value: unknown,
): value is BrandCentreScanStatusResponse {
  return isRecord(value) && typeof value.scanStatus === "string";
}

export type BrandCentreIntelligenceLeakSummary = {
  id: string;
  insightTitle: string;
  shortDescription: string;
  priorityRank: string;
  leakBucket: string;
  performanceStatus: string;
  projectedLiftPercentage: number;
  plannerStatus: string;
  plannerCardId: string | null;
  isArchived: boolean;
};

export type BrandCentreIntelligenceResponse = {
  systemStatus: string;
  dateRangeLabel: string;
  dataRefreshedAt: string | null;
  deepIntelStatus: string;
  refreshJob: { id: string; status: string; queuedAt: string } | null;
  baseline: {
    growthImpactMatrix: {
      totalRevenueLiftPercentage: number | null;
      statusIndicator: string | null;
      levers: {
        pdpAlignmentLift: number | null;
        igPerformanceLift: number | null;
        metaAdBoostLift: number | null;
        creatorRosterLift: number | null;
      };
    };
    baselineHealth: {
      reach: { value: string; growth: string };
      engagement: { value: string; benchmark: string };
      followerGrowth: { value: string };
      creatorVolume: { value: string };
      audienceOverlap: { value: string; target: string };
      archetypeMatch: {
        primary: string;
        secondary: string;
        tertiary: string;
      };
      alignmentIndex: { value: string; context: string };
      qualityRating: {
        score: string;
        visuals: string;
        messaging: string;
        hookRate: string;
      };
      brandSafety: { percentage: string; flags: string };
    };
    shareOfVoice: {
      brand: number | null;
      competitorA: number | null;
      competitorB: number | null;
      others: number | null;
    };
    archetypeMatrix: {
      ourBrand: { primary: string; secondary: string };
      competitors: { primary: string; secondary: string };
      takeaway: string;
    };
    competitivePillars: Array<{
      theme: string;
      context: string;
    }>;
    competitiveTakeaway: string;
    source: string;
  } | null;
  leaks: BrandCentreIntelligenceLeakSummary[];
};

export type BrandCentrePlannerCardSummary = {
  id: string;
  cardType: string;
  workflowStatus: string;
  objective: string | null;
  targetCreatorTier: string | null;
  aiContextHook: string | null;
  existingTargetCampaignId: string | null;
  createdAt: string;
  strategy?: {
    objective: string;
    personaTargeting: string[];
    budget: string;
    deadline: string;
    assets: Array<{
      productName: string;
      briefName: string;
      pillars: string[];
      deliverables: string[];
    }>;
  };
};

export type BrandCentrePlannerAggregateJob = {
  id: string;
  status: string;
  errorMessage: string | null;
  queuedAt: string;
};

export type BrandCentrePlannerDashboardResponse = {
  totalCards: number;
  grouped: {
    newCampaign: unknown[];
    suggestedUpdate: unknown[];
    autoPauseLog: unknown[];
  };
  cards: BrandCentrePlannerCardSummary[];
  plannerAggregateJob: BrandCentrePlannerAggregateJob | null;
};

export function isBrandCentreIntelligenceResponse(
  value: unknown,
): value is BrandCentreIntelligenceResponse {
  return (
    isRecord(value) &&
    typeof value.systemStatus === "string" &&
    typeof value.dateRangeLabel === "string" &&
    Array.isArray(value.leaks)
  );
}

export function isBrandCentrePlannerDashboardResponse(
  value: unknown,
): value is BrandCentrePlannerDashboardResponse {
  const job = isRecord(value) ? value.plannerAggregateJob : null;
  const jobOk =
    job === null ||
    job === undefined ||
    (isRecord(job) &&
      typeof job.id === "string" &&
      typeof job.status === "string");
  return (
    isRecord(value) &&
    typeof value.totalCards === "number" &&
    isRecord(value.grouped) &&
    Array.isArray(value.cards) &&
    jobOk
  );
}
