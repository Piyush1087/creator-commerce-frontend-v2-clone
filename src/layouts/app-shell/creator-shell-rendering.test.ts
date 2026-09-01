import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { MobileBottomNav } from "./MobileBottomNav";
import { MobileNavigation } from "./MobileNavigation";
import { AppSidebar } from "./AppSidebar";

vi.mock("../../shared/auth/use-auth-session", () => ({
  useAuthSession: () => ({ currentUser: { role: "CREATOR" } }),
}));
vi.mock("../../shared/auth/use-logout", () => ({ useLogout: () => vi.fn() }));

const recovery = {
  status: "RECOVERY" as const,
  actorContext: null,
  reason: "Creator workspace provisioning is incomplete.",
};

const ready = {
  status: "READY" as const,
  actorContext: {
    actorUserId: "manager-user",
    actorMembershipId: "manager-member",
    actorRole: "MANAGER" as const,
    workspaceId: "workspace-1",
    organizationId: "organization-1",
    subjectCreatorProfileId: "profile-1",
    subjectOwnerUserId: "owner-user",
    allowedActions: ["PAYOUT_SETTINGS_READ"] as const,
  },
};

describe("Creator shell rendering", () => {
  it("renders exactly six expanded Creator destinations without upgrade or Marketplace", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(AppSidebar, { creatorShellState: ready }),
      ),
    );

    expect((html.match(/aurora-sidebar__link/g) ?? []).length).toBe(7);
    for (const label of [
      "Home",
      "Campaigns",
      "Collaborations",
      "Creator Center",
      "Payouts",
      "Settings",
    ]) {
      expect(html).toContain(`>${label}</span>`);
    }
    expect(html).not.toContain("Marketplace");
    expect(html).not.toContain("Upgrade");
  });

  it("renders four non-link mobile recovery destinations with accessible reasons", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(MobileBottomNav, { creatorShellState: recovery }),
      ),
    );

    expect((html.match(/aria-disabled="true"/g) ?? []).length).toBe(4);
    expect(html).not.toContain("/creator/marketplace");
    expect(html).toContain("Creator workspace provisioning is incomplete.");
  });

  it("keeps Settings actionable in the expanded recovery menu", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(MobileNavigation, {
          isOpen: true,
          onClose: vi.fn(),
          creatorShellState: recovery,
        }),
      ),
    );

    expect(html).toContain('href="/creator/settings"');
    expect(html).not.toContain("/creator/marketplace");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });
});
