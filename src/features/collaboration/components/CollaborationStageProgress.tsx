import { Check } from "lucide-react";

import type {
  CollaborationLifecycle,
  CollaborationStage,
} from "../contracts/collaboration.contracts";
import {
  COLLABORATION_STAGES,
  collaborationStagePresentation,
} from "../utils/collaboration-stage-progress";

export function CollaborationStageProgress({
  activeStage,
  lifecycle,
}: {
  activeStage: CollaborationStage;
  lifecycle: CollaborationLifecycle;
}) {
  return (
    <ol className="collab-stage-progress" aria-label="Collaboration stages">
      {COLLABORATION_STAGES.map((stage) => {
        const presentation = collaborationStagePresentation(
          stage.id,
          activeStage,
          lifecycle,
        );
        return (
          <li
            key={stage.id}
            className={`collab-stage-progress__item is-${presentation}`}
            aria-current={presentation === "current" ? "step" : undefined}
          >
            <span className="collab-stage-progress__marker" aria-hidden="true">
              {presentation === "complete" ? (
                <Check size={12} strokeWidth={3} />
              ) : null}
            </span>
            <span className="collab-stage-progress__label">{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
