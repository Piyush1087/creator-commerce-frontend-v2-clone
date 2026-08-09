export type DesignTheme =
  | "MINIMAL_STARK"
  | "EDITORIAL_LUXE"
  | "CYBER_TECH"
  | "VIBRANT_KINETIC"
  | "PASTEL_MINIMAL";

export type MediaKitVisibility = {
  showTotalReach: boolean;
  showEngagementRate: boolean;
  showViewsMetric: boolean;
  showRatesColumn: boolean;
};

export type MediaKitRates = {
  shortFormVideoRate: number;
  storyBundleRate: number;
} | null;

export type MediaKitCachedMetrics = {
  totalReach: number | null;
  engagementRate: number | null;
  topLocation: string | null;
};

export type MediaKitResponse = {
  displayName: string | null;
  instagramHandle: string | null;
  avatarUrl: string | null;
  customBioOverride: string | null;
  aiGeneratedTagline: string | null;
  activeTheme: DesignTheme;
  visibility: MediaKitVisibility;
  rates: MediaKitRates;
  pastBrandLogos: string[];
  cachedMetrics: MediaKitCachedMetrics;
  publicLink: string | null;
};

export type MediaKitSavePayload = {
  customBioOverride?: string | null;
  activeTheme: DesignTheme;
  showTotalReach?: boolean;
  showEngagementRate?: boolean;
  showViewsMetric?: boolean;
  showRatesColumn?: boolean;
  shortFormVideoRate: number;
  storyBundleRate: number;
  pastBrandLogos: string[];
  isMediaKitPublic?: boolean;
};

export type AnalyticsPulseRow = {
  id: string;
  metaPostId: string;
  postType: string;
  mediaThumbnailUrl: string;
  captionContent: string | null;
  publishedAt: string;
  viewsCount: number | null;
  impressionsCount: number;
  savesCount: number;
  sharesCount: number;
  engagementDelta: number;
  velocityLabel: string;
  aiPerformanceNote: string | null;
};

export type AnalyticsPulseResponse = {
  summary: {
    totalReach: number | null;
    engagementRate: number | null;
    topLocation: string | null;
  };
  pulses: AnalyticsPulseRow[];
};
