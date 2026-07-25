import type { ReactNode } from "react";

import { CreatorAssistantMobile } from "./creator-assistant/creator-assistant-mobile";
import { CreatorAssistantProvider } from "./creator-assistant/creator-assistant-context";

type CreatorCentreShellProps = {
  children: ReactNode;
};

/** Shared shell for Home / Insights / Profile — canvas + mobile assistant FAB/sheet. */
export function CreatorCentreShell({ children }: CreatorCentreShellProps) {
  return (
    <CreatorAssistantProvider>
      <div className="cctr-centre-page">
        {children}
        <CreatorAssistantMobile />
      </div>
    </CreatorAssistantProvider>
  );
}
