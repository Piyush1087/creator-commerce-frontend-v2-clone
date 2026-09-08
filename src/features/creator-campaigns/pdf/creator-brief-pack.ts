import { jsPDF } from "jspdf";
import {
  creatorBriefPackSchema,
  type CreatorBriefPackV1,
  type Json,
} from "../contracts/c03.contracts";

/** The built-in PDF font has a bounded Western character set. Never add font downloads. */
export function pdfText(value: string): string {
  return value
    .replace(/₹/g, "INR ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7e\xa1-\xff\n\t]/gu, "[unsupported]");
}
const label = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
function rich(value: Json, prefix = ""): string[] {
  if (value === null) return [];
  if (Array.isArray(value))
    return value.flatMap((item, i) => rich(item, `${prefix}${i + 1}. `));
  if (typeof value === "object")
    return Object.keys(value)
      .sort()
      .flatMap((key) => rich(value[key], `${prefix}${label(key)}: `));
  return [`${prefix}${String(value)}`];
}
function safeReference(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    for (const key of [...url.searchParams.keys()])
      if (/^(utm_|token|credential|invitation)/i.test(key))
        url.searchParams.delete(key);
    return url.toString();
  } catch {
    return null;
  }
}
export type CreatorBriefPdf = {
  bytes: ArrayBuffer;
  filename: string;
  pageCount: number;
};

