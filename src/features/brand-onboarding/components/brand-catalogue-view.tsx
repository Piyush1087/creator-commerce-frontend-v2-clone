import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Pencil, Plus, Undo2, X } from "lucide-react";

import { Alert, Badge, Button, Card, TextField } from "../../../design-system/aurora";

import { getBrandProfile, syncBrandOfferings, uploadOfferingImage } from "../api/brand-client";
import { uploadErrorMessage } from "../api/http-api-error";
import { BrandImageAvatar } from "./brand-image-avatar";
import type { BrandProfileResponseBody } from "../contracts/brand.contracts";
import { ONBOARDING_ROUTES } from "../constants";
import {
  mapCatalogueToSyncOfferings,
  mapOfferingsToCatalogue,
  parseHostnameFromUrl,
} from "../mappers/map-brand-profile";
import { catalogueOfferingSchema, zodFirstError } from "../schemas/brand-dna-schema";
import { loadBrandOnboardingSession } from "../session/onboarding-session";
import { fileToBase64 } from "../utils/image-upload";
import { hostnameBelongsToBrand } from "../utils/normalize-catalogue-url";
import type { CatalogueProduct } from "../types";

export function BrandCatalogueView() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<BrandProfileResponseBody | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [removed, setRemoved] = useState<CatalogueProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CatalogueProduct | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<{
    productId: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

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

  const persistProducts = async (nextProducts: CatalogueProduct[]) => {
    const session = loadBrandOnboardingSession();
    if (!session) {
      setError("Missing onboarding session.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const updated = await syncBrandOfferings(
        session.brandProfileId,
        mapCatalogueToSyncOfferings(nextProducts),
      );
      setProfile(updated);
      setProducts(mapOfferingsToCatalogue(updated.offerings));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save catalogue changes.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const next = products.filter((item) => item.id !== id);
    setProducts(next);
    setRemoved(product);
    await persistProducts(next);
  };

  const openAdd = () => {
    setModalError(null);
    setError(null);
    setAdding(true);
  };

  const closeAdd = () => {
    setAdding(false);
    setModalError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setModalError(null);
  };

  const handleAdd = async () => {
    setModalError(null);
    const parsed = catalogueOfferingSchema.safeParse({
      name: newName.trim(),
      url: newUrl.trim(),
      type: "PRODUCT",
    });
    if (!parsed.success) {
      setModalError(zodFirstError(parsed.error));
      return;
    }
    try {
      const url = new URL(parsed.data.url);
      const host = url.hostname.replace(/^www\./, "");
      if (!hostnameBelongsToBrand(host, rootDomain)) {
        setModalError(`You can only add products from ${rootDomain}.`);
        return;
      }
      const next: CatalogueProduct = {
        id: `manual-${Date.now()}`,
        name: parsed.data.name,
        description: parsed.data.description,
        category: "Top Seller",
        url: parsed.data.url,
      };
      const merged = [next, ...products];
      setProducts(merged);
      closeAdd();
      setNewUrl("");
      setNewName("");
      await persistProducts(merged);
    } catch {
      setModalError("Enter a valid product URL.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) {
      return;
    }
    setModalError(null);
    const parsed = catalogueOfferingSchema.safeParse({
      name: editing.name,
      url: editing.url,
      description: editing.description ?? "",
      imageUrl: editing.image?.trim() ? editing.image : null,
      type: "PRODUCT",
    });
    if (!parsed.success) {
      setModalError(zodFirstError(parsed.error));
      return;
    }
    try {
      const url = new URL(parsed.data.url);
      const host = url.hostname.replace(/^www\./, "");
      if (!hostnameBelongsToBrand(host, rootDomain)) {
        setModalError(`You can only add products from ${rootDomain}.`);
        return;
      }
    } catch {
      setModalError("Enter a valid product URL.");
      return;
    }
    const merged = products.map((item) =>
      item.id === editing.id
        ? {
            ...editing,
            name: parsed.data.name,
            url: parsed.data.url,
            description: parsed.data.description,
          }
        : item,
    );
    setProducts(merged);
    closeEdit();
    await persistProducts(merged);
  };

  const handleContinue = () => {
    if (visibleProducts.length === 0) {
      setError("Add at least 1 product before continuing.");
      return;
    }
    setError(null);
    navigate(ONBOARDING_ROUTES.competitors);
  };

  const handleImageUpload = async (
    offeringId: string,
    file: File | undefined,
  ) => {
    const session = loadBrandOnboardingSession();
    if (!session || !file) {
      return;
    }
    setIsSaving(true);
    setImageUploadError(null);
    try {
      const base64 = await fileToBase64(file);
      const uploaded = await uploadOfferingImage(session.brandProfileId, offeringId, {
        imageBase64: base64,
        contentType: file.type || "image/jpeg",
      });
      const merged = products.map((item) =>
        item.id === offeringId ? { ...item, image: uploaded.imageUrl } : item,
      );
      setProducts(merged);
      if (editing?.id === offeringId) {
        setEditing({ ...editing, image: uploaded.imageUrl });
      }
    } catch (err) {
      setImageUploadError({
        productId: offeringId,
        message: uploadErrorMessage(err),
      });
    } finally {
      setIsSaving(false);
      setUploadTargetId(null);
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
        <Button type="button" variant="primary" onClick={openAdd}>
          <Plus size={16} aria-hidden /> Add product URL
        </Button>
        <Badge tone="pending">{isSaving ? "Saving…" : "Editable catalogue"}</Badge>
      </div>

      {!isLoading && !loadError && visibleProducts.length === 0 ? (
        <Alert title="No products yet" tone="warning">
          Add at least 1 product before continuing.
        </Alert>
      ) : null}

      {error ? (
        <Alert title="Catalogue validation" tone="error">
          {error}
        </Alert>
      ) : null}
      {removed ? (
        <Alert title="Product removed" tone="warning">
          <button
            className="bob-link-button"
            type="button"
            onClick={() => {
              void (async () => {
                const merged = [removed, ...products];
                setProducts(merged);
                setRemoved(null);
                await persistProducts(merged);
              })();
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalError(null);
                  setEditing(product);
                }}
              >
                <Pencil size={14} aria-hidden /> Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setUploadTargetId(product.id);
                  setImageUploadError(null);
                  fileInputRef.current?.click();
                }}
              >
                Upload image
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={() => void handleRemove(product.id)}
              >
                Remove
              </Button>
            </div>
            {imageUploadError?.productId === product.id ? (
              <p className="bob-upload-error" role="alert">
                {imageUploadError.message}
              </p>
            ) : null}
          </Card>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (uploadTargetId) {
            void handleImageUpload(uploadTargetId, file);
          }
          event.currentTarget.value = "";
        }}
      />

      <div className="bob-inline" style={{ marginTop: 24 }}>
        <Button
          type="button"
          variant="primary"
          disabled={
            isSaving ||
            isLoading ||
            Boolean(loadError) ||
            visibleProducts.length === 0
          }
          onClick={handleContinue}
        >
          Continue to competitors
        </Button>
      </div>

      {adding ? (
        <div className="bob-modal-backdrop" role="presentation">
          <div className="bob-small-dialog" role="dialog" aria-modal="true">
            <div className="bob-funnel-page__header">
              <h2 className="aurora-card__title">Add product</h2>
              <button
                type="button"
                className="bob-icon-button"
                aria-label="Close add product"
                onClick={closeAdd}
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
              label="Product name"
              value={newName}
              placeholder="Product name"
              onChange={(event) => {
                setNewName(event.target.value);
                setModalError(null);
              }}
            />
            <TextField
              label="Product URL"
              value={newUrl}
              placeholder={`https://${rootDomain}/products/...`}
              onChange={(event) => {
                setNewUrl(event.target.value);
                setModalError(null);
              }}
            />
            {modalError ? (
              <p className="bob-upload-error" role="alert">
                {modalError}
              </p>
            ) : null}
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button type="button" variant="primary" disabled={isSaving} onClick={() => void handleAdd()}>
                Save product
              </Button>
              <Button type="button" variant="secondary" onClick={closeAdd}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="bob-modal-backdrop" role="presentation">
          <div className="bob-small-dialog" role="dialog" aria-modal="true">
            <div className="bob-funnel-page__header">
              <h2 className="aurora-card__title">Edit product</h2>
              <button
                type="button"
                className="bob-icon-button"
                aria-label="Close edit product"
                onClick={closeEdit}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <TextField
              label="Product name"
              value={editing.name}
              onChange={(event) => {
                setEditing({ ...editing, name: event.target.value });
                setModalError(null);
              }}
            />
            <TextField
              label="Product URL"
              value={editing.url}
              onChange={(event) => {
                setEditing({ ...editing, url: event.target.value });
                setModalError(null);
              }}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={editing.description ?? ""}
              onChange={(event) => {
                setEditing({ ...editing, description: event.target.value });
                setModalError(null);
              }}
            />
            {modalError ? (
              <p className="bob-upload-error" role="alert">
                {modalError}
              </p>
            ) : null}
            <div className="bob-inline" style={{ marginTop: 16 }}>
              <Button
                type="button"
                variant="primary"
                disabled={isSaving}
                onClick={() => void handleSaveEdit()}
              >
                Save changes
              </Button>
              <Button type="button" variant="secondary" onClick={closeEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
