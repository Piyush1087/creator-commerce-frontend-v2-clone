import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  BrandAuditExportResponse,
  BrandAuditFieldRow,
} from "../contracts/brand.contracts";

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatConfidence(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  if (value <= 1) {
    return `${Math.round(value * 100)}%`;
  }
  if (value <= 100) {
    return `${Math.round(value)}%`;
  }
  return String(value);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

function ensureSpace(doc: JsPdfWithAutoTable, y: number, needed = 28): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed < pageHeight - MARGIN) {
    return y;
  }
  doc.addPage();
  return MARGIN;
}

function sectionTitle(doc: JsPdfWithAutoTable, title: string, y: number): number {
  const nextY = ensureSpace(doc, y, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(title, MARGIN, nextY);
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, nextY + 2, MARGIN + CONTENT_WIDTH, nextY + 2);
  return nextY + 8;
}

function subsectionTitle(
  doc: JsPdfWithAutoTable,
  title: string,
  y: number,
): number {
  const nextY = ensureSpace(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(title, MARGIN, nextY);
  return nextY + 4;
}

function kvBlock(
  doc: JsPdfWithAutoTable,
  rows: Array<[string, string]>,
  y: number,
): number {
  const startY = ensureSpace(doc, y, 20);
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_WIDTH,
    theme: "plain",
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      textColor: [40, 40, 40],
      overflow: "linebreak",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
      1: { cellWidth: CONTENT_WIDTH - 42 },
    },
    body: rows.map(([label, value]) => [label, value || "—"]),
  });
  return (doc.lastAutoTable?.finalY ?? startY) + 6;
}

function fieldTable(
  doc: JsPdfWithAutoTable,
  fields: BrandAuditFieldRow[],
  y: number,
): number {
  if (fields.length === 0) {
    const nextY = ensureSpace(doc, y, 10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("No fields available.", MARGIN, nextY);
    return nextY + 6;
  }

  const startY = ensureSpace(doc, y, 24);
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_WIDTH,
    theme: "striped",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [30, 30, 30],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 52 },
      2: { cellWidth: 28 },
      3: { cellWidth: 16 },
      4: { cellWidth: 14 },
      5: { cellWidth: CONTENT_WIDTH - 138 },
    },
    head: [["Field", "Value", "Source", "Conf.", "Edited", "Evidence"]],
    body: fields.map((row) => [
      row.field,
      row.value,
      row.sourceDetail || row.source,
      formatConfidence(row.confidence),
      row.edited ? "Yes" : "No",
      row.evidence,
    ]),
  });
  return (doc.lastAutoTable?.finalY ?? startY) + 8;
}

function clipText(value: string, max = 420): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function safeFilenamePart(value: string | null | undefined): string {
  const raw = (value ?? "brand").trim().toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "brand";
}

/**
 * Builds a product-team audit PDF: Surface Scan + Phase B combined data.
 */
