import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { MobileNavigation } from "./MobileNavigation";

vi.mock("../../shared/auth/use-auth-session", () => ({
  useAuthSession: () => ({ currentUser: { role: "BRAND" } }),
}));
vi.mock("../../shared/auth/use-logout", () => ({ useLogout: () => vi.fn() }));

describe("mobile shell closed-menu accessibility", () => {
  it.each([false, true])(
    "open=%s retains routes and controls focus/AT exposure",
    (isOpen) => {
      const html = renderToStaticMarkup(
        createElement(
          MemoryRouter,
          null,
          createElement(MobileNavigation, { isOpen, onClose: vi.fn() }),
        ),
      );
      expect(html).toContain(`aria-hidden="${!isOpen}"`);
      expect(html.includes('inert=""')).toBe(!isOpen);
      expect(html).toContain('href="/brand-centre"');
      expect(html).toContain('aria-label="Close menu"');
    },
  );
});
