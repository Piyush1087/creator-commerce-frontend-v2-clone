import type {
  CollaborationLifecycle,
  CollaborationStage,
} from "../contracts/collaboration.contracts";

export const COLLABORATION_STAGES: ReadonlyArray<{
  id: CollaborationStage;
  label: string;
}> = [
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "SECUREMENT", label: "Securement" },
  { id: "FULFILLMENT", label: "Fulfillment" },
  { id: "PRODUCTION", label: "Production" },
  { id: "PUBLISHING_SETTLEMENT", label: "Publishing" },
];

export type CollaborationStagePresentation =
  | "complete"
  | "current"
  | "upcoming";

export function collaborationStagePresentation(
  stage: CollaborationStage,
  activeStage: CollaborationStage,
  lifecycle: CollaborationLifecycle,
): CollaborationStagePresentation {
  if (lifecycle === "COMPLETED") return "complete";

  const stageIndex = COLLABORATION_STAGES.findIndex(
    (item) => item.id === stage,
  );
  const activeIndex = COLLABORATION_STAGES.findIndex(
    (item) => item.id === activeStage,
  );

  if (stageIndex < activeIndex) return "complete";
  if (stageIndex === activeIndex) return "current";
  return "upcoming";
}
