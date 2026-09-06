import { execFileSync } from "node:child_process";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CoPilotComposer } from "../co-pilot/components/CoPilotComposer";
import { isCoPilotThreadListResponse } from "../co-pilot/contracts/co-pilot.contracts";
import { CHAT_TEST_IDS } from "./testing/chat-fixtures";

const FROZEN_BASE = "b50c36fd4b99b6e0ec0718291d794d7a58353f4c";

describe("legacy CoPilot preservation", () => {
  it("does not modify the legacy CoPilot feature", () => {
    const diff = execFileSync(
      "git",
      ["diff", "--name-only", FROZEN_BASE, "--", "src/features/co-pilot"],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();
    expect(diff).toBe("");
  });

  it("keeps the legacy neutral composer renderable for its existing surfaces", () => {
    const html = renderToStaticMarkup(
      createElement(CoPilotComposer, {
        value: "",
        placeholder: "Ask the legacy assistant",
        disabled: false,
        variant: "home",
        onChange: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(html).toContain("Ask the legacy assistant");
    expect(html).toContain('aria-label="Send message"');
    expect(html).toContain("disabled");
  });

  it("keeps the legacy thread contract parser operational", () => {
    expect(
      isCoPilotThreadListResponse({
        threads: [
          {
            threadId: CHAT_TEST_IDS.legacyConversation,
            title: "Legacy Brand Centre conversation",
            scopeContext: "BRAND_CENTRE",
            lastMessageAt: "2026-09-01T08:00:00.000Z",
            archivedAt: null,
            status: "ACTIVE",
            createdAt: "2026-09-01T08:00:00.000Z",
          },
        ],
      }),
    ).toBe(true);
  });
});
