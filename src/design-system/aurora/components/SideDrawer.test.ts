// @vitest-environment jsdom
import { createElement, useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SideDrawer } from "./SideDrawer";

function DrawerFixture() {
  const [open, setOpen] = useState(false);
  return createElement(
    "div",
    null,
    createElement(
      "button",
      { type: "button", onClick: () => setOpen(true) },
      "Open drawer",
    ),
    createElement(
      SideDrawer,
      {
        isOpen: open,
        onClose: () => setOpen(false),
        title: "Accessible action",
        footer: createElement("button", { type: "button" }, "Confirm action"),
      },
      createElement("input", { "aria-label": "Action value" }),
    ),
  );
}

afterEach(cleanup);

describe("Aurora SideDrawer accessibility", () => {
  it("focuses and traps the modal, then restores focus after Escape", async () => {
    render(createElement(DrawerFixture));
    const trigger = screen.getByRole("button", { name: "Open drawer" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Accessible action" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const close = screen.getByRole("button", {
      name: "Close Accessible action",
    });
    await waitFor(() => expect(document.activeElement).toBe(close));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Confirm action" }),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
