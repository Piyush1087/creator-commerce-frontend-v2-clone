/** Loaded with the route module, before React/auth effects can perform external activity. */
export const retiredInvitationEntry =
  typeof window !== "undefined" &&
  /^\/marketplace\/invite\//.test(window.location.pathname);
if (retiredInvitationEntry)
  window.history.replaceState(null, "", "/marketplace");
