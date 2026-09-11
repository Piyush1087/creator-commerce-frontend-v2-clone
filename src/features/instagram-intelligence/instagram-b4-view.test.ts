// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InstagramB4Content } from "./components/instagram-b4-view";
import { instagramB4Fixture } from "./testing/instagram-b4-fixture";

afterEach(cleanup);
describe("Instagram Intelligence B4 page", () => {
  it("renders the bounded observation and preserved-current truth", () => {
    const { container } = render(
      createElement(InstagramB4Content, { data: instagramB4Fixture() }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Instagram Intelligence" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Observed format:").parentElement?.textContent,
    ).toContain("IMAGE");
    expect(
      screen.getByText("Not enough posts to identify patterns or learnings"),
    ).toBeTruthy();
    expect(
      screen.getByText(/last successful current insight is preserved/i),
    ).toBeTruthy();
    expect(container.textContent).not.toContain("accessToken");
    expect(container.textContent).not.toContain("Pattern detected");
  });
  it("renders a truthful no-current recovery state", () => {
    const fixture = instagramB4Fixture();
    render(
      createElement(InstagramB4Content, {
        data: { ...fixture, contentBehavior: null, window: null },
      }),
    );
    expect(
      screen.getByRole("heading", { name: "No current insight" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Open Instagram settings/ })
        .getAttribute("href"),
    ).toBe(fixture.settingsRecoveryPath);
  });
});
