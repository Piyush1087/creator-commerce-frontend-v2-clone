// @vitest-environment jsdom
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { WorkPreferencesForm } from "./work-preferences-form";
import { RateCardForm } from "./rate-card-form";
import { commercialFixture } from "../testing/commercial.fixture";
afterEach(cleanup);
describe("Commercial forms", () => {
  it("has explicit unanswered choices and Owner manual save", async () => {
    const { work, rates } = commercialFixture(),
      save = vi.fn().mockResolvedValue(true);
    render(
      <WorkPreferencesForm
        work={work}
        rates={rates}
        disabled={false}
        pending={false}
        save={save}
      />,
    );
    fireEvent.change(screen.getByLabelText("UGC-project willingness"), {
      target: { value: "YES" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save Work Preferences" }),
    );
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0]).toMatchObject({
      expectedRevision: 1,
      expectedRateCardRevision: 1,
      values: { ugcProjects: "YES" },
      confirmMonetaryReset: false,
    });
  });
  it("Assistant has no mutation button and disabled fields", () => {
    const { work, rates } = commercialFixture("ASSISTANT"),
      save = vi.fn();
    render(
      <WorkPreferencesForm
        work={work}
        rates={rates}
        disabled={false}
        pending={false}
        save={save}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Save Work Preferences" }),
    ).toBeNull();
    expect(
      (
        screen.getByLabelText("UGC-project willingness") as HTMLSelectElement
      ).closest("fieldset")?.disabled,
    ).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });
  it("requires explicit cross-currency reset and cancel preserves draft", async () => {
    const { work, rates } = commercialFixture();
    rates.values!.REEL_VIDEO = { enabled: true, amountMinor: 10000 };
    const save = vi.fn().mockResolvedValue(true);
    render(
      <WorkPreferencesForm
        work={work}
        rates={rates}
        disabled={false}
        pending={false}
        save={save}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^Base country/), {
      target: { value: "US" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save Work Preferences" }),
    );
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      (screen.getByLabelText(/^Base country/) as HTMLSelectElement).value,
    ).toBe("US");
    fireEvent.click(
      screen.getByRole("button", { name: "Save Work Preferences" }),
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Confirm country change and clear monetary rates",
      }),
    );
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].confirmMonetaryReset).toBe(true);
  });
  it("each rate item is independent and decimal input is exact", async () => {
    const { work, rates } = commercialFixture(),
      save = vi.fn().mockResolvedValue(true);
    render(
      <RateCardForm
        work={work}
        rates={rates}
        disabled={false}
        pending={false}
        save={save}
      />,
    );
    fireEvent.change(screen.getByLabelText("Enable Reel starting price"), {
      target: { value: "YES" },
    });
    fireEvent.change(screen.getByLabelText(/^Starting from — Reel \(INR\)/), {
      target: { value: "100.01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Rate Card" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].values.REEL_VIDEO).toEqual({
      enabled: true,
      amountMinor: 10001,
    });
    expect(save.mock.calls[0][0].values.STORY.enabled).toBe(false);
  });
  it("stale money offers reconciliation, not editing or currency input", () => {
    const { work, rates } = commercialFixture();
    rates.state = "MONETARY_RATES_REQUIRE_REENTRY";
    render(
      <RateCardForm
        work={work}
        rates={rates}
        disabled={false}
        pending={false}
        save={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Reconcile Rate Card currency" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Currency")).toBeNull();
    expect(
      (
        screen.getByLabelText("Enable Reel starting price") as HTMLSelectElement
      ).closest("fieldset")?.disabled,
    ).toBe(true);
  });
});
