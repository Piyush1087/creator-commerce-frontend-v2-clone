import { useEffect, useRef, useState } from "react";

import { env } from "../../../shared/config/env";
import type { CampaignAudienceGeography } from "../types/campaign-wizard";

type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type GooglePlace = {
  displayName?: string;
  formattedAddress?: string;
  types?: string[];
  addressComponents?: GoogleAddressComponent[];
  fetchFields: (options: { fields: string[] }) => Promise<void>;
};

type PlacePrediction = { toPlace: () => GooglePlace };

type GoogleMapsWindow = Window & {
  google?: {
    maps: {
      importLibrary: (name: string) => Promise<Record<string, unknown>>;
    };
  };
};

let mapsLoader: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  const win = window as GoogleMapsWindow;
  if (win.google?.maps?.importLibrary) return Promise.resolve();
  if (mapsLoader) return mapsLoader;

  mapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-campaign-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.campaignGoogleMaps = "true";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not be loaded."));
    document.head.appendChild(script);
  });

  return mapsLoader;
}

function component(place: GooglePlace, type: string, short = false): string | null {
  const match = place.addressComponents?.find((item) => item.types?.includes(type));
  const value = short ? match?.shortText : match?.longText;
  return value?.trim() || null;
}

function normalizePlace(place: GooglePlace): CampaignAudienceGeography {
  const types = place.types ?? [];
  const countryCode = component(place, "country", true)?.toUpperCase() ?? null;
  const locality =
    component(place, "locality") ??
    component(place, "postal_town") ??
    component(place, "administrative_area_level_2");
  const region = component(place, "administrative_area_level_1");

  let scope: CampaignAudienceGeography["scope"] = "LOCALITY";
  if (types.includes("country")) scope = "COUNTRY";
  else if (types.includes("administrative_area_level_1") || types.includes("administrative_area_level_2")) scope = "REGION";

  return {
    scope,
    label: place.formattedAddress?.trim() || place.displayName?.trim() || locality || region || countryCode || "Selected location",
    country_code: scope === "GLOBAL" ? null : countryCode,
    locality: scope === "LOCALITY" ? locality : null,
    region: scope === "REGION" || scope === "LOCALITY" ? region : null,
    radius_km: null,
    is_primary: true,
  };
}

const GLOBAL_GEOGRAPHY: CampaignAudienceGeography = {
  scope: "GLOBAL",
  label: "Global",
  country_code: null,
  locality: null,
  region: null,
  radius_km: null,
  is_primary: true,
};

export function AudienceGeographyPicker({
  value,
  onChange,
  onBlur,
}: {
  value: CampaignAudienceGeography[];
  onChange: (next: CampaignAudienceGeography[]) => void;
  onBlur?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const globalSelected = value.some((item) => item.scope === "GLOBAL");

  useEffect(() => {
    let cancelled = false;
    let autocomplete: HTMLElement | null = null;

    if (!env.googleMapsApiKey) {
      setError("Google Maps Places is not configured. Set VITE_GOOGLE_MAPS_API_KEY before publishing a Campaign.");
      return;
    }

    void (async () => {
      try {
        await loadGoogleMaps(env.googleMapsApiKey);
        const win = window as GoogleMapsWindow;
        const places = await win.google!.maps.importLibrary("places") as {
          PlaceAutocompleteElement?: new (options?: Record<string, unknown>) => HTMLElement;
        };
        if (cancelled || !hostRef.current || !places.PlaceAutocompleteElement) return;

        autocomplete = new places.PlaceAutocompleteElement({});
        autocomplete.setAttribute("aria-label", "Search audience geography");
        autocomplete.addEventListener("gmp-select", ((event: Event) => {
          void (async () => {
            try {
              const prediction = (event as Event & { placePrediction?: PlacePrediction }).placePrediction;
              if (!prediction) return;
              const place = prediction.toPlace();
              await place.fetchFields({ fields: ["displayName", "formattedAddress", "types", "addressComponents"] });
              const normalized = normalizePlace(place);
              onChange([
                ...value.filter((item) => item.scope !== "GLOBAL" && item.label !== normalized.label),
                normalized,
              ]);
              setError(null);
            } catch {
              setError("That location could not be normalized. Please select another Google Places result.");
            }
          })();
        }) as EventListener);
        hostRef.current.replaceChildren(autocomplete);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Google Maps could not be loaded.");
      }
    })();

    return () => {
      cancelled = true;
      autocomplete?.remove();
    };
  }, [onChange, value]);

  return (
    <div className="cw-canonical-picker" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onBlur?.();
    }}>
      <div className="cw-format-chips" style={{ paddingLeft: 0 }}>
        {value.map((item) => (
          <button
            key={`${item.scope}:${item.label}`}
            type="button"
            className="cw-format-chip is-active"
            onClick={() => onChange(value.filter((candidate) => candidate !== item))}
          >
            {item.label} ×
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`cw-format-chip ${globalSelected ? "is-active" : ""}`}
        onClick={() => onChange(globalSelected ? [] : [GLOBAL_GEOGRAPHY])}
      >
        Global
      </button>

      {!globalSelected ? <div ref={hostRef} className="cw-google-place-host" /> : null}
      {error ? <p className="cw-field-error" role="alert">{error}</p> : null}
      <p className="cw-hint">Choose Google Places results. City inputs are stored as locality; multiple selections represent multi-location targeting.</p>
    </div>
  );
}
