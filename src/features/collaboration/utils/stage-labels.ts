import type { CollaborationStage } from "../contracts/collaboration.contracts";

const STAGE_LABELS: Record<CollaborationStage, string> = {
  STAGE_1_NEGOTIATION: "Negotiation",
  STAGE_2_SECUREMENT: "Securement",
  STAGE_3_LOGISTICS: "Logistics",
  STAGE_4_CONTENT_REVIEW: "Content Review",
  STAGE_5_PUBLISHING: "Publishing",
  STAGE_6_FEEDBACK_SYNC: "Feedback",
};

const STAGE_STEP: Record<CollaborationStage, number> = {
  STAGE_1_NEGOTIATION: 1,
  STAGE_2_SECUREMENT: 2,
  STAGE_3_LOGISTICS: 3,
  STAGE_4_CONTENT_REVIEW: 4,
  STAGE_5_PUBLISHING: 5,
  STAGE_6_FEEDBACK_SYNC: 6,
};

export function collaborationStageLabel(stage: CollaborationStage): string {
  return STAGE_LABELS[stage] ?? stage;
}

export function collaborationStageChip(stage: CollaborationStage): string {
  return `Step ${STAGE_STEP[stage]}: ${STAGE_LABELS[stage]}`;
}

export function collaborationStageProgress(stage: CollaborationStage): number {
  return Math.round((STAGE_STEP[stage] / 6) * 100);
}
