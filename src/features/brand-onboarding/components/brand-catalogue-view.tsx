import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Package, Plus, Undo2, X } from "lucide-react";

import { Alert, Badge, Button, Card, TextField } from "../../../design-system/aurora";

import { ONBOARDING_ROUTES } from "../constants";
import {
  CATALOGUE_ROOT_DOMAIN,
  INITIAL_CATALOGUE_OFFERS,
  INITIAL_CATALOGUE_PRODUCTS,
} from "../mock-data/catalogue-mock";
import type { CatalogueProduct } from "../types";

export function BrandCatalogueView() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogueProduct[]>(
    INITIAL_CATALOGUE_PRODUCTS,
  );
  const [removed, setRemoved] = useState<CatalogueProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const visibleProducts = products.filter((product) => product.category !== "Collection");

  const handleRemove = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setProducts((prev) => prev.filter((item) => item.id !== id));
    setRemoved(product);
  };

  const handleAdd = () => {
    setError(null);
    try {
      const parsed = new URL(newUrl);
      const host = parsed.hostname.replace(/^www\./, "");
      if (!host.includes(CATALOGUE_ROOT_DOMAIN)) {
        setError(`You can only add products from ${CATALOGUE_ROOT_DOMAIN}.`);
        return;
      }
      const next: CatalogueProduct = {
        id: `manual-${Date.now()}`,
        name: "Preview & Edit Product",
        description: "Mock mini-scan result. Confirming would save this later.",
        category: "Top Seller",
        url: newUrl,
      };
      setProducts((prev) => [next, ...prev]);
      setAdding(false);
      setNewUrl("");
    } catch {
      setError("Enter a valid product URL.");
    }
  };

  return (
    <div className="bob-funnel-page bob-container">
      <div className="bob-funnel-page__header">
        <div>
          <h1 className="aurora-card__title" style={{ fontSize: "var(--size-h1)" }}>
            Product catalogue
          </h1>
          <p className="bob-muted">
            Mock products locked to{" "}
            <strong>{CATALOGUE_ROOT_DOMAIN}</strong> (prototype sample).
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="bob-inline" style={{ marginBottom: 16 }}>
        <Button type="button" variant="primary" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden /> Add product URL
        </Button>
        <Badge tone="pending">D2C product cards</Badge>
      </div>

      {error ? (
        <Alert title="Domain lock" tone="error">
          {error}
        </Alert>
      ) : null}
      {removed ? (
        <Alert title="Product removed" tone="warning">
          <button
            className="bob-link-button"
            type="button"
            onClick={() => {
              setProducts((prev) => [removed, ...prev]);
              setRemoved(null);
            }}
          >
            <Undo2 size={14} aria-hidden /> Undo remove
          </button>
        </Alert>
      ) : null}

      <div className="bob-grid-cap">
        {visibleProducts.map((product) => (
          <Card key={product.id} title={product.name} eyebrow={product.category}>
            {product.image ? (
              <img
                src={product.image}
                alt=""
                style={{
                  width: "100%",
                  borderRadius: "var(--radius-card-compact)",
                  marginBottom: 12,
                }}
              />
            ) : null}
            <p className="bob-muted" style={{ fontSize: "var(--size-caption)" }}>
              {product.url}
            </p>
            {product.description ? <p>{product.description}</p> : null}
            <div className="bob-inline" style={{ marginTop: 12 }}>
              <Button type="button" variant="ghost">
                <ExternalLink size={14} aria-hidden /> View URL
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleRemove(product.id)}>
                Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <section style={{ marginTop: 32 }}>
        <h2 className="aurora-card__title" style={{ fontSize: "var(--size-h2)" }}>
          Offers &amp; promos
        </h2>
        <div className="bob-stack" style={{ marginTop: 12 }}>
          {INITIAL_CATALOGUE_OFFERS.map((offer) => (
            <Card
              key={offer.id}
              title={offer.title}
              eyebrow={offer.type}
              action={<Badge tone="success">{offer.code}</Badge>}
            >
              <p className="bob-muted">{offer.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="bob-inline" style={{ marginTop: 24 }}>
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate(ONBOARDING_ROUTES.competitors)}
        >
          Continue to competitors
        </Button>
      </div>

      {adding ? (
        <div className="bob-modal-backdrop" role="presentation">
          <div className="bob-small-dialog" role="dialog" aria-modal="true">
            <div className="bob-funnel-page__header">
              <h2 className="aurora-card__title">Add product mini-scan</h2>
              <button
                type="button"
                className="bob-icon-button"
                aria-label="Close add product"
                onClick={() => setAdding(false)}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="bob-inline" style={{ marginBottom: 12 }}>
              <Package size={18} color="var(--color-primary)" aria-hidden />
              <p className="bob-muted" style={{ margin: 0 }}>
                Root domain gate is locked to {CATALOGUE_ROOT_DOMAIN}.
              </p>
            </div>
            <TextField
              label="Offering URL"
              value={newUrl}
              placeholder={`https://${CATALOGUE_ROOT_DOMAIN}/products/...`}
              onChange={(event) => setNewUrl(event.target.value)}
            />
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button type="button" variant="primary" onClick={handleAdd}>
                Scan URL
              </Button>
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
