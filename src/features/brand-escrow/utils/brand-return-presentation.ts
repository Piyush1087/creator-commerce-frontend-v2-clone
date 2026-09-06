import type {
  BrandReturnActionReason,
  BrandReturnStatus,
} from "../contracts/escrow.contracts";

export type BrandReturnPresentation = {
  label: string;
  description: string;
  tone: "success" | "pending" | "error" | "neutral";
};

export const BRAND_RETURN_PRESENTATION: Record<
  BrandReturnStatus,
  BrandReturnPresentation
> = {
  RETURN_REQUESTED: {
    label: "Return requested",
    description: "The request exists; external completion is not yet established.",
    tone: "pending",
  },
  ALLOCATING_SOURCES: {
    label: "Allocating original sources",
    description: "Creator Shop is identifying eligible original funding sources.",
    tone: "pending",
  },
  PROCESSING: {
    label: "Processing return",
    description: "Provider operations remain in progress.",
    tone: "pending",
  },
  COMPLETED: {
    label: "Return completed",
    description: "The backend has confirmed terminal completion.",
    tone: "success",
  },
  PARTIAL: {
    label: "Partially completed",
    description: "Only part of the request is confirmed complete; review the amounts below.",
    tone: "pending",
  },
  ACTION_REQUIRED: {
    label: "Action required",
    description: "This return requires provider reconciliation or support review.",
    tone: "error",
  },
  FAILED: {
    label: "Return failed",
    description: "The backend reports a definitive failure. Reload vault state before acting.",
    tone: "error",
  },
};

export const BRAND_RETURN_REASON_COPY: Record<
  BrandReturnActionReason,
  string
> = {
  SOURCE_PROVENANCE_REQUIRED:
    "Some available funds do not have eligible source evidence for self-service return.",
  PROVIDER_SETUP_REQUIRED:
    "The return provider is unavailable. No external return has been confirmed.",
  PROVIDER_OUTCOME_AMBIGUOUS:
    "The provider outcome is uncertain and requires reconciliation.",
  SOURCE_NO_LONGER_REFUNDABLE:
    "An original funding source is no longer provider-returnable.",
  PROVIDER_RECONCILIATION_REQUIRED:
    "Provider reconciliation is required before the result can be confirmed.",
  UNSUPPORTED_SOURCE:
    "The original funding source does not support self-service return.",
  UNSUPPORTED_CURRENCY:
    "The provider does not support self-service return for this currency.",
};
