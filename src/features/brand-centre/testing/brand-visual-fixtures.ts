import {
  consumerFixture,
  field,
  intelligence,
  missing,
  setProcessorActivity,
} from "./brand-consumer-fixtures";
import { parseBrandCentreBrand } from "../schemas/brand-centre-brand-schema";

export type BrandVisualFamily =
  | "initial"
  | "progressive"
  | "mature"
  | "conflict";

/** Deterministic review data only; never imported by the production app. Copy follows the accepted blueprint. */
export function brandVisualFixture(family: BrandVisualFamily, count = 3) {
  const base = consumerFixture(count);
  const details = {
    ...base.details,
    industry: field("industry", "Healthcare"),
    category: field("sub_industry", "Fertility care"),
    primaryGeography: field("country", "India"),
    currency: field("reporting_currency", "INR"),
  };
  const labels = [
    "Early-stage treatment researchers",
    "Patients comparing care approaches",
    "Partners navigating treatment together",
  ];
  const summaries = [
    "People beginning to explore fertility care who need to understand when specialist support may be relevant and what a first consultation could involve before they are ready to contact a clinic.",
    "People actively evaluating fertility providers who may compare not only treatment options, but also the clarity, continuity and confidence they expect from the overall care experience.",
    "Couples or partners looking for practical guidance that helps both people understand the steps, decisions and emotional realities involved in fertility treatment.",
  ];
  const motivations = [
    "Clear first steps, trustworthy education and low-pressure guidance.",
    "Clinical credibility, clarity of process and continuity of support.",
    "Shared understanding, emotional realism and practical guidance.",
  ];
  const barriers = [
    "Uncertainty about what seeking specialist care means and whether they are ready to take that step.",
    "Difficulty distinguishing meaningful differences between providers beyond treatment terminology and headline claims.",
    "Different levels of knowledge, preparedness or emotional comfort between partners.",
  ];
  const trust = [
    "Credible explanations that reduce ambiguity without turning general information into personal medical advice.",
    "Specific, responsible explanations of the care experience and how decisions are supported.",
    "Content that recognises both the practical and emotional dimensions of the journey without becoming sentimental or promotional.",
  ];
  const implications = [
    "Use educators and qualified voices who can make the first steps easier to understand without creating urgency or diagnosing the audience.",
    "Creator content should help audiences understand how to evaluate care thoughtfully rather than positioning one clinic through exaggerated outcome claims.",
    "Lived-experience storytelling can make the journey feel more recognisable when it remains responsible, individual and free of efficacy claims.",
  ];
  const personas = labels.slice(0, count).map((label, i) => ({
    semantic_id: `active-persona-${i + 1}`,
    lifecycle: "ACTIVE",
    label,
    summary: summaries[i],
    motivations: [{ semantic_id: "what-matters", value: motivations[i] }],
    barriers_or_concerns: [{ semantic_id: "barrier", value: barriers[i] }],
    trust_credibility_needs: [{ semantic_id: "trust", value: trust[i] }],
    creator_communication_implications: [
      { semantic_id: "implication", value: implications[i] },
    ],
  }));
  const brandIdentity = {
    description: intelligence(
      "brand_description",
      "Northstar Fertility Care helps people navigate fertility treatment with greater clarity through clinician-led care and guidance across a journey that can otherwise feel medically and emotionally complex.",
    ),
    positioning: {
      ...intelligence(
        "positioning",
        "Clinician-led fertility care designed around informed, guided treatment journeys rather than transactional treatment decisions.",
      ),
      authority: "confirmed",
      candidate: {
        ...base.brandIdentity.positioning.candidate,
        status: family === "conflict" ? "CONFLICT" : "NONE",
        count: family === "conflict" ? 1 : 0,
      },
    },
    valueProposition: intelligence(
      "value_proposition",
      "Clear clinical guidance, continuity and support that help patients understand their choices and move through fertility care with greater confidence.",
    ),
    differentiation: intelligence("differentiation_and_proof", [
      {
        semantic_id: "guided-care",
        differentiator:
          "Northstar combines specialist fertility care with an emphasis on explaining the treatment journey clearly, helping patients understand both the clinical steps and the decisions surrounding them.",
        proof_points: [
          {
            semantic_id: "care-information",
            statement:
              "The Brand consistently frames consultation, treatment education and guided decision-making as central parts of the patient experience.",
          },
        ],
      },
    ]),
    values: intelligence(
      "brand_values",
      ["Clarity", "Empathy", "Clinical responsibility"].map((value, i) => ({
        semantic_id: `value-${i}`,
        value,
      })),
    ),
    personality: intelligence(
      "brand_personality",
      ["Reassuring", "Knowledgeable", "Considered"].map((trait, i) => ({
        semantic_id: `personality-${i}`,
        trait,
      })),
    ),
    communication: intelligence("communication_profile", {
      tone_traits: ["Reassuring", "Clear", "Expert", "Human"].map(
        (trait, i) => ({ semantic_id: `tone-${i}`, trait }),
      ),
      free_text_guidance:
        "Explain complex fertility topics in accessible language without making the audience feel spoken down to. Communication should help people understand their options while keeping personal medical decisions anchored to qualified care.",
      communication_constraints: [
        "Do not promise treatment outcomes.",
        "Do not present general education as personal diagnosis or medical advice.",
        "Avoid urgency or fear-based language around fertility decisions.",
      ].map((constraint, i) => ({ semantic_id: `boundary-${i}`, constraint })),
      primary_language: "en",
    }),
  };
  const item = {
    authority: "confirmed",
    revision: 1,
    lifecycle: "ACTIVE",
    label: null,
  };
  const canonical = {
    ...base.visualIdentity.canonical,
    primaryLogo: field("primary_logo", {
      ...item,
      id: "30000000-0000-4000-8000-000000000010",
      role: "LOGO",
      label: "Canonical fixture mark",
      url: "http://localhost:5173/__brand-smoke/mark.svg",
    }),
    palette: field("approved_palette", [
      {
        ...item,
        id: "30000000-0000-4000-8000-000000000011",
        label: "Deep Teal",
        value: "#0C4A58",
        usage: null,
      },
      {
        ...item,
        id: "30000000-0000-4000-8000-000000000012",
        label: "Warm Sand",
        value: "#E4D6CB",
        usage: null,
      },
      {
        ...item,
        id: "30000000-0000-4000-8000-000000000013",
        label: "Soft Ivory",
        value: "#F6F5F0",
        usage: null,
      },
    ]),
    // No approved typography supplied: do not substitute Aurora application fonts.
  };
  const style = intelligence("visual_style_profile", {
    summary:
      "Calm, human and trust-led visual communication with restrained colour, generous space and a preference for clarity over highly promotional treatment.",
    style_traits: [
      "Soft, restrained colour use",
      "Clean informational layouts",
      "Human warmth without lifestyle gloss",
      "Clinical credibility without sterile presentation",
    ].map((trait, i) => ({ semantic_id: `style-${i}`, trait })),
  });
  const serviceability = intelligence("serviceability_profile", {
    overall_scope: "LOCAL",
    coverage_is_heterogeneous: true,
    serviceable_markets: [
      {
        semantic_id: "delhi-ncr",
        scope: "LOCAL",
        label: "Delhi NCR",
        country_code: "IN",
        locality: "Delhi NCR",
        region: null,
        radius_km: null,
      },
    ],
    mixed_coverage_note: "Availability may vary by treatment or service.",
  });
  const developing = family === "initial" || family === "progressive";
  if (family === "initial") {
    for (const processorId of [
      "brand_communication",
      "brand_meaning",
      "brand_character",
      "audience_persona_synthesis",
      "brand_differentiation",
      "visual_style_synthesis",
      "serviceability_synthesis",
    ] as const)
      setProcessorActivity(
        base.processorRuntime,
        processorId,
        "LEARNING",
        false,
      );
  } else if (family === "progressive") {
    for (const processorId of [
      "audience_persona_synthesis",
      "visual_style_synthesis",
      "serviceability_synthesis",
    ] as const)
      setProcessorActivity(
        base.processorRuntime,
        processorId,
        "LEARNING",
        false,
      );
  }
  return parseBrandCentreBrand({
    ...base,
    workspaceReadiness: developing ? "PARTIAL" : "READY",
    runtimeActivity: developing ? "LEARNING" : "NONE",
    details,
    identity: {
      ...base.identity,
      ...details,
      brandName: field("brand_name", "Northstar Fertility Care"),
      website: field("website_url", {
        url: "https://northstarfertility.example",
        displayDomain: "northstarfertility.example",
      }),
    },
    brandIdentity:
      family === "initial"
        ? Object.fromEntries(
            Object.entries(brandIdentity).map(([key, value]) => [
              key,
              missing(value.semanticId),
            ]),
          )
        : brandIdentity,
    audience: {
      state: developing
        ? missing("audience_personas")
        : intelligence("audience_personas", personas),
      personas: developing ? [] : personas,
    },
    visualIdentity: {
      canonical: developing
        ? {
            ...base.visualIdentity.canonical,
            primaryLogo: canonical.primaryLogo,
          }
        : canonical,
      style: developing ? missing("visual_style_profile") : style,
    },
    locations: [
      {
        ...base.locations[0],
        name: "Northstar Fertility Care — Delhi NCR",
        address: "Delhi NCR",
        city: null,
        zip: null,
        observationFreshness: "CURRENT",
      },
    ],
    serviceability: {
      state: developing ? missing("serviceability_profile") : serviceability,
    },
  });
}
