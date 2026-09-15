import type { CreatorShellState } from "../../../layouts/app-shell/creator-shell-capabilities";
import {
  PortfolioConsumerSchema,
  type PortfolioItem,
} from "../contracts/portfolio-consumer";
export const portfolioIdentity = `portfolio-item:${"a".repeat(64)}`;
export const portfolioReferenceCommand = {
  intent: "ADD_REFERENCE" as const,
  expectedRevision: 0,
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  kind: "EXTERNAL" as const,
  title: "Example work",
  destination: "https://example.com/work",
  creatorContext: null,
  workDate: null,
};
export function portfolioFixture(
  role: "OWNER" | "MANAGER" | "ASSISTANT" = "OWNER",
  items: PortfolioItem[] = [],
) {
  return PortfolioConsumerSchema.parse({
    contractVersion: "creator-portfolio-v3.1",
    currentRevision: 0,
    context: { role, canCurate: role !== "ASSISTANT" },
    items,
    nextCursor: null,
    discovery: "NOT_PROCESSED",
    limitations: ["SOURCE_LINK_ONLY"],
  });
}
export function manualItem(): PortfolioItem {
  return {
    id: portfolioIdentity,
    kind: "EXTERNAL",
    destination: "https://example.com/work",
    title: "Example work",
    creatorContext: "Creator-authored context",
    brandLabel: null,
    workDate: null,
    state: "INCLUDED",
    provenance: [
      { source: "CREATOR_PROVIDED", createdAt: "2026-09-16T00:00:00.000Z" },
    ],
    presentation: "SOURCE_LINK_ONLY",
    access: "ACCESS_REQUIREMENTS_UNKNOWN",
  };
}
export function portfolioActor(
  role: "OWNER" | "MANAGER" | "ASSISTANT" = "OWNER",
  subject = "owner",
): CreatorShellState {
  return {
    status: "READY",
    actorContext: {
      actorUserId: role === "OWNER" ? subject : role,
      actorMembershipId: `member-${role}`,
      actorRole: role,
      workspaceId: `workspace-${subject}`,
      organizationId: "org",
      subjectCreatorProfileId: subject,
      subjectOwnerUserId: subject,
      allowedActions:
        role === "ASSISTANT"
          ? ["PORTFOLIO_READ"]
          : ["PORTFOLIO_READ", "PORTFOLIO_CURATE"],
    },
  };
}
