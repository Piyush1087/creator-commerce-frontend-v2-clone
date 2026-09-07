import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChatAssistantMessage } from "./chat-assistant-message";
import { ChatMessageFeed } from "./chat-message-feed";
import { CHAT_TEST_IDS, chatResponseFixture } from "../testing/chat-fixtures";

function renderResponse(overrides = {}) {
  return renderToStaticMarkup(
    createElement(ChatAssistantMessage, {
      response: chatResponseFixture(overrides),
    }),
  );
}

describe("permanent Chat response renderer", () => {
  it("renders the backend answer and product-friendly grounding labels only", () => {
    const html = renderResponse();
    expect(html).toContain("Creator Shop understands your Brand");
    expect(html).toContain("Creator Shop records");
    expect(html).toContain("Creator Shop Intelligence");
    expect(html).not.toContain("brand.current.read");
    expect(html).not.toContain("product_intelligence.current.read");
    expect(html).not.toContain("internal-result-reference");
    expect(html).not.toContain(CHAT_TEST_IDS.brand);
  });

  it("visibly discloses stale freshness notes", () => {
    const html = renderResponse({
      status: "STALE",
      freshnessNotes: ["Product Intelligence was last refreshed yesterday."],
    });
    expect(html).toContain("Freshness notice");
    expect(html).toContain("Information freshness");
    expect(html).toContain("last refreshed yesterday");
    expect(html).toContain('role="status"');
  });

  it("visibly discloses partial limitations and freshness together", () => {
    const html = renderResponse({
      status: "PARTIAL",
      limitations: ["One Product has no current Intelligence."],
      freshnessNotes: ["Another Product is stale."],
    });
    expect(html).toContain("Partial information");
    expect(html).toContain("What Creator Shop could confirm");
    expect(html).toContain("One Product has no current Intelligence");
    expect(html).toContain("Another Product is stale");
  });

  it.each([
    ["CAPABILITY_UNAVAILABLE", "Temporarily unavailable"],
    ["NOT_AUTHORIZED", "Not available"],
    ["NAVIGATION", "Opening destination"],
  ] as const)("renders %s as a bounded product state", (status, label) => {
    const html = renderResponse({
      status,
      navigation:
        status === "NAVIGATION" ? { destinationId: "CAMPAIGNS" } : undefined,
    });
    expect(html).toContain(label);
    expect(html).not.toContain("capability planning");
  });

  it("renders historical assistant text without fabricated grounded metadata", () => {
    const html = renderToStaticMarkup(
      createElement(ChatMessageFeed, {
        conversationId: CHAT_TEST_IDS.conversation,
        isSending: false,
        messages: [
          {
            kind: "ASSISTANT_HISTORY",
            id: CHAT_TEST_IDS.message,
            text: "Safe older narrative",
            createdAt: "2026-09-01T08:00:00.000Z",
          },
        ],
      }),
    );
    expect(html).toContain("Safe older narrative");
    expect(html).not.toContain("Based on");
    expect(html).not.toContain("Answered");
  });

  it("shows non-mutating advice without creating an action control", () => {
    const html = renderResponse({
      recommendation: {
        text: "Review your Product description.",
        basisRefs: ["basis-1"],
        nonMutating: true,
      },
    });
    expect(html).toContain("Suggestion");
    expect(html).toContain("Review your Product description");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("basis-1");
  });
});