export function downloadBrandAuditPdf(audit: BrandAuditExportResponse): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as JsPdfWithAutoTable;
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Brand Intelligence Audit", MARGIN, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    [
      `Domain: ${audit.domain ?? "—"}`,
      `Lead: ${audit.leadId}`,
      `Stage: ${audit.currentStage ?? "—"}`,
      `Generated: ${formatDate(audit.generatedAt)}`,
    ].join("   ·   "),
    MARGIN,
    y,
    { maxWidth: CONTENT_WIDTH },
  );
  y += 10;

  if (audit.pipelineError) {
    y = ensureSpace(doc, y, 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(150, 40, 40);
    doc.text(`Pipeline error: ${clipText(audit.pipelineError, 240)}`, MARGIN, y, {
      maxWidth: CONTENT_WIDTH,
    });
    y += 10;
    doc.setTextColor(40, 40, 40);
  }

  // --- Section 1: Surface Scan ---
  y = sectionTitle(doc, "1. Surface Scan (Stage 1A / Checkpoint 1)", y);
  y = kvBlock(
    doc,
    [
      ["Scan ID", audit.surfaceScan.scanId],
      ["Acquisition", audit.surfaceScan.discoveryMode ?? "—"],
      ["Completed", formatDate(audit.surfaceScan.completedAt)],
      [
        "Discovered links",
        String(audit.surfaceScan.discoveredLinksCount),
      ],
      [
        "Link sample",
        audit.surfaceScan.discoveredLinksSample.length > 0
          ? audit.surfaceScan.discoveredLinksSample.join(", ")
          : "—",
      ],
    ],
    y,
  );

  y = subsectionTitle(doc, "Core identity (Stage 1A extracted)", y);
  y = fieldTable(doc, audit.surfaceScan.fields, y);

  if (audit.surfaceScan.confirmedIdentity) {
    y = subsectionTitle(doc, "Confirmed identity (Checkpoint 1)", y);
    y = fieldTable(doc, audit.surfaceScan.confirmedIdentity, y);
  }

  // --- Section 2: Phase B ---
  y = sectionTitle(doc, "2. Phase B Combined (Stage 1B + Brand DNA)", y);
  y = kvBlock(
    doc,
    [
      ["Stage 1B status", audit.phaseB.stage1b.status ?? "—"],
      ["Pages planned", String(audit.phaseB.stage1b.pageCount ?? "—")],
      ["Stage 1B completed", formatDate(audit.phaseB.stage1b.completedAt)],
      [
        "Planned URLs",
        audit.phaseB.stage1b.plannedUrls.length > 0
          ? audit.phaseB.stage1b.plannedUrls.join(", ")
          : "—",
      ],
    ],
    y,
  );

  y = subsectionTitle(doc, "Crawled pages (Stage 1B runtime context)", y);
  if (audit.phaseB.crawledPages.length === 0) {
    y = ensureSpace(doc, y, 10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("No crawled pages recorded.", MARGIN, y);
    y += 6;
  } else {
    const startY = ensureSpace(doc, y, 20);
    autoTable(doc, {
      startY,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_WIDTH,
      theme: "striped",
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [30, 30, 30],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 36 },
        2: { cellWidth: CONTENT_WIDTH - 84 },
        3: { cellWidth: 20 },
      },
      head: [["Page type", "Title", "URL", "Chars"]],
      body: audit.phaseB.crawledPages.map((page) => [
        page.pageType,
        page.title ?? "—",
        page.url,
        String(page.textChars),
      ]),
    });
    y = (doc.lastAutoTable?.finalY ?? startY) + 8;
  }

  y = subsectionTitle(doc, "Website assets (derived from crawl)", y);
  y = kvBlock(
    doc,
    [
      [
        "Colors",
        audit.phaseB.websiteAssets.colors.length > 0
          ? audit.phaseB.websiteAssets.colors.join(", ")
          : "—",
      ],
      [
        "Fonts",
        audit.phaseB.websiteAssets.fonts.length > 0
          ? audit.phaseB.websiteAssets.fonts.join(", ")
          : "—",
      ],
      ["Logo", audit.phaseB.websiteAssets.logo ?? "—"],
      [
        "Nav labels",
        audit.phaseB.websiteSummary.navLabels.length > 0
          ? audit.phaseB.websiteSummary.navLabels.join(", ")
          : "—",
      ],
      [
        "Homepage excerpt",
        clipText(audit.phaseB.websiteSummary.homepageExcerpt, 360),
      ],
      [
        "About excerpt",
        clipText(audit.phaseB.websiteSummary.aboutExcerpt ?? "", 360),
      ],
    ],
    y,
  );

  y = subsectionTitle(doc, "Brand DNA (Prompt A / Gemini)", y);
  if (!audit.phaseB.brandDna) {
    y = ensureSpace(doc, y, 10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Brand DNA snapshot not available yet.", MARGIN, y);
    y += 6;
  } else {
    y = fieldTable(doc, audit.phaseB.brandDna.fields, y);
    for (const persona of audit.phaseB.brandDna.personas) {
      y = subsectionTitle(doc, `Audience persona ${persona.index}`, y);
      y = fieldTable(doc, persona.fields, y);
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `CreatorShop brand audit · ${audit.domain ?? audit.leadId} · page ${page}/${pageCount}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 6,
    );
  }

  const filename = `brand-audit-${safeFilenamePart(audit.domain)}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}
