import type { InstagramSourceValue } from "../contracts/instagram-b4.schemas";

const instagramHosts = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);

export function safeInstagramPermalink(
  value: InstagramSourceValue,
): string | null {
  const candidate =
    value.state === "AVAILABLE" && typeof value.value === "string"
      ? value.value
      : null;
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && instagramHosts.has(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
