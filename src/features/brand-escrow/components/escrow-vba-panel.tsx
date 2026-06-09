import { Building2, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";

import type { EscrowVaultApiResponse } from "../contracts/escrow.contracts";
import { displayText } from "../utils/display-value";

type EscrowVbaPanelProps = {
  vault: EscrowVaultApiResponse | null;
  defaultExpanded?: boolean;
  accordionTitle?: string;
};

async function copyText(value: string) {
  if (!value || value === "—") {
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* clipboard unavailable */
  }
}

export function EscrowVbaPanel({
  vault,
  defaultExpanded = false,
  accordionTitle = "Virtual Account Transfer Credentials (NEFT / RTGS / IMPS)",
}: EscrowVbaPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const van = displayText(vault?.virtual_account_number);
  const ifsc = displayText(vault?.ifsc_code);
  const bankName = displayText(vault?.bank_name);

  return (
    <div className="brand-escrow-vba">
      <button
        type="button"
        className="brand-escrow-vba__trigger"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className="brand-escrow-vba__trigger-label">
          <Building2 size={20} color="#006c4b" aria-hidden />
          {accordionTitle}
        </span>
        <ChevronDown
          size={20}
          style={{
            transform: expanded ? "rotate(180deg)" : undefined,
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="brand-escrow-vba__body">
          <p
            style={{
              margin: "0 0 1rem",
              fontFamily: "var(--font-body)",
              fontSize: "var(--size-body)",
              color: "var(--text-muted)",
            }}
          >
            Execute direct corporate net-banking transfers from your firm&apos;s bank
            account to credit your platform balance automatically. Bank wire methods
            incur zero processing surcharges.
          </p>
          <div className="brand-escrow-vba__grid">
            <div className="brand-escrow-vba__field">
              <p className="brand-escrow-vba__field-label">Beneficiary Name</p>
              <p className="brand-escrow-vba__field-value">{displayText(null)}</p>
            </div>
            <div className="brand-escrow-vba__field">
              <p className="brand-escrow-vba__field-label">Virtual Account Number (VAN)</p>
              <div className="brand-escrow-vba__copy-row">
                <p className="brand-escrow-vba__field-value" style={{ fontWeight: 700 }}>
                  {van}
                </p>
                {van !== "—" ? (
                  <button
                    type="button"
                    className="brand-escrow-vba__copy-btn"
                    aria-label="Copy virtual account number"
                    onClick={() => void copyText(van)}
                  >
                    <Copy size={18} />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="brand-escrow-vba__field">
              <p className="brand-escrow-vba__field-label">IFSC Code</p>
              <div className="brand-escrow-vba__copy-row">
                <p className="brand-escrow-vba__field-value" style={{ fontWeight: 700 }}>
                  {ifsc}
                </p>
                {ifsc !== "—" ? (
                  <button
                    type="button"
                    className="brand-escrow-vba__copy-btn"
                    aria-label="Copy IFSC code"
                    onClick={() => void copyText(ifsc)}
                  >
                    <Copy size={18} />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="brand-escrow-vba__field">
              <p className="brand-escrow-vba__field-label">Bank Name Partner Node</p>
              <p className="brand-escrow-vba__field-value">{bankName}</p>
            </div>
            <div className="brand-escrow-vba__field">
              <p className="brand-escrow-vba__field-label">Razorpay Virtual Account ID</p>
              <p className="brand-escrow-vba__field-value">
                {displayText(vault?.razorpay_virtual_account_id)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
