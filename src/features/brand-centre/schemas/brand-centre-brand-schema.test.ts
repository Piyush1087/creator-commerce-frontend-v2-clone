import { describe, expect, it } from "vitest";
import { consumerFixture } from "../testing/brand-consumer-fixtures";
import {
  BrandConsumerContractError,
  parseBrandCentreBrand,
} from "./brand-centre-brand-schema";

describe("strict accepted Brand consumer", () => {
  it("parses the complete consumer boundary", () => {
    const fixture = consumerFixture(3);
    expect(parseBrandCentreBrand(fixture)).toEqual(fixture);
  });
  it.each([
    "EXPLICIT_NULL",
    "INTENTIONALLY_ABSENT",
    "NO_CURRENT",
    "NOT_EVALUATED",
    "NOT_OWNED",
  ] as const)("preserves %s without collapsing null", (kind) => {
    const fixture = consumerFixture();
    fixture.brandIdentity.description.current = { kind };
    expect(
      parseBrandCentreBrand(fixture).brandIdentity.description.current,
    ).toEqual({ kind });
  });
  it.each(["READY", "PARTIAL", "NOT_READY"] as const)(
    "accepts independent readiness %s",
    (readiness) => {
      const fixture = consumerFixture();
      fixture.workspaceReadiness = readiness;
      fixture.brandIdentity.description.readiness = readiness;
      expect(parseBrandCentreBrand(fixture).workspaceReadiness).toBe(readiness);
    },
  );
  it.each([
    "NONE",
    "LEARNING",
    "REFRESHING",
    "TEMPORARILY_UNAVAILABLE",
  ] as const)("accepts neutral activity %s", (activity) => {
    expect(
      parseBrandCentreBrand({ ...consumerFixture(), runtimeActivity: activity })
        .runtimeActivity,
    ).toBe(activity);
  });
  const malformed = (
    mutate: (value: ReturnType<typeof consumerFixture>) => unknown,
  ) => {
    const value = mutate(consumerFixture());
    expect(() => parseBrandCentreBrand(value)).toThrow(
      BrandConsumerContractError,
    );
    try {
      parseBrandCentreBrand(value);
    } catch (error) {
      expect(error).toMatchObject({ code: "MALFORMED_RESPONSE" });
    }
  };
  it("rejects unvalidated extras, FAILED readiness and null VALUE", () => {
    malformed((p) => ({ ...p, processor: "must not render" }));
    malformed((p) => ({ ...p, runtimeActivity: "RUNNING" }));
    malformed((p) => ({
      ...p,
      brandIdentity: {
        ...p.brandIdentity,
        description: {
          ...p.brandIdentity.description,
          resultReadiness: "FAILED",
        },
      },
    }));
    malformed((p) => ({
      ...p,
      brandIdentity: {
        ...p.brandIdentity,
        description: {
          ...p.brandIdentity.description,
          current: { kind: "VALUE", value: null },
        },
      },
    }));
  });
  it("rejects raw candidates and candidate payloads", () => {
    for (const addition of [
      { rawCandidateVisible: true },
      { rawValue: "SECRET CANDIDATE" },
    ]) {
      malformed((p) => ({
        ...p,
        brandIdentity: {
          ...p.brandIdentity,
          positioning: {
            ...p.brandIdentity.positioning,
            candidate: {
              ...p.brandIdentity.positioning.candidate,
              ...addition,
            },
          },
        },
      }));
    }
  });
  it("rejects inactive/candidate Personas, duplicated IDs and inconsistent mirrors", () => {
    malformed((p) => ({
      ...p,
      audience: {
        ...p.audience,
        personas: [...p.audience.personas, ...p.audience.personas],
      },
    }));
    malformed((p) => ({
      ...p,
      audience: {
        ...p.audience,
        personas: [{ ...p.audience.personas[0], lifecycle: "INACTIVE" }],
      },
    }));
    malformed((p) => ({
      ...p,
      audience: {
        ...p.audience,
        personas: [{ ...p.audience.personas[0], label: "Candidate" }],
      },
    }));
    malformed((p) => ({ ...p, locations: [...p.locations, ...p.locations] }));
    malformed((p) => ({
      ...p,
      locations: [{ ...p.locations[0], locationId: "array-position-0" }],
    }));
  });
  it("rejects unknown metadata, invalid authority and metadata path mismatch", () => {
    malformed((p) => ({
      ...p,
      brandIdentity: {
        ...p.brandIdentity,
        communication: {
          ...p.brandIdentity.communication,
          authority: "BRAND_CONFIRMED",
        },
      },
    }));
    malformed((p) => ({
      ...p,
      brandIdentity: {
        ...p.brandIdentity,
        communication: {
          ...p.brandIdentity.communication,
          componentMeta: {
            $: {
              ...p.brandIdentity.communication.componentMeta[
                "$/f/primary_language"
              ],
              provider: "secret",
            },
          },
        },
      },
    }));
    malformed((p) => ({
      ...p,
      brandIdentity: {
        ...p.brandIdentity,
        communication: {
          ...p.brandIdentity.communication,
          componentMeta: {
            $: p.brandIdentity.communication.componentMeta[
              "$/f/primary_language"
            ],
          },
        },
      },
    }));
  });
  it("rejects traceability in Serviceability and unsafe asset URLs", () => {
    const p = consumerFixture();
    const current = p.serviceability.state.current;
    expect(current.kind).toBe("VALUE");
    if (current.kind !== "VALUE") return;
    expect(() =>
      parseBrandCentreBrand({
        ...p,
        serviceability: {
          state: {
            ...p.serviceability.state,
            current: {
              kind: "VALUE",
              value: { ...current.value, serviceability_basis: [] },
            },
          },
        },
      }),
    ).toThrow(BrandConsumerContractError);
    malformed((p) => ({
      ...p,
      identity: {
        ...p.identity,
        website: {
          ...p.identity.website,
          current: {
            kind: "VALUE",
            value: { url: "javascript:alert(1)", displayDomain: "unsafe" },
          },
        },
      },
    }));
  });
});
