// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstagramMediaDetailDrawer } from "./components/instagram-media-detail";
import { safeInstagramPermalink } from "./components/instagram-media-detail-safety";
import type { InstagramMediaDetailState } from "./hooks/use-instagram-media-detail";
import { instagramMediaDetailFixture } from "./testing/instagram-b4-fixture";

afterEach(cleanup);

function renderDetail(state: InstagramMediaDetailState) {
  const origin = document.createElement("button");
  origin.textContent = "Origin";
  document.body.append(origin);
  const restoreFocusRef = { current: origin };
  const onClose = vi.fn();
  const onRetry = vi.fn();
  const rendered = render(
    <InstagramMediaDetailDrawer
      state={state}
      onClose={onClose}
      onRetry={onRetry}
      restoreFocusRef={restoreFocusRef}
    />,
  );
  return { onClose, onRetry, origin, container: rendered.container };
}

describe("Instagram Intelligence E4 media detail", () => {
  it("renders the six-part safe hierarchy without internal identities or raw evidence", () => {
    const detail = instagramMediaDetailFixture();
    renderDetail({ kind: "DETAIL_READY", detail });
    expect(
      screen.getAllByRole("heading").map((item) => item.textContent),
    ).toEqual([
      "Post details",
      "1. Media context",
      "Caption",
      "Hashtags",
      "Mentions",
      "2. Observed performance",
      "3. Content observations",
      "Themes",
      "Caption patterns",
      "Creative structures",
      "Visual executions",
      "4. Creator / Offering presence",
      "5. Likely-collab signal",
      "6. Inspection, coverage and provenance",
      "Coverage limitations",
    ]);
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByText(/not treated as zero/i)).toBeTruthy();
    expect(screen.getByText(/Instagram-content signal only/)).toBeTruthy();
    expect(screen.getByText(/not canonical Creator, Offering/i)).toBeTruthy();
    expect(document.body.querySelector("script")).toBeNull();
    const text = document.body.textContent ?? "";
    expect(text).toContain("<script>alert(1)</script>");
    expect(text).not.toContain("synthetic-support-1");
    expect(text).not.toContain("synthetic-media-1");
    expect(text).not.toContain("11111111-1111-4111-8111-111111111111");
    expect(text).not.toMatch(/Alignment Index|Revenue Lift|Quality Rating/i);
  });

  it("allows only absolute HTTPS links on accepted Instagram hosts", () => {
    const detail = instagramMediaDetailFixture();
    expect(safeInstagramPermalink(detail.permalink)).toBe(
      "https://www.instagram.com/p/synthetic-post/",
    );
    for (const value of [
      { state: "AVAILABLE", value: "http://instagram.com/p/x" },
      { state: "AVAILABLE", value: "https://instagram.com.example.test/x" },
      { state: "AVAILABLE", value: "javascript:alert(1)" },
      { state: "UNKNOWN", reasonCode: "INSUFFICIENT_EVIDENCE" },
    ] as const)
      expect(safeInstagramPermalink(value)).toBeNull();
    renderDetail({
      kind: "DETAIL_READY",
      detail: {
        ...detail,
        permalink: { state: "AVAILABLE", value: "https://evil.example/x" },
      },
    });
    expect(
      screen.queryByRole("link", { name: "View on Instagram" }),
    ).toBeNull();
    expect(screen.getByText("Instagram link unavailable.")).toBeTruthy();
  });

  it.each([
    ["DETAIL_LOADING", "Loading post detail…"],
    ["DETAIL_RETRYING", "Retrying post detail…"],
    ["DETAIL_INVALID_RESPONSE", "could not be safely displayed"],
    ["DETAIL_NOT_FOUND", "This post detail is no longer available"],
    ["DETAIL_UNAUTHORIZED", "session could not authorize"],
    ["DETAIL_FORBIDDEN", "not available in the current Brand workspace"],
    ["DETAIL_TRANSIENT_ERROR", "temporarily unavailable"],
    ["DETAIL_STALE_OR_CHANGED_GENERATION", "no longer available"],
    ["DETAIL_REMOVED_AFTER_REFRESH", "no longer available"],
  ] as const)(
    "renders %s locally inside the closeable detail surface",
    (kind, copy) => {
      const { onClose } = renderDetail({ kind });
      expect(screen.getByText(new RegExp(copy, "i"))).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Close post details" }),
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );

  it("traps focus, closes with Escape and restores the stable origin", async () => {
    const { onClose, origin } = renderDetail({
      kind: "DETAIL_READY",
      detail: instagramMediaDetailFixture(),
    });
    const close = screen.getByRole("button", { name: "Close post details" });
    await waitFor(() => expect(document.activeElement).toBe(close));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("link", { name: "View on Instagram" })).toBe(
      document.activeElement,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
    expect(document.activeElement).toBe(origin);
  });
});
