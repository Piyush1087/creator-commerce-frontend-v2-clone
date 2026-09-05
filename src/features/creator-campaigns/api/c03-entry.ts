import { continueApplication } from "./c03-client";
import type { CampaignScope } from "./c03-scope";

/** Loaded with the route module, before React/auth effects can perform external activity. */
export const retiredInvitationEntry =
  typeof window !== "undefined" &&
  /^\/marketplace\/invite\//.test(window.location.pathname);
if (retiredInvitationEntry)
  window.history.replaceState(null, "", "/marketplace");

let credential: string | undefined;
let entryCampaign: string | undefined;
let exchange: Promise<void> | undefined;
if (typeof window !== "undefined") {
  if (
    /^\/(?:creator\/(?:campaigns|marketplace)|marketplace)(?:\/|$)/.test(
      window.location.pathname,
    ) &&
    (window.location.hash || window.location.search)
  ) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  const match = /^\/campaigns\/([0-9a-f-]{36})$/i.exec(
    window.location.pathname,
  );
  if (match) {
    entryCampaign = match[1];
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    credential = fragment.get("invitationCredential") ?? undefined;
    // The only retained value is the ephemeral POST input. Router state and URL are clean.
    if (window.location.hash || window.location.search)
      window.history.replaceState(null, "", `/campaigns/${entryCampaign}`);
  }
}
export function exchangeCampaignEntry(
  scope: CampaignScope,
  campaignId: string,
): Promise<void> {
  if (campaignId !== entryCampaign) return Promise.resolve();
  if (exchange) return exchange;
  if (!credential) return Promise.resolve();
  const input = credential;
  credential = undefined;
  exchange = continueApplication(scope, campaignId, input).then(
    () => undefined,
  );
  return exchange;
}
