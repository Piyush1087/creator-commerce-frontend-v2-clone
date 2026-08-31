// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "../../../features/settings/components/brand/brand-general-settings",
  () => ({ BrandGeneralSettings: () => createElement("div", null, "General content") }),
);

vi.mock(
  "../../../features/settings/components/brand/brand-integrations-settings",
  () => ({
    BrandIntegrationsSettings: () =>
      createElement("div", null, "Integrations content"),
  }),
);

vi.mock(
  "../../../features/settings/components/settings-billing-sections",
  () => ({
    SettingsBillingSections: () =>
      createElement("section", null, "Subscription and invoices"),
  }),
);

vi.mock(
  "../../../features/settings/components/brand/brand-finance-settings",
  () => ({
    BrandFinanceSettings: () =>
      createElement("section", null, "Billing profile and notifications"),
  }),
);

vi.mock(
  "../../../features/brand-escrow/components/escrow-account-card",
  () => ({
    EscrowAccountCard: ({ showLedgerInline }: { showLedgerInline?: boolean }) =>
      createElement(
        "section",
        {
          "data-testid": "secure-escrow-workspace",
          "data-ledger-inline": String(Boolean(showLedgerInline)),
        },
        "Secure escrow workspace",
      ),
  }),
);

import { SettingsShell } from "../../../features/settings/components/settings-shell";
import {
  BRAND_SETTINGS_ROUTES,
  isBrandFinanceRoute,
} from "../../../features/settings/constants/settings-routes";
import { resolveHeaderMeta } from "../../../layouts/app-shell/sidebar-items";
import { BrandSettingsBillingPage } from "./brand-settings-billing-page";
import { BrandSettingsEscrowPage } from "./brand-settings-escrow-page";
import { BrandSettingsGeneralPage } from "./brand-settings-general-page";
import { BrandSettingsIntegrationsPage } from "./brand-settings-integrations-page";

function renderSettingsRoute(pathname: string) {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [pathname] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          { path: BRAND_SETTINGS_ROUTES.root, element: createElement(SettingsShell) },
          createElement(Route, {
            index: true,
            element: createElement(Navigate, { to: "general", replace: true }),
          }),
          createElement(Route, {
            path: "general",
            element: createElement(BrandSettingsGeneralPage),
          }),
          createElement(Route, {
            path: "integrations",
            element: createElement(BrandSettingsIntegrationsPage),
          }),
          createElement(Route, {
            path: "billing",
            element: createElement(BrandSettingsBillingPage),
          }),
          createElement(Route, {
            path: "escrow",
            element: createElement(BrandSettingsEscrowPage),
          }),
        ),
      ),
    ),
  );
}

afterEach(cleanup);

describe("FE-E Brand Settings routing and composition", () => {
  it("redirects the Settings root deterministically to General", async () => {
    renderSettingsRoute(BRAND_SETTINGS_ROUTES.root);
    expect(await screen.findByText("General content")).toBeTruthy();
    expect(screen.getByRole("link", { name: "General" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("loads the Integrations route directly with the correct active tab", () => {
    renderSettingsRoute(BRAND_SETTINGS_ROUTES.integrations);
    expect(screen.getByText("Integrations content")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Integrations" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.queryByLabelText("Finance sub-sections")).toBeNull();
  });

  it("keeps Billing overview billing-only and Finance visibly and semantically active", () => {
    renderSettingsRoute(BRAND_SETTINGS_ROUTES.billing);
    expect(screen.getByText("Subscription and invoices")).toBeTruthy();
    expect(screen.getByText("Billing profile and notifications")).toBeTruthy();
    expect(screen.queryByTestId("secure-escrow-workspace")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Finance & Escrow" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Billing overview" }).getAttribute("aria-current"),
    ).toBe("page");
  });

  it("mounts the complete Treasury workspace only on Secure escrow", () => {
    renderSettingsRoute(BRAND_SETTINGS_ROUTES.escrow);
    expect(screen.getByTestId("secure-escrow-workspace").getAttribute("data-ledger-inline")).toBe(
      "true",
    );
    expect(screen.queryByText("Subscription and invoices")).toBeNull();
    expect(screen.queryByText("Billing profile and notifications")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Finance & Escrow" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Secure escrow" }).getAttribute("aria-current"),
    ).toBe("page");
  });

  it("matches only canonical Finance route boundaries", () => {
    expect(isBrandFinanceRoute(BRAND_SETTINGS_ROUTES.billing)).toBe(true);
    expect(isBrandFinanceRoute(`${BRAND_SETTINGS_ROUTES.billing}/history`)).toBe(true);
    expect(isBrandFinanceRoute(BRAND_SETTINGS_ROUTES.escrow)).toBe(true);
    expect(isBrandFinanceRoute(`${BRAND_SETTINGS_ROUTES.escrow}/ledger`)).toBe(true);
    expect(isBrandFinanceRoute(`${BRAND_SETTINGS_ROUTES.billing}-legacy`)).toBe(false);
    expect(isBrandFinanceRoute(`${BRAND_SETTINGS_ROUTES.escrow}-legacy`)).toBe(false);
  });

  it("uses canonical Settings context titles in the application shell", () => {
    expect(resolveHeaderMeta(BRAND_SETTINGS_ROUTES.billing, "BRAND")).toEqual({
      breadcrumb: "Settings",
      title: "Billing overview",
    });
    expect(resolveHeaderMeta(BRAND_SETTINGS_ROUTES.escrow, "BRAND")).toEqual({
      breadcrumb: "Settings",
      title: "Secure escrow",
    });
  });
});
