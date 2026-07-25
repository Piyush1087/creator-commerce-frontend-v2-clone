import type {
  BrandIntelligenceStage,
  IntelligenceJobStatus,
  IntelligenceStatusResponse,
} from "../contracts/brand.contracts";

const FAILED_STAGES: BrandIntelligenceStage[] = [
  "STAGE_1B_FAILED",
  "STAGE_2_BRAND_DNA_FAILED",
  "STAGE_2_NEEDS_REVIEW",
];

const SUCCESS_STAGES: BrandIntelligenceStage[] = [
  "STAGE_2_BRAND_DNA_ARCHIVED",
  "CHECKPOINT_2_CONFIRMED",
];

/** Default: Gemini + crawl retries can exceed 2 minutes on cold deploy. */
export const INTELLIGENCE_POLL_MAX_WAIT_MS = 8 * 60 * 1000;

export type IntelPollDecision = "poll" | "success" | "failed";

export function isIntelligenceSuccessStage(
  stage: BrandIntelligenceStage | null | undefined,
): boolean {
  return !!stage && SUCCESS_STAGES.includes(stage);
}

export function isIntelligenceFailedStage(
  stage: BrandIntelligenceStage | null | undefined,
): boolean {
  return !!stage && FAILED_STAGES.includes(stage);
}

export function isIntelligenceJobActive(
  jobStatus?: IntelligenceJobStatus | null,
): boolean {
  return jobStatus === "QUEUED" || jobStatus === "RUNNING";
}

/**
 * Decide whether to keep polling Stage 1B / Brand DNA.
 * Failed scan stages are NOT terminal while the job is still QUEUED/RUNNING
 * (worker retries up to maxAttempts after transient Gemini/crawl errors).
 */
export function decideIntelligencePoll(
  status: IntelligenceStatusResponse,
  opts?: { startedAtMs?: number; maxWaitMs?: number },
): IntelPollDecision {
  if (status.brandDna || isIntelligenceSuccessStage(status.currentStage)) {
    return "success";
  }

  const maxWaitMs = opts?.maxWaitMs ?? INTELLIGENCE_POLL_MAX_WAIT_MS;
  const timedOut =
    typeof opts?.startedAtMs === "number" &&
    Date.now() - opts.startedAtMs >= maxWaitMs;

  if (timedOut) {
    return "failed";
  }

  if (isIntelligenceJobActive(status.jobStatus)) {
    return "poll";
  }

  const stageFailed = isIntelligenceFailedStage(status.currentStage);

  if (
    stageFailed &&
    (status.jobStatus === "FAILED" || status.jobStatus === "COMPLETED")
  ) {
    return "failed";
  }

  // Failed stage + missing jobStatus (older API) or null job — keep waiting
  // until absolute timeout; retries leave stage FAILED while re-queuing.
  if (stageFailed) {
    return "poll";
  }

  return "poll";
}
