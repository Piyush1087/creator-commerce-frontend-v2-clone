export type CollaborationMobileStep = 1 | 2 | 3;

export function mobileStepForResolvedDeepLink(
  requestedId: string | null,
  selectedId: string | null,
  unavailable: boolean,
): CollaborationMobileStep {
  if (requestedId && selectedId === requestedId && !unavailable) {
    return 2;
  }
  return 1;
}
