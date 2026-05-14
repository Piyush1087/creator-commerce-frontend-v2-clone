import type { CatalogueOffer, CatalogueProduct } from "../types";

export const CATALOGUE_ROOT_DOMAIN = "themancompany.com";

export const INITIAL_CATALOGUE_PRODUCTS: CatalogueProduct[] = [
  {
    id: "1",
    name: "Vanguard Elite Series",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    category: "Top Seller",
    url: "https://themancompany.com/products/vanguard-elite",
  },
  {
    id: "2",
    name: "Sonic Bloom Pro",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    category: "Top Seller",
    url: "https://themancompany.com/products/sonic-bloom",
  },
  {
    id: "3",
    name: "Ignite Performance Runner",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    category: "Top Seller",
    url: "https://themancompany.com/products/ignite",
  },
];

export const INITIAL_CATALOGUE_OFFERS: CatalogueOffer[] = [
  {
    id: "o1",
    title: "Creator Launch 20",
    description:
      "Flat 20% off for first-time shoppers via creator links.",
    code: "CREATOR20",
    type: "Promo",
  },
  {
    id: "o2",
    title: "Free Shipping Bundle",
    description: "Free express shipping on all orders above $150.",
    code: "FREESHIP150",
    type: "Offer",
  },
];
