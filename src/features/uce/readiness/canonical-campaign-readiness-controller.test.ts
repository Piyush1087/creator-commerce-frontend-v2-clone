import { describe, expect, it, vi } from "vitest";

import {
  CanonicalDraftRequestError,
  type CanonicalCampaignReadinessResponse,
  type CanonicalReadinessObjective,
} from "../api/canonical-campaign-draft-client";
import { CanonicalCampaignReadinessController } from "./canonical-campaign-readiness-controller";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, reject, resolve };
}

function ready(
  objective: CanonicalReadinessObjective,
  campaignId = "campaign-1",
): CanonicalCampaignReadinessResponse {
  return {
    campaignId,
    objective,
    status: "READY",
    currency: "INR",
    primaryKpi: "REACH",
    supportingKpis: ["IMPRESSIONS", "PROFILE_VISITS"],
    revision: `objective:${objective}`,
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("CanonicalCampaignReadinessController", () => {
  it.each([
    [
      "new Draft",
      () =>
        new CanonicalCampaignReadinessController(vi.fn()).hydrate(
          "campaign-1",
          null,
        ),
    ],
    [
      "hydrated Draft",
      () =>
        new CanonicalCampaignReadinessController(vi.fn()).hydrate(
          "campaign-1",
          null,
        ),
    ],
  ])(
    "keeps a %s without Objective not-ready without requesting",
    (_label, exercise) => {
      exercise();
      const load = vi.fn();
      const controller = new CanonicalCampaignReadinessController(load);
      controller.hydrate("campaign-1", null);
      expect(controller.state()).toEqual({
        status: "not-ready",
        campaignId: "campaign-1",
        reason: "OBJECTIVE_REQUIRED",
      });
      expect(load).not.toHaveBeenCalled();
    },
  );

  it("requests exactly once when a saved Objective is hydrated", () => {
    const load = vi.fn().mockReturnValue(new Promise(() => undefined));
    const controller = new CanonicalCampaignReadinessController(load);
    controller.hydrate("campaign-1", "PULSE");
    expect(load).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledWith("campaign-1");
  });

  it("clears readiness immediately and waits for accepted persistence", async () => {
    const load = vi.fn().mockResolvedValue(ready("PULSE"));
    const controller = new CanonicalCampaignReadinessController(load);
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    expect(controller.state().status).toBe("ready");

    controller.objectiveChanged("campaign-1", "PROOF");

    expect(controller.state()).toEqual({
      status: "resolving",
      campaignId: "campaign-1",
      objective: "PROOF",
    });
    expect(load).toHaveBeenCalledOnce();
  });

  it("requests readiness only after Objective PATCH acceptance, including autosave retry acceptance", () => {
    const load = vi.fn().mockReturnValue(new Promise(() => undefined));
    const controller = new CanonicalCampaignReadinessController(load);
    controller.hydrate("campaign-1", null);
    controller.objectiveChanged("campaign-1", "PULSE");
    expect(load).not.toHaveBeenCalled();

    controller.objectiveAccepted("campaign-1", "PULSE");
    expect(load).toHaveBeenCalledOnce();
  });

  it("accepts current readiness and retains server-derived currency", async () => {
    const controller = new CanonicalCampaignReadinessController(
      vi.fn().mockResolvedValue(ready("PULSE")),
    );
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    expect(controller.state()).toMatchObject({
      status: "ready",
      objective: "PULSE",
      currency: "INR",
      revision: "objective:PULSE",
    });
  });

  it.each([
    [
      "ready",
      (
        request: ReturnType<
          typeof deferred<CanonicalCampaignReadinessResponse>
        >,
      ) => request.resolve(ready("PULSE")),
    ],
    [
      "domain failure",
      (
        request: ReturnType<
          typeof deferred<CanonicalCampaignReadinessResponse>
        >,
      ) =>
        request.resolve({
          campaignId: "campaign-1",
          objective: "PULSE",
          status: "FAILED",
          reason: "SUPPORTING_KPI_CONFIGURATION_UNAVAILABLE",
          retryable: false,
          revision: "objective:PULSE",
        }),
    ],
    [
      "transport failure",
      (
        request: ReturnType<
          typeof deferred<CanonicalCampaignReadinessResponse>
        >,
      ) => request.reject(new Error("offline")),
    ],
  ])("ignores stale %s after an Objective change", async (_label, complete) => {
    const request = deferred<CanonicalCampaignReadinessResponse>();
    const controller = new CanonicalCampaignReadinessController(
      vi.fn().mockReturnValue(request.promise),
    );
    controller.hydrate("campaign-1", "PULSE");
    controller.objectiveChanged("campaign-1", "PROOF");
    complete(request);
    await settle();
    expect(controller.state()).toEqual({
      status: "resolving",
      campaignId: "campaign-1",
      objective: "PROOF",
    });
  });

  it("ignores a response with a mismatched Objective or Draft ID", async () => {
    const controller = new CanonicalCampaignReadinessController(
      vi.fn().mockResolvedValue(ready("PROOF", "campaign-other")),
    );
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    expect(controller.state().status).toBe("resolving");
  });

  it("a different hydrated Draft invalidates prior readiness", async () => {
    const first = deferred<CanonicalCampaignReadinessResponse>();
    const load = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(ready("PROOF", "campaign-2"));
    const controller = new CanonicalCampaignReadinessController(load);
    controller.hydrate("campaign-1", "PULSE");
    controller.hydrate("campaign-2", "PROOF");
    first.resolve(ready("PULSE"));
    await settle();
    expect(controller.state()).toMatchObject({
      status: "ready",
      campaignId: "campaign-2",
      objective: "PROOF",
    });
  });

  it("maps static configuration failure to non-retryable", async () => {
    const controller = new CanonicalCampaignReadinessController(
      vi.fn().mockResolvedValue({
        campaignId: "campaign-1",
        objective: "PULSE",
        status: "FAILED",
        reason: "SUPPORTING_KPI_CONFIGURATION_UNAVAILABLE",
        retryable: false,
        revision: "objective:PULSE",
      }),
    );
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    expect(controller.state()).toMatchObject({
      status: "failed-non-retryable",
      retryable: false,
    });
  });

  it.each([
    ["network", new Error("offline")],
    ["5xx", new CanonicalDraftRequestError("unavailable", 503)],
  ])("maps %s failure to retryable", async (_label, error) => {
    const controller = new CanonicalCampaignReadinessController(
      vi.fn().mockRejectedValue(error),
    );
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    expect(controller.state()).toMatchObject({
      status: "failed-retryable",
      retryable: true,
      reason: "READINESS_TEMPORARILY_UNAVAILABLE",
    });
  });

  it("Retry increments generation and requests the saved Objective without PATCHing", async () => {
    const patch = vi.fn();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(ready("PULSE"));
    const controller = new CanonicalCampaignReadinessController(load);
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    const generation = controller.requestGeneration();
    controller.retry();
    expect(controller.requestGeneration()).toBeGreaterThan(generation);
    expect(load).toHaveBeenCalledTimes(2);
    expect(patch).not.toHaveBeenCalled();
    await settle();
    expect(controller.state().status).toBe("ready");
  });

  it("Retry cannot restore projection from a superseded request", async () => {
    const retry = deferred<CanonicalCampaignReadinessResponse>();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockReturnValueOnce(retry.promise);
    const controller = new CanonicalCampaignReadinessController(load);
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    controller.retry();
    controller.objectiveChanged("campaign-1", "PROOF");
    retry.resolve(ready("PULSE"));
    await settle();
    expect(controller.state()).toMatchObject({
      status: "resolving",
      objective: "PROOF",
    });
  });

  it("ignores completion after disposal", async () => {
    const request = deferred<CanonicalCampaignReadinessResponse>();
    const controller = new CanonicalCampaignReadinessController(
      vi.fn().mockReturnValue(request.promise),
    );
    controller.hydrate("campaign-1", "PULSE");
    controller.dispose();
    request.resolve(ready("PULSE"));
    await settle();
    expect(controller.state().status).toBe("resolving");
  });

  it.each([
    "idle",
    "resolving",
    "failed-retryable",
    "failed-non-retryable",
  ] as const)("blocks Step 1 while readiness is %s", async (expected) => {
    const load = vi.fn().mockReturnValue(new Promise(() => undefined));
    const controller = new CanonicalCampaignReadinessController(load);
    if (expected === "resolving") controller.hydrate("campaign-1", "PULSE");
    if (expected === "failed-retryable") {
      load.mockRejectedValue(new Error("offline"));
      controller.hydrate("campaign-1", "PULSE");
      await settle();
    }
    if (expected === "failed-non-retryable") {
      load.mockResolvedValue({
        campaignId: "campaign-1",
        objective: "PULSE",
        status: "FAILED",
        reason: "SUPPORTING_KPI_CONFIGURATION_UNAVAILABLE",
        retryable: false,
        revision: "objective:PULSE",
      });
      controller.hydrate("campaign-1", "PULSE");
      await settle();
    }
    expect(controller.state().status).toBe(expected);
    expect(controller.canContinue(true)).toBe(false);
  });

  it("allows Step 1 only for current ready state plus Stage 1 eligibility", async () => {
    const controller = new CanonicalCampaignReadinessController(
      vi.fn().mockResolvedValue(ready("PULSE")),
    );
    controller.hydrate("campaign-1", "PULSE");
    await settle();
    expect(controller.canContinue(false)).toBe(false);
    expect(controller.canContinue(true)).toBe(true);
    expect(controller.canNavigateBack()).toBe(true);
  });
});
