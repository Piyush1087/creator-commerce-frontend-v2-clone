import type { CoPilotChatPayload } from "./schemas/co-pilot-payload.schema";

export type PlatformScopeContext =
  | "GLOBAL"
  | "BRAND_CENTRE"
  | "ANALYTICS"
  | "ESCROW";

export type CoPilotUserMessage = {
  id: string;
  sender: "USER";
  text: string;
  timestamp: string;
};

export type CoPilotAgentMessage = {
  id: string;
  sender: "COPILOT_AGENT";
  payload: CoPilotChatPayload;
};

export type CoPilotFeedMessage = CoPilotUserMessage | CoPilotAgentMessage;

export type CoPilotThreadStub = {
  threadId: string;
  title: string;
  lastActiveLabel: string;
  scopeContext: PlatformScopeContext;
};

export type CoPilotIntentTemplate = {
  id: string;
  label: string;
  templateString: string;
  associatedScope: PlatformScopeContext;
};
