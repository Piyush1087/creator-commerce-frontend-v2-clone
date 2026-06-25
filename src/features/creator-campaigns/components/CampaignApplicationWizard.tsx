import { useState } from "react";
import { X } from "lucide-react";

import { Alert, Button } from "../../../design-system/aurora";
import { postCreatorApply } from "../../creator-uce/api/creator-uce-client";
import type { MarketplaceDetailResponse } from "../contracts/creator-campaigns.contracts";
import { displayValue } from "../utils/display-value";
import { OptionalMedia } from "./OptionalMedia";

import "../creator-campaigns.css";

type CampaignApplicationWizardProps = {
  detail: MarketplaceDetailResponse;
  onClose: () => void;
  onSubmitted: () => void;
};

type WizardStep = 1 | 2 | 3;

export function CampaignApplicationWizard({
  detail,
  onClose,
  onSubmitted,
}: CampaignApplicationWizardProps) {
  const { campaign, products, briefs } = detail;
  const inStockProducts = products.filter((p) => !p.out_of_stock);

  const [step, setStep] = useState<WizardStep>(1);
  const [productId, setProductId] = useState(inStockProducts[0]?.product_id ?? "");
  const [briefId, setBriefId] = useState(briefs[0]?.brief_id ?? "");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.product_id === productId);

  const handleSubmit = async () => {
    if (!briefId) {
      setSubmitError("Select a creative track before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await postCreatorApply(campaign.campaign_id, {
        brief_id: briefId,
        ...(productId ? { product_id: productId } : {}),
      });
      onSubmitted();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Application failed. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cc-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cc-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cc-wizard__header">
          <div>
            <h2 id="cc-wizard-title" className="cc-page-title" style={{ fontSize: 20 }}>
              Apply to {displayValue(campaign.campaign_name)}
            </h2>
            <p className="cc-muted">Step {step} of 3</p>
          </div>
          <button
            type="button"
            className="aurora-button aurora-button--ghost aurora-button--sm"
            onClick={onClose}
            aria-label="Close application wizard"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="cc-wizard__steps" aria-hidden>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`cc-wizard__step ${step >= n ? "cc-wizard__step--active" : ""}`}
            />
          ))}
        </div>

        <div className="cc-wizard__body">
          {submitError ? (
            <div className="cc-alert-block">
              <Alert tone="error" title="Application failed">
                {submitError}
              </Alert>
            </div>
          ) : null}

          {step === 1 ? (
            <>
              <h3 className="cc-wizard-step-title">Select product</h3>
              <p className="cc-muted">Choose the sample or SKU you want to feature.</p>
              {products.length === 0 ? (
                <p className="cc-muted">-</p>
              ) : (
                products.map((product) => (
                  <button
                    key={product.product_id}
                    type="button"
                    disabled={product.out_of_stock}
                    className={[
                      "cc-product-tile",
                      productId === product.product_id ? "cc-product-tile--selected" : "",
                      product.out_of_stock ? "cc-product-tile--disabled" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      if (product.out_of_stock) return;
                      setProductId(product.product_id);
                    }}
                  >
                    <OptionalMedia
                      src={product.image_url}
                      className="cc-product-tile__img"
                      placeholderClassName="cc-media-placeholder cc-product-tile__img"
                    />
                    <div>
                      <strong>{displayValue(product.product_name)}</strong>
                      <p className="cc-muted" style={{ margin: "4px 0 0" }}>
                        Inventory: {displayValue(product.inventory_count)} ·{" "}
                        {product.out_of_stock ? "Out of stock" : "In stock"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h3 className="cc-wizard-step-title">Select creative track</h3>
              <p className="cc-muted">
                Tracks for {displayValue(selectedProduct?.product_name)}.
              </p>
              {briefs.length === 0 ? (
                <p className="cc-muted">-</p>
              ) : (
                briefs.map((brief) => (
                  <button
                    key={brief.brief_id}
                    type="button"
                    className={[
                      "cc-product-tile",
                      briefId === brief.brief_id ? "cc-product-tile--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setBriefId(brief.brief_id)}
                  >
                    <div>
                      <strong>{displayValue(brief.internal_title)}</strong>
                      <p className="cc-muted" style={{ margin: "4px 0 0" }}>
                        Formats: {displayValue(brief.deliverable_format_tags)} · Platforms:{" "}
                        {displayValue(brief.required_platforms)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3 className="cc-wizard-step-title">Terms & escrow lock</h3>
              <p className="cc-muted">
                Review compensation and usage rights before submitting to the brand review queue.
              </p>
              <div className="cc-detail-panel cc-detail-panel--flat">
                <p className="cc-wizard-terms">
                  By submitting, you agree to escrow milestone terms, brand safety review, and
                  deliverable timelines for {displayValue(campaign.brand_name)}.
                </p>
              </div>
              <label className="cc-wizard-checkbox">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>I accept the campaign collaboration terms and escrow structure.</span>
              </label>
            </>
          ) : null}
        </div>

        <footer className="cc-wizard__footer">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as WizardStep)}
              disabled={submitting}
            >
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          )}
          {step < 3 ? (
            <Button
              variant="primary"
              disabled={(step === 1 && !productId && products.length > 0) || (step === 2 && !briefId)}
              onClick={() => setStep((s) => (s + 1) as WizardStep)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!termsAccepted || submitting || !briefId}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
