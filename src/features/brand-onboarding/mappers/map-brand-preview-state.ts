import type {
  BrandPreviewRuntimeProjection,
  BrandPreviewViewState,
} from "../contracts/brand-preview.contracts";

export function mapBrandPreviewRuntimeToViewState(
  runtime: BrandPreviewRuntimeProjection,
): BrandPreviewViewState {
  switch (runtime.state) {
    case "ANALYSIS_ACTIVE":
      return {
        state: "FAST_ANALYSIS_ACTIVE",
        phase: runtime.phase,
      };
    case "PREVIEW_READY": {
      if (!runtime.completeness || !runtime.preview || !runtime.verificationContext) {
        throw new Error("Brand Preview ready response is missing required data.");
      }
      return {
        state: "PREVIEW_READY",
        completeness: runtime.completeness,
        preview: runtime.preview,
        brandProfileId: runtime.verificationContext.brandProfileId,
      };
    }
    case "PREVIEW_FAILED_RECOVERABLE":
      return {
        state: "ANALYSIS_RECOVERABLE_FAILURE",
        canRetry: true,
      };
    case "PREVIEW_NOT_READY":
      return {
        state: "PREVIEW_NOT_READY",
        canRetry: runtime.canRetry,
      };
  }
}
