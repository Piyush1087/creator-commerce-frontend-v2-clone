import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import { canonicalOfferingIndexSchema, manualPriceInputSchema, productConsumerSchema, type ManualPriceInput } from "../schemas/product-intelligence-schema";

export class ProductContractError extends Error { readonly code = "MALFORMED_RESPONSE"; }
export class ProductRequestError extends Error { constructor(readonly status?: number) { super("Product information is temporarily unavailable."); } }
async function json(response: Response) { if (!response.ok) throw new ProductRequestError(response.status); try { return await response.json() as unknown; } catch { throw new ProductContractError(); } }
const headers = () => ({ Accept: "application/json", "Content-Type": "application/json" });
export async function fetchCanonicalOfferings(signal?: AbortSignal) { return canonicalOfferingIndexSchema.parse(await json(await fetch(`${env.apiUrl}/api/v1/brand-centre/offerings`, { headers: headers(), signal, cache: "no-store" }))); }
export async function fetchProductIntelligence(offeringId: string, signal?: AbortSignal) { return productConsumerSchema.parse(await json(await fetch(`${env.apiUrl}/api/v1/brand-centre/offerings/${encodeURIComponent(offeringId)}/intelligence`, { headers: headers(), signal, cache: "no-store" }))); }
export async function putManualOfferingPrice(offeringId: string, input: ManualPriceInput, signal?: AbortSignal) { const body = manualPriceInputSchema.parse(input); return json(await fetch(`${env.apiUrl}/api/v1/brand-centre/dna/offerings/${encodeURIComponent(offeringId)}/price`, { method: "PUT", headers: headers(), body: JSON.stringify(body), signal })); }
