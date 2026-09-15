export const RATE_LABELS = {
  REEL_VIDEO: { label: "Reel", reference: "One Reel, <15 seconds" },
  STORY: { label: "Story", reference: "One Story" },
  BANNER_CAROUSEL: { label: "Carousel", reference: "One Carousel" },
  PHOTOSHOOT: {
    label: "Photoshoot/static",
    reference: "One delivered static asset",
  },
  linkInBio: { label: "Link in Bio", reference: "Seven days" },
  paidAmplification: { label: "Partnership Ads", reference: "Fifteen days" },
};
export const RATE_TERMS = [
  "Rates are indicative starting points, not binding offers.",
  "Final pricing depends on the brief and its scope.",
  "Creator retains discretion until final terms are mutually accepted.",
  "Campaign commercial and payment terms supersede the Rate Card.",
  "Final accepted direct quote or Collaboration agreement supersedes the Rate Card.",
  "Rights apply only when explicitly included in the final agreement for the agreed scope and duration.",
  "Gifting/barter is optional, not an obligation to accept.",
  "Rate Card updates are prospective and never mutate historical Applications or locked Collaborations.",
  "Payment terms are preferences and may be superseded by final terms.",
];
export function formatMinor(amount: number | null) {
  if (amount === null) return "";
  const value = BigInt(amount);
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}
export function parsePrice(value: string): number | null {
  const match = /^(\d{1,14})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const amount =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
  return amount > 0n && amount <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(amount)
    : null;
}
