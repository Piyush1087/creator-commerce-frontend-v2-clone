import {
  CanonicalDraftRequestError,
  type CanonicalCampaignReadinessResponse,
  type CanonicalReadinessCurrency,
  type CanonicalReadinessObjective,
} from "../api/canonical-campaign-draft-client";

type ReadinessIdentity = {
  campaignId: string;
  objective: CanonicalReadinessObjective;
};

export type CanonicalCampaignReadinessState =
  | { status: "idle" }
  | { status: "not-ready"; campaignId: string; reason: "OBJECTIVE_REQUIRED" }
  | ({ status: "resolving" } & ReadinessIdentity)
  | ({
      status: "ready";
      currency: CanonicalReadinessCurrency;
      primaryKpi: string;
      supportingKpis: readonly string[];
      revision: string;
    } & ReadinessIdentity)
  | ({
      status: "failed-retryable";
      reason: "READINESS_TEMPORARILY_UNAVAILABLE";
      retryable: true;
    } & ReadinessIdentity)
  | ({
      status: "failed-non-retryable";
      reason:
        | "SUPPORTING_KPI_CONFIGURATION_UNAVAILABLE"
        | "READINESS_REQUEST_REJECTED";
      retryable: false;
    } & ReadinessIdentity);

export class CanonicalCampaignReadinessController {
  private currentCampaignId: string | null = null;
  private currentLocalObjective: CanonicalReadinessObjective | null = null;
  private currentSavedObjective: CanonicalReadinessObjective | null = null;
  private disposed = false;
  private generation = 0;
  private currentState: CanonicalCampaignReadinessState = { status: "idle" };

  constructor(
    private readonly load: (
      campaignId: string,
    ) => Promise<CanonicalCampaignReadinessResponse>,
    private readonly onStateChange?: () => void,
  ) {}

  state(): CanonicalCampaignReadinessState {
    return this.currentState;
  }

  requestGeneration(): number {
    return this.generation;
  }

  hydrate(
    campaignId: string,
    objective: CanonicalReadinessObjective | null,
  ): void {
    if (this.disposed) return;
    this.invalidate(campaignId, objective, objective);
    if (!objective) {
      this.setState({
        status: "not-ready",
        campaignId,
        reason: "OBJECTIVE_REQUIRED",
      });
      return;
    }
    this.request(campaignId, objective);
  }

  objectiveChanged(
    campaignId: string,
    objective: CanonicalReadinessObjective | null,
  ): void {
    if (this.disposed) return;
    this.invalidate(campaignId, objective, null);
    this.setState(
      objective
        ? { status: "resolving", campaignId, objective }
        : { status: "not-ready", campaignId, reason: "OBJECTIVE_REQUIRED" },
    );
  }

  objectiveAccepted(
    campaignId: string,
    objective: CanonicalReadinessObjective,
  ): void {
    if (
      this.disposed ||
      campaignId !== this.currentCampaignId ||
      objective !== this.currentLocalObjective
    ) {
      return;
    }
    this.currentSavedObjective = objective;
    this.request(campaignId, objective);
  }

  retry(): void {
    if (
      this.disposed ||
      this.currentState.status !== "failed-retryable" ||
      !this.currentCampaignId ||
      !this.currentSavedObjective ||
      this.currentSavedObjective !== this.currentLocalObjective
    ) {
      return;
    }
    this.request(this.currentCampaignId, this.currentSavedObjective);
  }

  canContinue(stageOneRequirementsPass: boolean): boolean {
    return (
      stageOneRequirementsPass &&
      this.currentState.status === "ready" &&
      this.currentState.campaignId === this.currentCampaignId &&
      this.currentState.objective === this.currentSavedObjective &&
      this.currentState.objective === this.currentLocalObjective
    );
  }

  canNavigateBack(): boolean {
    return true;
  }

  dispose(): void {
    this.disposed = true;
    this.generation += 1;
  }

  private invalidate(
    campaignId: string,
    localObjective: CanonicalReadinessObjective | null,
    savedObjective: CanonicalReadinessObjective | null,
  ): void {
    this.generation += 1;
    this.currentCampaignId = campaignId;
    this.currentLocalObjective = localObjective;
    this.currentSavedObjective = savedObjective;
  }

  private request(
    campaignId: string,
    objective: CanonicalReadinessObjective,
  ): void {
    const requestGeneration = ++this.generation;
    this.setState({ status: "resolving", campaignId, objective });
    void this.load(campaignId).then(
      (response) =>
        this.accept(requestGeneration, campaignId, objective, response),
      (error: unknown) =>
        this.reject(requestGeneration, campaignId, objective, error),
    );
  }

  private isCurrent(
    generation: number,
    campaignId: string,
    objective: CanonicalReadinessObjective,
  ) {
    return (
      !this.disposed &&
      generation === this.generation &&
      campaignId === this.currentCampaignId &&
      objective === this.currentSavedObjective &&
      objective === this.currentLocalObjective
    );
  }

  private accept(
    generation: number,
    campaignId: string,
    objective: CanonicalReadinessObjective,
    response: CanonicalCampaignReadinessResponse,
  ): void {
    if (!this.isCurrent(generation, campaignId, objective)) return;
    if (response.campaignId !== campaignId || response.objective !== objective)
      return;

    if (response.status === "READY") {
      this.setState({
        status: "ready",
        campaignId,
        objective,
        currency: response.currency,
        primaryKpi: response.primaryKpi,
        supportingKpis: [...response.supportingKpis],
        revision: response.revision,
      });
      return;
    }

    if (response.status === "FAILED") {
      this.setState({
        status: "failed-non-retryable",
        campaignId,
        objective,
        reason: "SUPPORTING_KPI_CONFIGURATION_UNAVAILABLE",
        retryable: false,
      });
    }
  }

  private reject(
    generation: number,
    campaignId: string,
    objective: CanonicalReadinessObjective,
    error: unknown,
  ): void {
    if (!this.isCurrent(generation, campaignId, objective)) return;
    const retryable =
      !(error instanceof CanonicalDraftRequestError) ||
      error.status === null ||
      error.status >= 500;
    this.setState(
      retryable
        ? {
            status: "failed-retryable",
            campaignId,
            objective,
            reason: "READINESS_TEMPORARILY_UNAVAILABLE",
            retryable: true,
          }
        : {
            status: "failed-non-retryable",
            campaignId,
            objective,
            reason: "READINESS_REQUEST_REJECTED",
            retryable: false,
          },
    );
  }

  private setState(state: CanonicalCampaignReadinessState): void {
    this.currentState = state;
    this.onStateChange?.();
  }
}
