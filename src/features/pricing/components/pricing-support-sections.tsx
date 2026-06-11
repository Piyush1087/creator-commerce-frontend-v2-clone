import { ChevronDown, CreditCard, ExternalLink, Info, Receipt, Shield, Sparkles } from "lucide-react";
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

type CollapsibleId = "billing" | "invoices";

export function PricingBillingDetailsSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="brand-settings__collapsible">
      <button
        type="button"
        className="brand-settings__collapsible-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
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
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
          aria-hidden
        />
      </button>
      {open ? (
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
  );
}

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
          <h2 className="brand-settings__collapsible-title">Invoice History</h2>
          <p className="brand-settings__collapsible-desc">Download your past invoices</p>
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
          <div className="pricing-billing__invoice-table-wrap">
            <table className="pricing-billing__invoice-table">
              <thead>
                <tr>
                  <th>Invoice Date</th>
                  <th>Transaction ID</th>
                  <th style={{ textAlign: "right" }}>Billing Base Rate</th>
                  <th style={{ textAlign: "right" }}>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="pricing-billing__invoice-empty">
                      {EMPTY_DISPLAY} — No invoices available yet. Invoices appear after your
                      first Razorpay subscription charge.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.razorpayInvoiceId}>
                      <td>
                        {formatPricingDate(invoice.paidAt ?? invoice.issuedAt)}
                      </td>
                      <td>{invoice.invoiceNumber ?? invoice.razorpayInvoiceId}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatInvoiceAmount(
                          invoice.amountPaid > 0 ? invoice.amountPaid : invoice.amount,
                          invoice.currency,
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Button
                          variant="outline"
                          onClick={() => openInvoiceView(invoice)}
                          disabled={!invoice.shortUrl}
                          aria-label={`View invoice ${invoice.razorpayInvoiceId}`}
                        >
                          <ExternalLink size={16} aria-hidden />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

export function PricingFeatureTeasers() {
  return (
    <div className="pricing-billing__teasers">
      <div className="pricing-billing__teaser">
        <Sparkles size={32} color="var(--color-primary)" aria-hidden />
        <div>
          <h4>AI Spend Optimizer</h4>
          <p>
            Let CreatorHub AI analyze your collaboration fees to find saving opportunities based
            on your campaign frequency.
          </p>
        </div>
      </div>
      <div className="pricing-billing__teaser">
        <CreditCard size={32} color="var(--color-secondary)" aria-hidden />
        <div>
          <h4>Payment Methods</h4>
          <p>
            Add a backup payment method to ensure uninterrupted access to your enterprise
            dashboard features.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PricingAiDisclaimer() {
  return (
    <footer className="pricing-billing__ai-disclaimer">
      <Info size={20} color="var(--color-primary)" aria-hidden />
      <p style={{ margin: 0 }}>
        <strong
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginRight: "0.5rem",
          }}
        >
          AI Disclaimer:
        </strong>
        Phase 2 Deep Intel is generated by AI. While we strive for 99% accuracy in Brand DNA
        extraction, please verify strategic insights before executing high-spend campaigns.
      </p>
    </footer>
  );
}
