import { jsPDF } from "jspdf";
import type { MediaKitPdfSnapshot } from "./creator-media-kit.contracts";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

export function mediaKitPdfText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/₹/gu, "INR ")
    .replace(/[‘’]/gu, "'")
    .replace(/[“”]/gu, '"')
    .replace(/[–—−]/gu, "-")
    .replace(/…/gu, "...")
    .replace(/[^\x20-\x7e\xa1-\xff\n\t]/gu, "[unsupported]");
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "")
    return "Unavailable";
  return mediaKitPdfText(String(value));
}

export function renderMediaKitPdf(snapshot: MediaKitPdfSnapshot) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: true,
  });
  const left = 44;
  const right = doc.internal.pageSize.getWidth() - 44;
  const bottom = doc.internal.pageSize.getHeight() - 48;
  let y = 48;

  const newPage = () => {
    doc.addPage();
    y = 44;
  };
  const line = (value: string, options?: { bold?: boolean; link?: string }) => {
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(options?.bold ? 12 : 9);
    doc.setTextColor(31, 44, 55);
    const lines = doc.splitTextToSize(
      mediaKitPdfText(value),
      right - left,
    ) as string[];
    for (const part of lines.slice(0, 20)) {
      if (y > bottom) newPage();
      if (options?.link) doc.textWithLink(part, left, y, { url: options.link });
      else doc.text(part, left, y);
      y += options?.bold ? 17 : 13;
    }
  };
  const section = (title: string) => {
    y += 10;
    if (y > bottom - 30) newPage();
    doc.setDrawColor(213, 223, 226);
    doc.line(left, y, right, y);
    y += 20;
    line(title, { bold: true });
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(22, 93, 103);
  doc.text("CREATOR SHOP", left, y);
  y += 31;
  doc.setFontSize(24);
  doc.setTextColor(31, 44, 55);
  doc.text("Creator Media Kit", left, y);
  y += 28;
  line(snapshot.projection.identity.name ?? "Creator");
  line(
    `Generated on ${new Date(snapshot.generatedOn).toLocaleDateString("en-GB")}`,
  );

  section("Creator");
  line(snapshot.projection.identity.headline ?? "Positioning unavailable");
  if (snapshot.projection.identity.bio) line(snapshot.projection.identity.bio);
  if (snapshot.projection.identity.instagramHandle)
    line(
      `Instagram: @${snapshot.projection.identity.instagramHandle.replace(/^@/u, "")}`,
    );

  const audience = snapshot.projection.sections.audience;
  if (audience) {
    section("Audience");
    line(`State: ${audience.state}`);
    line(`Observed as of ${display(audience.observedAsOf)}`);
    for (const fact of audience.facts)
      line(
        [fact.cohort, fact.dimension, fact.bucket, fact.percentage]
          .filter((value) => value !== null && value !== undefined)
          .map(display)
          .join(" · "),
      );
  }

  const content = snapshot.projection.sections.content;
  if (content) {
    section("Content & Performance");
    line(`State: ${content.state}`);
    line(`Observed as of ${display(content.observedAsOf)}`);
    for (const theme of content.themes)
      line(`${display(theme.value)} · ${display(theme.postCount)} posts`);
    for (const claim of content.performance)
      line(
        [claim.cohort, claim.metric, claim.direction].map(display).join(" · "),
      );
  }

  const portfolio = snapshot.projection.sections.portfolio;
  if (portfolio) {
    section("Portfolio");
    if (portfolio.items.length === 0)
      line(
        "No featured image is available. Source references remain available when selected.",
      );
    for (const item of portfolio.items) {
      line(display(item.title), { bold: true });
      if (typeof item.sourceDestination === "string")
        line("Open source reference", {
          link: item.sourceDestination,
        });
      line("Static image unavailable; source-link fallback shown.");
    }
  }

  const rateCard = snapshot.projection.sections.rateCard;
  if (rateCard) {
    section("Work With Me / Rate Card");
    line(`Currency: ${display(rateCard.currency)}`);
    for (const rate of rateCard.lines)
      line(
        `Starting from ${display(rateCard.currency)} ${display(rate.amountMinor)} · ${display(rate.key)}`,
      );
    line(
      "Rates are indicative starting points. Final terms depend on the brief and mutually accepted scope.",
    );
  }

  section("Availability");
  line(
    `Based in: ${display(snapshot.projection.sections.availability.basedIn)}`,
  );
  line(
    `Availability: ${display(snapshot.projection.sections.availability.availability)}`,
  );
  line(
    "Availability is informational and does not filter either contact action.",
  );

  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 118);
    doc.text(
      `Creator Shop · point-in-time snapshot · ${page}/${count}`,
      left,
      bottom + 24,
    );
  }
  const bytes = doc.output("arraybuffer");
  if (bytes.byteLength > MAX_PDF_BYTES)
    throw new Error("MEDIA_KIT_PDF_SIZE_LIMIT");
  return {
    bytes,
    filename: `creator-media-kit-${snapshot.publicId}.pdf`,
    pageCount: count,
  };
}

export async function downloadMediaKitPdf(snapshot: MediaKitPdfSnapshot) {
  const rendered = renderMediaKitPdf(snapshot);
  const url = URL.createObjectURL(
    new Blob([rendered.bytes], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = rendered.filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}
