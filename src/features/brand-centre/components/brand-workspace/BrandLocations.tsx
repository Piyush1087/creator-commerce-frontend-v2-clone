import type { BrandWorkspaceProjection } from "../../contracts/brand-centre-brand.contracts";
import { authorityCopy } from "../../adapters/brand-field-state";

export function BrandLocations({
  locations,
}: {
  locations: BrandWorkspaceProjection["locations"];
}) {
  if (locations.length === 0) return <p>No current Locations.</p>;
  return (
    <div className="brand-workspace-locations">
      {locations.map((location) => (
        <article
          key={location.locationId}
          data-location-id={location.locationId}
        >
          <h3>{location.name || "Location"}</h3>
          <p>
            {[location.address, location.city, location.zip]
              .filter(Boolean)
              .join(", ")}
          </p>
          {location.lifecycle === "INACTIVE" ? <p>Inactive</p> : null}
          {authorityCopy[location.authority] ? (
            <p className="brand-workspace-field__meta">
              {authorityCopy[location.authority]}
            </p>
          ) : null}
          {location.observationFreshness === "POSSIBLY_STALE" ? (
            <p className="brand-workspace-field__meta">May need updating</p>
          ) : null}
          {location.reconciliationState === "AMBIGUOUS" ? (
            <p className="brand-workspace-field__meta">
              Location details may need review.
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
