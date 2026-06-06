const LIVE_HOSTS = [/instagram\.com/i, /tiktok\.com/i, /youtube\.com/i];

export function validateHttpUrl(value: string, label = "URL"): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required.`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return `${label} must start with http:// or https://`;
    }
    return null;
  } catch {
    return `${label} must be a valid link (e.g. https://example.com/file).`;
  }
}

export function validateMediaUrl(value: string): string | null {
  return validateHttpUrl(value, "Media URL");
}

export function validateLivePostUrl(value: string): string | null {
  const base = validateHttpUrl(value, "Live post URL");
  if (base) {
    return base;
  }
  if (!LIVE_HOSTS.some((re) => re.test(value.trim()))) {
    return "Live post must be an Instagram, TikTok, or YouTube link.";
  }
  return null;
}

export function validateReceiptUrl(value: string): string | null {
  return validateHttpUrl(value, "Receipt URL");
}

export function validateQuoteAmount(value: string): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return "Enter a positive amount in ₹.";
  }
  return null;
}
