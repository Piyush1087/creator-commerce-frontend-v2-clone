export interface AudiencePersona {
  name: string;
  imageUrl: string;
}

export interface BrandCentreData {
  brandName: string;
  website: string;
  marketSetup: string;
  industry: string;
  lifecycleStage: string;
  narrativeTitle: string;
  narrativeDescription: string;
  colors: string[];
  fonts: string[];
  personas: AudiencePersona[];
  monthlyBudget: number;
  utilizedBudget: number;
  assetAllocation: { label: string; value: number; color: string }[];
  influencerTiers: { label: string; value: number; color: string }[];
  campaignObjectives: { label: string; value: number; color: string }[];
  escrowStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  currentPlan: string;
  outreachQuota: { used: number; total: number };
  metaConnectionStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  teamManagement: string;
}
