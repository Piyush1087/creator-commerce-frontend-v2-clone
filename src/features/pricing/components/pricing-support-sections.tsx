import { ChevronDown, ExternalLink, Shield, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../design-system/aurora";
import {
  DATA_SECURITY_POINTS,
  FOUNDERS_BETA_TERMS,
} from "../constants/pricing-copy";
import type { BillingInvoiceRecord } from "../contracts/pricing.contracts";
import {
  EMPTY_DISPLAY,
  formatInvoiceAmount,
  formatPricingDate,
} from "../utils/format-pricing";

type PricingInvoiceSectionProps = {
  invoices: BillingInvoiceRecord[];
};

export function PricingInvoiceSection({ invoices }: PricingInvoiceSectionProps) {
  const [open, setOpen] = useState(false);

  const openInvoiceView = (invoice: BillingInvoiceRecord) => {
    if (invoice.shortUrl) {
      window.open(invoice.shortUrl, "_blank", "noopener,noreferrer");
      return;
    }
  };

  return (
    <section className="brand-settings__collapsible">
      <button
        type="button"
        className="brand-settings__collapsible-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div>
          <h2 className="brand-settings__collapsible-title">Invoice history</h2>
          <p className="brand-settings__collapsible-desc">View issued subscription invoices</p>
        </div>
        <ChevronDown
          size={20}
          style={{
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="brand-settings__collapsible-body">
          {invoices.length === 0 ? (
            <p className="pricing-billing__invoice-empty">
              {EMPTY_DISPLAY} — No invoices are available yet. Issued invoices appear after the
              first subscription charge.
            </p>
          ) : (
            <div className="pricing-billing__invoice-list">
              {invoices.map((invoice) => (
                <article key={invoice.razorpayInvoiceId} className="pricing-billing__invoice-card">
                  <div>
                    <strong>{invoice.invoiceNumber ?? invoice.razorpayInvoiceId}</strong>
                    <p>{formatPricingDate(invoice.paidAt ?? invoice.issuedAt)} · {invoice.status}</p>
                  </div>
                  <strong>
                    {formatInvoiceAmount(
                      invoice.amountPaid > 0 ? invoice.amountPaid : invoice.amount,
                      invoice.currency,
                    )}
                  </strong>
                  {invoice.shortUrl ? (
                    <Button
                      variant="outline"
                      onClick={() => openInvoiceView(invoice)}
                      aria-label={`View invoice ${invoice.razorpayInvoiceId}`}
                    >
                      <ExternalLink size={16} aria-hidden />
                      View invoice
                    </Button>
                  ) : (
                    <span className="cc-muted">View link unavailable</span>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
export function PricingRegulatoryDisclaimers() {
  return (
    <div className="pricing-billing__disclaimer-grid">
      <div className="pricing-billing__disclaimer-panel">
        <h5>Founder&apos;s Beta Terms</h5>
        <ul>
          {FOUNDERS_BETA_TERMS.map((term) => (
            <li key={term}>
              <span style={{ color: "var(--color-primary)" }} aria-hidden>
                •
              </span>
              {term}
            </li>
          ))}
        </ul>
      </div>
      <div className="pricing-billing__disclaimer-panel">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <h5 style={{ margin: 0 }}>Your Data Security</h5>
          <div style={{ display: "flex", gap: "0.25rem", color: "var(--color-primary)" }}>
            <Shield size={18} aria-hidden />
            <Sparkles size={18} aria-hidden />
          </div>
        </div>
        <ul>
          {DATA_SECURITY_POINTS.map((point) => (
            <li key={point}>
              <span style={{ color: "var(--color-primary)" }} aria-hidden>
                •
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
