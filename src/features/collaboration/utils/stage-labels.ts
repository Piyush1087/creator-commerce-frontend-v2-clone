import type { CollaborationActor, CollaborationLifecycle, CollaborationStage } from "../contracts/collaboration.contracts";

const STAGE_LABELS: Record<CollaborationStage, string> = {
  NEGOTIATION: "Negotiation",
  SECUREMENT: "Securement",
  FULFILLMENT: "Fulfillment",
  PRODUCTION: "Production",
  PUBLISHING_SETTLEMENT: "Publishing & Settlement",
};
const LIFECYCLE_LABELS: Record<CollaborationLifecycle, string> = {
  ACTIVE: "In progress", PAUSED: "Paused", COMPLETED: "Completed", CANCELLED: "Cancelled", TERMINATED: "Ended",
};
export const collaborationStageLabel = (stage: CollaborationStage): string => STAGE_LABELS[stage];
export const collaborationStageChip = (stage: CollaborationStage): string => STAGE_LABELS[stage];
export const collaborationLifecycleLabel = (lifecycle: CollaborationLifecycle): string => LIFECYCLE_LABELS[lifecycle];
export const actionRequiredLabel = (actor: CollaborationActor): string =>
  actor === "NONE" ? "No action required" : actor === "SYSTEM" ? "Waiting for system" : actor === "ADMIN" ? "Under review" : `Waiting for ${actor === "BRAND" ? "Brand" : "Creator"}`;
