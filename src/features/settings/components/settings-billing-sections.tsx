import { ChevronDown, Info, Receipt, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../design-system/aurora";

type CollapsibleId = "plan" | "billing" | "invoices";

export function SettingsBillingSections() {
  const [openSections, setOpenSections] = useState<Record<CollapsibleId, boolean>>({
    plan: true,
    billing: false,
    invoices: false,
  });

  const toggle = (id: CollapsibleId) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div className="brand-settings__stack">
      <section className="brand-settings__collapsible">
        <button
          type="button"
          className="brand-settings__collapsible-trigger"
          onClick={() => toggle("plan")}
          aria-expanded={openSections.plan}
        >
          <div>
            <h2 className="brand-settings__collapsible-title">
              Current Plan{" "}
              <span className="brand-settings__badge">Active</span>
            </h2>
            <p className="brand-settings__collapsible-desc">
              Manage your subscription and billing
            </p>
          </div>
          <ChevronDown
            size={20}
            style={{
              transform: openSections.plan ? "rotate(180deg)" : undefined,
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
            aria-hidden
          />
        </button>
        {openSections.plan ? (
          <div className="brand-settings__collapsible-body">
            <div className="brand-settings__plan-row">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--disabled-bg)",
                    display: "grid",
                    placeItems: "center",
                    color: "#006c4b",
                  }}
                >
                  <Star size={28} fill="currentColor" aria-hidden />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-heading)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Your Plan
                  </p>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--size-h2)",
                      fontWeight: 700,
                    }}
                  >
                    FREE Plan
                  </h3>
                </div>
              </div>
              <Button>Upgrade Plan</Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="brand-settings__collapsible">
        <button
          type="button"
          className="brand-settings__collapsible-trigger"
          onClick={() => toggle("billing")}
          aria-expanded={openSections.billing}
        >
          <div>
            <h2 className="brand-settings__collapsible-title">Billing Details</h2>
            <p className="brand-settings__collapsible-desc">
              Your organization and tax information
            </p>
          </div>
          <ChevronDown
            size={20}
            style={{
              transform: openSections.billing ? "rotate(180deg)" : undefined,
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
            aria-hidden
          />
        </button>
        {openSections.billing ? (
          <div className="brand-settings__collapsible-body">
            <div className="brand-settings__empty-state">
              <Receipt size={48} color="var(--text-muted)" aria-hidden />
              <p style={{ margin: 0, maxWidth: "20rem", color: "var(--text-muted)" }}>
                No billing details added yet. Add your organization info for invoices.
              </p>
              <Button variant="outline">Update Billing Details</Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="brand-settings__collapsible">
        <button
          type="button"
          className="brand-settings__collapsible-trigger"
          onClick={() => toggle("invoices")}
          aria-expanded={openSections.invoices}
        >
          <div>
            <h2 className="brand-settings__collapsible-title">Invoices</h2>
            <p className="brand-settings__collapsible-desc">
              Download your past invoices
            </p>
          </div>
          <ChevronDown
            size={20}
            style={{
              transform: openSections.invoices ? "rotate(180deg)" : undefined,
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
            aria-hidden
          />
        </button>
        {openSections.invoices ? (
          <div className="brand-settings__collapsible-body">
            <div className="brand-settings__info-banner">
              <Info size={20} color="var(--color-tertiary)" aria-hidden />
              <p style={{ margin: 0, fontStyle: "italic" }}>
                No invoices available. Upgrade to{" "}
                <strong style={{ color: "var(--text-high)" }}>PREMIUM</strong> to see
                billing history.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
