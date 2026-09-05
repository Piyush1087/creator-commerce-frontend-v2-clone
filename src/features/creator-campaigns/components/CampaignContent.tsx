import type { z } from "zod";
import { Badge } from "../../../design-system/aurora";
import type {
  Asset,
  Json,
  commercialSchema,
  definitionSchema,
} from "../contracts/c03.contracts";
import { OptionalMedia } from "./OptionalMedia";

export function SafeReference({ value }: { value: string | null }) {
  if (!value) return <span>Not provided</span>;
  let safe = false;
  try {
    safe = ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    /* Plain authored text remains readable. */
  }
  return safe ? (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
    >
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );
}
export function AuthoredContent({ value }: { value: Json }) {
  if (value === null) return <p className="cc-muted">Not provided</p>;
  if (Array.isArray(value))
    return value.length ? (
      <ul>
        {value.map((item, index) => (
          <li key={index}>
            <AuthoredContent value={item} />
          </li>
        ))}
      </ul>
    ) : (
      <p className="cc-muted">None provided</p>
    );
  if (typeof value === "object")
    return (
      <dl className="c03-definition">
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt>
              {key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")}
            </dt>
            <dd>
              <AuthoredContent value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return (
    <p className="c03-prose">
      {typeof value === "string" ? (
        <SafeReference value={value} />
      ) : (
        String(value)
      )}
    </p>
  );
}
export function DateValue({ value }: { value: string | null }) {
  return value ? (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))}
    </time>
  ) : (
    <>Not provided</>
  );
}
export function CommercialContent({
  commercial,
}: {
  commercial: z.infer<typeof commercialSchema> | { state: "UNAVAILABLE" };
}) {
  return (
    <section className="cc-detail-panel">
      <h2>Commercial terms &amp; Brand support</h2>
      {"state" in commercial ? (
        <p>Commercial terms unavailable</p>
      ) : (
        <>
          <Badge tone="selected">
            {commercial.compensationModel === "FIXED"
              ? "Fixed offer"
              : "Negotiable offer"}
          </Badge>
          <p className="c03-commercial">
            {commercial.currency} {commercial.offer}
          </p>
          <p>
            {commercial.receivesBrandSupport
              ? `Brand support: ${commercial.brandSupportType ?? "Type not provided"}`
              : "No Brand support"}
          </p>
          {commercial.receivesBrandSupport && (
            <p>
              Estimated support value:{" "}
              {commercial.brandSupportEstimatedValue === null
                ? "Not provided"
                : `${commercial.currency} ${commercial.brandSupportEstimatedValue}`}
            </p>
          )}
        </>
      )}
    </section>
  );
}
export function assetName(asset: Pick<Asset, "kind" | "offering" | "offer">) {
  return asset.kind === "BRAND"
    ? "Brand"
    : asset.kind === "OFFERING"
      ? (asset.offering?.name ?? "Offering")
      : (asset.offer?.offerName ?? "Offer");
}
export function AssetContent({
  asset,
}: {
  asset: Pick<Asset, "kind" | "offering" | "offer">;
}) {
  return (
    <div className="c03-content">
      <h3>{assetName(asset)}</h3>
      <OptionalMedia
        src={asset.offering?.imageUrl}
        alt=""
        className="cc-detail-product-thumb"
        placeholderClassName="cc-media-placeholder cc-detail-product-thumb"
      />
      <p>
        {asset.kind === "BRAND"
          ? "Create for the Brand."
          : (asset.offering?.description ??
            asset.offer?.description ??
            "Description not provided")}
      </p>
      {(asset.offering?.url || asset.offer?.entityLink) && (
        <SafeReference
          value={asset.offering?.url ?? asset.offer?.entityLink ?? null}
        />
      )}
    </div>
  );
}
export function BriefContent({
  definition,
}: {
  definition: z.infer<typeof definitionSchema>;
}) {
  return (
    <div className="c03-content">
      <h3>{definition.briefName ?? "Brief"}</h3>
      <p>
        {definition.briefType ?? "Type not provided"} ·{" "}
        {definition.platform ?? "Platform not provided"}
      </p>
      <h4>Creative intent</h4>
      <p className="c03-prose">{definition.creativeIntent ?? "Not provided"}</p>
      <h4>Creator Brief</h4>
      <p className="c03-prose">{definition.creatorBrief ?? "Not provided"}</p>
      <h4>Deliverables</h4>
      {definition.deliverables.length ? (
        definition.deliverables.map((item, index) => (
          <section className="c03-deliverable" key={item.id}>
            <h5>
              {index + 1}.{" "}
              {item.format?.replace(/_/g, " ") ?? "Format not provided"}
            </h5>
            <AuthoredContent value={item.configuration} />
            <AuthoredContent value={item.creativeGuidance} />
            {item.amplifyTargetDeliverableId && (
              <p>
                Amplification target:{" "}
                {definition.deliverables.findIndex(
                  (d) => d.id === item.amplifyTargetDeliverableId,
                ) >= 0
                  ? `deliverable ${definition.deliverables.findIndex((d) => d.id === item.amplifyTargetDeliverableId) + 1}`
                  : "Unavailable"}
              </p>
            )}
          </section>
        ))
      ) : (
        <p>No deliverables provided</p>
      )}
      <h4>Guidance</h4>
      <AuthoredContent value={definition.briefLevelGuidance} />
      <h4>References</h4>
      <AuthoredContent value={definition.referenceContent} />
      <h4>Usage rights</h4>
      <AuthoredContent value={definition.usageRights} />
      <h4>Creator requirements</h4>
      <p className="c03-prose">
        {definition.creatorRequirements ?? "Not provided"}
      </p>
    </div>
  );
}
