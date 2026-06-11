import type {
  BrandProfileCompetitorResponse,
  BrandProfileOfferingResponse,
  BrandProfileResponseBody,
  BrandTargetAudience,
  BrandVisualIdentity,
  PatchBrandProfileRequestBody,
} from "../contracts/brand.contracts";
import { INDUSTRY_VERTICALS } from "../contracts/discovery.contracts";
import type { BrandDnaState } from "../types";
import type { CatalogueProduct, CompetitorHandles, CompetitorRow } from "../types";

function parseAgeRange(ageRange: string): [number, number] {
  const parts = ageRange.split("-").map((p) => Number(p.trim()));
  const a = Number.isFinite(parts[0]) ? parts[0] : 18;
  const b = Number.isFinite(parts[1]) ? parts[1] : 65;
  return [Math.min(a, b), Math.max(a, b)];
}

export function mapProfileToBrandDna(profile: BrandProfileResponseBody): BrandDnaState {
  const vi = (profile.visualIdentity ?? {}) as BrandVisualIdentity;
  const tones =
    (vi.toneOfVoice ?? []).map((t) => `${t.label}: ${t.description}`.trim()) ??
    [];
  const audience = (profile.targetAudience ?? {}) as BrandTargetAudience;
  const age = audience.ageRange;
  const ageRangeStr =
    Array.isArray(age) && age.length === 2 ? `${age[0]}-${age[1]}` : "";

  return {
    brandName: profile.name,
    logo: profile.logoUrl ?? "",
    tagline: profile.tagline ?? "",
    description: profile.description ?? "",
    industry: profile.industry ? [profile.industry] : [],
    colors: vi.colors ?? [],
    typography: {
      heading: vi.fonts?.heading ?? "",
      body: vi.fonts?.body ?? "",
    },
    tones: tones.length > 0 ? tones : [],
    aesthetics:
      vi.aesthetic && vi.aesthetic.length > 0 ? vi.aesthetic : [],
    persona: {
      name: audience.personaName ?? "",
      location:
        audience.countries && audience.countries.length > 0
          ? audience.countries.join(", ")
          : "",
      ageRange: ageRangeStr,
      affluence: audience.affluence ?? 0,
      traits:
        audience.traits && audience.traits.length > 0
          ? audience.traits
          : [],
    },
  };
}

function isIndustryVertical(value: string): value is (typeof INDUSTRY_VERTICALS)[number] {
  return (INDUSTRY_VERTICALS as readonly string[]).includes(value);
}

export function buildPatchFromDna(
  data: BrandDnaState,
  baseline: BrandProfileResponseBody,
): PatchBrandProfileRequestBody {
  const tones = data.tones.map((t) => {
    const idx = t.indexOf(":");
    if (idx === -1) {
      return { label: t.trim(), description: "" };
    }
    return {
      label: t.slice(0, idx).trim(),
      description: t.slice(idx + 1).trim(),
    };
  });

  const [ageMin, ageMax] = parseAgeRange(data.persona.ageRange);
  const countries = data.persona.location.includes("—")
    ? []
    : data.persona.location
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const industryCandidate = data.industry[0] ?? baseline.industry;
  const industry = isIndustryVertical(industryCandidate)
    ? industryCandidate
    : baseline.industry;

  return {
    name: data.brandName,
    tagline: data.tagline.trim().length > 0 ? data.tagline.trim() : null,
    description:
      data.description.trim().length > 0 ? data.description.trim() : null,
    logoUrl: data.logo.trim().length > 0 ? data.logo : null,
    industry,
    visualIdentity: {
      colors: data.colors,
      fonts: {
        heading: data.typography.heading,
        body: data.typography.body,
      },
      toneOfVoice: tones,
      aesthetic: data.aesthetics,
    },
    brandValues: baseline.brandValues,
    policyFlags: baseline.policyFlags,
    targetAudience: {
      personaName:
        data.persona.name.trim().length > 0
          ? data.persona.name.trim()
          : "General audience",
      countries,
      ageRange: [ageMin, ageMax],
      affluence: data.persona.affluence,
      traits: data.persona.traits,
    },
  };
}

function mapOfferingTypeToCategory(
  type: string,
): CatalogueProduct["category"] {
  switch (type) {
    case "PRODUCT":
      return "Top Seller";
    case "TREATMENT":
      return "Treatment";
    case "SERVICE":
      return "Service";
    case "COLLECTION":
      return "Collection";
    default:
      return "Service";
  }
}

export function mapOfferingsToCatalogue(
  offerings: BrandProfileOfferingResponse[],
): CatalogueProduct[] {
  return offerings.map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description ?? undefined,
    image: o.imageUrl ?? undefined,
    price:
      o.priceAmount && o.priceAmount.length > 0
        ? `${o.priceAmount} ${o.currency}`
        : undefined,
    category: mapOfferingTypeToCategory(o.type),
    url: o.url,
  }));
}

function mapHandles(handles: string[]): CompetitorHandles {
  const out: CompetitorHandles = {};
  for (const raw of handles) {
    const h = raw.trim();
    if (h.length === 0) {
      continue;
    }
    if (/instagram\.com/i.test(h)) {
      const match = h.match(/instagram\.com\/([^/?#]+)/i);
      out.instagram = (match?.[1] ?? h).replace(/^@/, "");
      continue;
    }
    if (/tiktok\.com/i.test(h)) {
      const match = h.match(/tiktok\.com\/@?([^/?#]+)/i);
      out.tiktok = (match?.[1] ?? h).replace(/^@/, "");
      continue;
    }
    if (h.startsWith("@")) {
      out.instagram = h.slice(1);
    }
  }
  return out;
}

export function mapCompetitorsToRows(
  rows: BrandProfileCompetitorResponse[],
): CompetitorRow[] {
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    logo: c.logoUrl ?? undefined,
    url: c.websiteUrl,
    handles: mapHandles(c.socialHandles),
    narrative: c.whyCompetitor && c.whyCompetitor.length > 0 ? c.whyCompetitor : "—",
  }));
}

export function parseHostnameFromUrl(url: string): string {
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProto).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^www\./, "");
  }
}
