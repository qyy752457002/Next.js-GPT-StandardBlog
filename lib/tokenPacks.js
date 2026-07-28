export const TOKENS_PER_POST = 10;
export const MIN_PACK_QUANTITY = 1;
export const MAX_PACK_QUANTITY = 20;

/** Client-safe pack catalog (no Stripe secrets). */
export const TOKEN_PACKS = [
  {
    id: "basic",
    name: "Basic",
    tokens: 10,
    unitPrice: 10,
    priceLabel: "$10",
    compareAtLabel: null,
    badge: null,
    description: "Enough for 1 full blog post",
  },
  {
    id: "plus",
    name: "Plus",
    tokens: 50,
    unitPrice: 40,
    priceLabel: "$40",
    compareAtLabel: "$50",
    badge: "Save 20%",
    description: "Enough for 5 full blog posts",
  },
  {
    id: "pro",
    name: "Pro",
    tokens: 100,
    unitPrice: 70,
    priceLabel: "$70",
    compareAtLabel: "$100",
    badge: "Best value",
    description: "Enough for 10 full blog posts",
  },
];

export function getTokenPack(packId) {
  return TOKEN_PACKS.find((pack) => pack.id === packId) || null;
}

/** Server-only: map pack id → Stripe Price id from env. */
export function getPackPriceId(packId) {
  const map = {
    basic: process.env.STRIPE_PRICE_BASIC_ID,
    plus: process.env.STRIPE_PRICE_PLUS_ID,
    pro: process.env.STRIPE_PRICE_PRO_ID,
  };
  return map[packId] || null;
}
