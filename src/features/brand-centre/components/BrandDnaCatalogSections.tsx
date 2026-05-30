import type { BrandCentreCatalogViewModel } from "../types";
import { EMPTY_FIELD, hasDisplayValue } from "../utils/display-field";

type BrandDnaCatalogSectionsProps = {
  catalog: BrandCentreCatalogViewModel;
};

function TagList({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            background: "var(--surface-page)",
            border: "1px solid var(--border-default)",
            padding: "4px 10px",
            borderRadius: "100px",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function OfferingList({
  title,
  rows,
}: {
  title: string;
  rows: BrandCentreCatalogViewModel["primaryOfferings"];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h4
        style={{
          margin: 0,
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h4>
      {rows.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>
          {EMPTY_FIELD}
        </p>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: "12px",
              padding: "14px",
              background: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "6px",
              }}
            >
              <strong style={{ fontSize: "14px" }}>{row.name}</strong>
              {row.isDeepScanned ? (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                  }}
                >
                  Deep scanned
                </span>
              ) : null}
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "12px",
                color: "var(--color-primary)",
                wordBreak: "break-all",
              }}
            >
              {hasDisplayValue(row.url) ? row.url : EMPTY_FIELD}
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "13px", color: "var(--text-muted)" }}>
              {row.description}
            </p>
            <TagList items={row.sellingPoints} />
          </div>
        ))
      )}
    </div>
  );
}

export function BrandDnaCatalogSections({ catalog }: BrandDnaCatalogSectionsProps) {
  return (
    <div className="aurora-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          Catalog & Competitive Context
        </h2>
      </div>

      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        <section>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: "0 0 12px",
            }}
          >
            Brand USPs
          </h3>
          <TagList items={catalog.brandUsps} />
        </section>

        <section>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: "0 0 12px",
            }}
          >
            Do-not-say list
          </h3>
          <TagList items={catalog.doNotSayList} />
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          <OfferingList
            title={catalog.primarySectionTitle}
            rows={catalog.primaryOfferings}
          />
          <OfferingList
            title={catalog.collectionSectionTitle}
            rows={catalog.collectionOfferings}
          />
        </div>

        <section>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: "0 0 12px",
            }}
          >
            Active offers
          </h3>
          {catalog.offers.length === 0 ? (
            <p style={{ margin: 0, color: "var(--text-muted)" }}>{EMPTY_FIELD}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {catalog.offers.map((offer) => (
                <div
                  key={offer.id}
                  style={{
                    border: "1px solid var(--border-default)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    background: "var(--surface-page)",
                  }}
                >
                  <strong style={{ fontSize: "14px" }}>{offer.offerName}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                    Code: {offer.promoCode} · {offer.scope}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    {offer.validity}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: "0 0 12px",
            }}
          >
            Competitors
          </h3>
          {catalog.competitors.length === 0 ? (
            <p style={{ margin: 0, color: "var(--text-muted)" }}>{EMPTY_FIELD}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {catalog.competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  style={{
                    border: "1px solid var(--border-default)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                  }}
                >
                  <strong>{competitor.name}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--color-primary)" }}>
                    {competitor.websiteUrl}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    {competitor.whyCompetitor}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
