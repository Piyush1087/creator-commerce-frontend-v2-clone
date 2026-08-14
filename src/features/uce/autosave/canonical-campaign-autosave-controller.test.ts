import { afterEach, describe, expect, it, vi } from "vitest";
import { CanonicalCampaignAutosaveController } from "./canonical-campaign-autosave-controller";

afterEach(() => vi.useRealTimers());

describe("CanonicalCampaignAutosaveController", () => {
  it("coalesces rapid changes into the latest value", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = new CanonicalCampaignAutosaveController(save);
    controller.schedule("strategy.campaign_name", "A");
    controller.schedule("strategy.campaign_name", "B");
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith("strategy.campaign_name", "B");
    expect(controller.status("strategy.campaign_name")).toBe("saved");
  });

  it("does not issue a PATCH for an already accepted value", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = new CanonicalCampaignAutosaveController(save, 0);
    controller.schedule("visibility", "PUBLIC", true);
    await controller.flush();
    controller.schedule("visibility", "PUBLIC", true);
    await controller.flush();
    expect(save).toHaveBeenCalledOnce();
  });

  it("keeps a newer revision dirty while an older request resolves", async () => {
    let resolveFirst!: () => void;
    let resolveSecond!: () => void;
    const first = new Promise<void>((resolve) => { resolveFirst = resolve; });
    const second = new Promise<void>((resolve) => { resolveSecond = resolve; });
    const save = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const controller = new CanonicalCampaignAutosaveController(save, 0);
    controller.schedule("name", "first", true);
    await Promise.resolve();
    controller.schedule("name", "second", true);
    resolveFirst();
    await Promise.resolve();
    expect(controller.status("name")).not.toBe("saved");
    resolveSecond();
    await controller.flush(["name"]);
    expect(save).toHaveBeenLastCalledWith("name", "second");
    expect(controller.status("name")).toBe("saved");
  });

  it("isolates a failed field and retries only that field", async () => {
    const save = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    const controller = new CanonicalCampaignAutosaveController(save, 0);
    controller.schedule("name", "A", true);
    controller.schedule("visibility", "PUBLIC", true);
    await controller.flush();
    expect(controller.status("name")).toBe("failed-retryable");
    expect(controller.status("visibility")).toBe("saved");
    controller.retry("name");
    await controller.flush(["name"]);
    expect(controller.status("name")).toBe("saved");
    expect(save).toHaveBeenCalledTimes(3);
  });

  it("blocks a flush while any requested field has a retryable failure", async () => {
    const controller = new CanonicalCampaignAutosaveController(vi.fn().mockRejectedValue(new Error("offline")), 0);
    controller.schedule("name", "A", true);
    expect(await controller.flush(["name"])).toBe(false);
    expect(controller.hasPendingOrFailed(["name"])).toBe(true);
  });

  it("forgets cancelled conditional fields before they can save", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = new CanonicalCampaignAutosaveController(save);
    controller.schedule("publish_from", "2026-09-15");
    controller.forget("publish_from");
    await vi.runAllTimersAsync();
    expect(save).not.toHaveBeenCalled();
    expect(controller.status("publish_from")).toBe("idle");
  });

  it("cleans up scheduled work on disposal", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = new CanonicalCampaignAutosaveController(save);
    controller.schedule("name", "A");
    controller.dispose();
    await vi.runAllTimersAsync();
    expect(save).not.toHaveBeenCalled();
  });

  it("reports only the latest accepted mutation", async () => {
    const accepted = vi.fn();
    const controller = new CanonicalCampaignAutosaveController(
      vi.fn().mockResolvedValue(undefined),
      0,
      undefined,
      accepted,
    );
    controller.schedule("objective", "PULSE", true);
    await controller.flush(["objective"]);
    expect(accepted).toHaveBeenCalledWith("objective", "PULSE");
  });
});
