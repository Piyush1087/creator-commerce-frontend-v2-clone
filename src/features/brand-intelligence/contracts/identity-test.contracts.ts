export type IdentityTestTaskState =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED_PRECHECK"
  | "FAILED_PROVIDER"
  | "FAILED_VALIDATION"
  | "FAILED_PERSISTENCE"
  | "SKIPPED_DEPENDENCY"
  | "STOPPED_EXPECTED";

export type IdentityTestExecutionState =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED"
  | "STOPPED_EXPECTED";

export type IdentityTestTaskResult = {
  taskId: string;
  state: IdentityTestTaskState;
  values?: Record<string, unknown>;
  error?: { code: string; message: string };
  metadata?: Record<string, unknown>;
};

export type IdentityTestDryRunResponse = {
  mode: "DRY_RUN";
  persisted: boolean;
  executionProfileId: string;
  entityType: string;
  entityId: string;
  websiteUrl: string;
  executionId: string;
  state: IdentityTestExecutionState;
  tasks: IdentityTestTaskResult[];
  validatedOutputs: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isIdentityTestDryRunResponse(
  value: unknown,
): value is IdentityTestDryRunResponse {
  if (!isRecord(value)) return false;
  return (
    value.mode === "DRY_RUN" &&
    typeof value.executionId === "string" &&
    typeof value.state === "string" &&
    typeof value.websiteUrl === "string" &&
    Array.isArray(value.tasks) &&
    isRecord(value.validatedOutputs)
  );
}