export function renderCreatorBriefPack(
  input: CreatorBriefPackV1,
): CreatorBriefPdf {
  const pack = creatorBriefPackSchema.parse(input);
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: false,
  });
  doc.setFileId(pack.application.applicationId.replace(/-/g, ""));
  doc.setCreationDate(
    `D:${pack.application.submittedAt.replace(/\D/g, "").slice(0, 14)}+00'00'`,
  );
  doc.setProperties({
    title: "Creator Brief Pack",
    author: "Creator Shop",
    subject: `Application ${pack.application.reference}`,
    creator: "Creator Shop",
  });
  const width = doc.internal.pageSize.getWidth(),
    height = doc.internal.pageSize.getHeight(),
    left = 42,
    right = width - 42,
    bottom = height - 50;
  let y = 42,
    sectionName = "";
  const ink = () => doc.setTextColor(32, 45, 56);
  function newPage() {
    doc.addPage();
    y = 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    ink();
    doc.text("Creator Brief Pack", left, y);
    y += 21;
    if (sectionName) {
      doc.setFontSize(10);
      doc.text(pdfText(`${sectionName} (continued)`), left, y);
      y += 21;
    }
  }
  function paragraph(value: string, bold = false) {
    // Keep numbered Deliverable headings with at least one following line.
    if (/^\d+\.\s/.test(value) && y + 31 > bottom) newPage();
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    ink();
    const lines = doc.splitTextToSize(pdfText(value), right - left) as string[];
    for (const line of lines) {
      if (y + 3 > bottom) {
        newPage();
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(10);
      }
      doc.text(line, left, y);
      y += 14;
    }
    y += 3;
  }
  function section(title: string, lines: string[]) {
    if (!lines.length) return;
    sectionName = "";
    if (y + 55 > bottom) newPage();
    sectionName = title;
    y += 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(22, 93, 103);
    doc.text(title, left, y);
    y += 8;
    doc.setDrawColor(214, 225, 228);
    doc.line(left, y, right, y);
    y += 17;
    for (const line of lines) paragraph(line);
  }
  doc.setTextColor(22, 93, 103);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CREATOR SHOP", left, y);
  y += 28;
  doc.setFontSize(24);
  ink();
  doc.text("Creator Brief Pack", left, y);
  y += 25;
  paragraph(`Application ${pack.application.reference}`);
  paragraph(
    `Submitted at ${pack.application.submittedAt.replace("T", " ").replace("Z", " UTC")}`,
  );
  section("Brand", [
    pack.brand?.name ?? "Brand name not provided",
    ...(pack.brand?.description ? [pack.brand.description] : []),
    ...(safeReference(pack.brand?.domain ?? null)
      ? [safeReference(pack.brand?.domain ?? null)!]
      : []),
  ]);
  section("Campaign", [
    pack.campaign.name,
    ...(pack.campaign.objective ? [pack.campaign.objective] : []),
    `Platforms: ${pack.campaign.platforms.join(", ")}`,
    ...(
      [
        ["Publishing starts", pack.campaign.publishingStart],
        ["Publishing ends", pack.campaign.publishingEnd],
        ["Application deadline", pack.campaign.applicationDeadline],
      ] as const
    ).flatMap(([name, value]) => (value ? [`${name}: ${value}`] : [])),
  ]);
  const c = pack.commercial;
  section("Commercial & Brand support", [
    `${c.compensationModel === "FIXED" ? "Fixed offer" : "Negotiable - Brand minimum/offer"}: ${c.currency} ${c.offer}`,
    `Brand support: ${c.receivesBrandSupport ? (c.brandSupportType ?? "Type not provided") : "None"}`,
    ...(c.brandSupportEstimatedValue !== null
      ? [
          `Support estimated value: ${c.currency} ${c.brandSupportEstimatedValue}`,
        ]
      : []),
  ]);
  const a = pack.asset,
    selected = a.offering;
  section("Selected Campaign Asset", [
    `Type: ${label(a.kind)}`,
    ...(selected?.name ? [selected.name] : []),
    ...(a.offer?.offerName ? [a.offer.offerName] : []),
    ...(selected?.description ? [selected.description] : []),
    ...(a.offer?.description ? [a.offer.description] : []),
    ...[selected?.url, a.offer?.entityLink].flatMap((url) => {
      const safe = safeReference(url ?? null);
      return safe ? [safe] : [];
    }),
    "Images omitted; this pack is available without remote media.",
  ]);
  section("Selected Brief", [
    pack.brief.briefName,
    `${label(pack.brief.briefType)} | ${pack.brief.platform}`,
    pack.brief.creativeIntent,
    pack.brief.creatorBrief,
  ]);
  const deliverables = [...pack.brief.deliverables].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  );
  section(
    "Deliverables",
    deliverables.flatMap((d, i) => [
      `${i + 1}. ${label(d.format)}`,
      ...rich(d.configuration),
      ...rich(d.creativeGuidance),
      ...(d.amplifyTargetDeliverableId
        ? [
            `Amplifies deliverable ${deliverables.findIndex((target) => target.id === d.amplifyTargetDeliverableId) + 1}`,
          ]
        : []),
    ]),
  );
  section("Creative guidance", rich(pack.brief.briefLevelGuidance));
  section(
    "Creator requirements",
    pack.brief.creatorRequirements ? [pack.brief.creatorRequirements] : [],
  );
  section("Reference content", rich(pack.brief.referenceContent));
  section("Usage rights", rich(pack.brief.usageRights));
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setDrawColor(214, 225, 228);
    doc.line(left, height - 35, right, height - 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 103, 112);
    doc.text(`Creator Shop | ${pack.application.reference}`, left, height - 21);
    doc.text(`${page} / ${count}`, right, height - 21, { align: "right" });
  }
  return {
    bytes: doc.output("arraybuffer"),
    filename: `creator-shop-brief-pack-${pack.application.applicationId}.pdf`,
    pageCount: count,
  };
}

export async function downloadCreatorBriefPack(
  pdf: CreatorBriefPdf,
  assertCurrent: () => void,
) {
  assertCurrent();
  const url = URL.createObjectURL(
    new Blob([pdf.bytes], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = pdf.filename;
    link.style.display = "none";
    document.body.append(link);
    assertCurrent();
    link.click();
    // Allow the browser to consume the URL, then release the ephemeral bytes.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}
