// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CampaignError } from "../api/c03-client";
const api = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("../api/c03-client", async (original) => ({
  ...(await original<typeof import("../api/c03-client")>()),
  submitApplication: api.submit,
}));
import { ScopedCampaigns } from "./CampaignAuthority";
import { OpportunityApply } from "./OpportunityApply";
import { selectablePairs } from "../utils/c03-selection";
import { opportunityFixture, receiptFixture } from "../testing/c03-fixtures";
import {
  opportunitySchema,
  applicationDetailSchema,
} from "../contracts/c03.contracts";
import { applicationFixture } from "../testing/c03-fixtures";
import { invalidateCampaignScopes } from "../api/c03-scope";
afterEach(() => {
  cleanup();
  invalidateCampaignScopes();
  api.submit.mockReset();
});
function mount(count: number) {
  const onSuccess = vi.fn();
  render(
    createElement(ScopedCampaigns, {
      children: createElement(OpportunityApply, {
        opportunity: opportunityFixture(count),
        onClose: vi.fn(),
        onRefresh: vi.fn(),
        onSuccess,
      }),
    }),
  );
  return onSuccess;
}
it("one pair enters Review, never auto-submits, and uncertain retry reuses its command", async () => {
  api.submit
    .mockRejectedValueOnce(new CampaignError(0, null, true))
    .mockResolvedValueOnce(receiptFixture);
  const onSuccess = mount(1);
  expect(
    screen.getByRole("dialog", { name: "Review Application" }),
  ).toBeTruthy();
  expect(api.submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Retry same Application" }),
  );
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(receiptFixture));
  expect(api.submit.mock.calls[0][4]).toBe(api.submit.mock.calls[1][4]);
  expect(api.submit.mock.calls[0][4]).toMatch(/^[a-f0-9]{64}$/);
});
it("multiple pairs require native Asset then Brief selection and Review", () => {
  mount(2);
  expect(
    screen
      .getByRole("button", { name: "Review Application" })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(screen.getByRole("radio", { name: "Brand" }));
  fireEvent.click(screen.getByRole("radio", { name: "Everyday story 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Review Application" }));
  expect(
    screen.getByRole("dialog", { name: "Review Application" }),
  ).toBeTruthy();
  expect(api.submit).not.toHaveBeenCalled();
});
it("rejects wrong-parent pairs and preserves unavailable selection", () => {
  const fixture = opportunityFixture(2);
  fixture.assets[0].briefs[0].campaignAssetId = fixture.campaign.id;
  expect(opportunitySchema.safeParse(fixture).success).toBe(false);
  expect(selectablePairs(fixture)).toHaveLength(1);
  fixture.assets[0].status = "PAUSED";
  expect(selectablePairs(fixture)).toHaveLength(0);
});
it.each(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "EXPIRED"] as const)(
  "accepts the immutable %s projection",
  (status) => {
    expect(
      applicationDetailSchema.parse(applicationFixture(status)).status,
    ).toBe(status);
  },
);
