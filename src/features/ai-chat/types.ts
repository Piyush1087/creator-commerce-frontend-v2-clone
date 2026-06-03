export type ChatScopeContext = "GLOBAL" | "BRAND_CENTRE" | "ANALYTICS" | "ESCROW";

export type AiChatMessage = {
  id: string;
  sender: "USER" | "SYSTEM";
  text: string;
  isSlotFillingForm?: boolean;
};

export type AiChatThreadStub = {
  id: string;
  title: string;
  timestamp: string;
};

export type SlotStep = "IDLE" | "AWAITING_BUDGET";

export type CampaignSlotData = {
  product: string;
  budget: string;
  objective: string;
};
