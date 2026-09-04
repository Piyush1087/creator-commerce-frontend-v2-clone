import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrandAuditExportResponse } from "../contracts/brand.contracts";
import { downloadBrandAuditPdf } from "./brand-audit-pdf";

const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("jspdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jspdf")>();
  return {
    ...actual,
    jsPDF: function JsPdfFixture(options?: ConstructorParameters<typeof actual.jsPDF>[0]) {
      const document = new actual.jsPDF(options);
      document.save = ((filename?: string) => {
        mocks.save(filename);
        return document;
      }) as typeof document.save;
      return document;
    },
  };
});

const auditFixture: BrandAuditExportResponse = {
  leadId: "lead-fixture",
  brandProfileId: "brand-fixture",
  domain: "example.test",
  generatedAt: "2030-01-01T00:00:00.000Z",
  currentStage: null,
  pipelineError: null,
  surfaceScan: {
    completedAt: "2030-01-01T00:00:00.000Z",
    scanId: "scan-fixture",
    discoveryMode: "HTTP",
    discoveredLinksCount: 0,
    discoveredLinksSample: [],
    fields: [],
    confirmedIdentity: null,
  },
  phaseB: {
    stage1b: {
      status: "COMPLETED",
      plannedUrls: [],
      pageCount: 0,
      completedAt: "2030-01-01T00:00:00.000Z",
    },
    crawledPages: [],
    websiteAssets: { colors: [], fonts: [], logo: null },
    websiteSummary: {
      homepageExcerpt: "Synthetic homepage excerpt",
      aboutExcerpt: null,
      navLabels: [],
    },
    brandDna: null,
  },
};

afterEach(() => vi.restoreAllMocks());

describe("Brand audit PDF export", () => {
  it("generates the audit through the current jsPDF/autotable chain", async () => {
    await expect(downloadBrandAuditPdf(auditFixture)).resolves.toBeUndefined();
    expect(mocks.save).toHaveBeenCalledWith(
      expect.stringMatching(
        /^brand-audit-example\.test-\d{4}-\d{2}-\d{2}\.pdf$/u,
      ),
    );
  });
});
