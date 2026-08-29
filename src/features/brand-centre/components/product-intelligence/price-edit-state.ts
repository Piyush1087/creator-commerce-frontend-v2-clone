import type { ProductConsumer } from "../../schemas/product-intelligence-schema";

type Price = ProductConsumer["offering"]["canonicalPrice"];

export function priceEditValues(price: Price) {
  return {
    mode: price.state === "CURRENT" ? price.mode : "EXACT" as const,
    min: price.state === "CURRENT" ? price.currentMinAmount ?? "" : "",
    max: price.state === "CURRENT" ? price.currentMaxAmount ?? "" : "",
    currency: price.state === "CURRENT" ? price.currency : "",
  };
}
