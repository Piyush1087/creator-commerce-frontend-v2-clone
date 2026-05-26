import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Package, Plus, Undo2, X } from "lucide-react";

import { Alert, Badge, Button, Card, TextField } from "../../../design-system/aurora";

import { getBrandProfile } from "../api/brand-client";
import { BrandImageAvatar } from "./brand-image-avatar";
import type { BrandProfileResponseBody } from "../contracts/brand.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import { mapOfferingsToCatalogue, parseHostnameFromUrl } from "../mappers/map-brand-profile";
import { loadBrandOnboardingSession } from "../session/onboarding-session";
import type { CatalogueProduct } from "../types";

export function BrandCatalogueView() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BrandProfileResponseBody | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [removed, setRemoved] = useState<CatalogueProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = loadBrandOnboardingSession();
    if (!session) {
      setLoadError("Missing onboarding session. Go back and run a scan.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getBrandProfile(session.brandProfileId)
      .then((p) => {
        setProfile(p);
        setProducts(mapOfferingsToCatalogue(p.offerings));
        setLoadError(null);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Unable to load catalogue data.";
        setLoadError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const rootDomain = useMemo(() => {
    const session = loadBrandOnboardingSession();
    const host = session ? parseHostnameFromUrl(session.normalizedUrl) : "";
    return host.length > 0 ? host : profile?.domain ?? "your-domain.com";
  }, [profile?.domain]);

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
      if (!host.includes(rootDomain)) {
        setError(`You can only add products from ${rootDomain}.`);
        return;
      }
      const next: CatalogueProduct = {
        id: `manual-${Date.now()}`,
        name: "Preview & Edit Product",
        description: "Manual add (not persisted yet).",
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
            {isLoading
              ? "Loading offerings from your latest scan…"
              : `Products are locked to your scanned domain: ${rootDomain}`}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {loadError ? (
        <Alert title="Couldn’t load catalogue" tone="error">
          {loadError}
        </Alert>
      ) : null}

      <div className="bob-inline" style={{ marginBottom: 16 }}>
        <Button type="button" variant="primary" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden /> Add product URL
        </Button>
        <Badge tone="pending">API-backed offerings</Badge>
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
            <BrandImageAvatar
              className="bob-catalogue-card__image"
              src={product.image}
              label={product.name}
              alt={product.name}
              size={120}
            />
            <p className="bob-muted" style={{ fontSize: "var(--size-caption)" }}>
              {product.url}
            </p>
            {product.description ? <p>{product.description}</p> : null}
            {product.price ? <p className="bob-muted">Price: {product.price}</p> : null}
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
        <p className="bob-muted" style={{ marginTop: 8 }}>
          Promotional bundles are not returned by the surface-scan API yet. This section is
          reserved for a future catalogue extension.
        </p>
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
                Root domain gate is locked to {rootDomain}.
              </p>
            </div>
            <TextField
              label="Offering URL"
              value={newUrl}
              placeholder={`https://${rootDomain}/products/...`}
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
