/**
 * Mirrors backend `emailDomainMatchesBrandDomain` so the email step can reject
 * mismatches before the OTP screen (especially when OTP send is stubbed).
 */
export function emailDomainFromAddress(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at < 0) {
    return "";
  }
  return normalized.slice(at + 1).replace(/^www\./, "");
}

export function emailDomainMatchesBrandDomain(
  email: string,
  brandDomain: string,
): boolean {
  const emailHost = emailDomainFromAddress(email);
  const site = brandDomain
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  if (!emailHost || !site) {
    return false;
  }
  return (
    emailHost === site ||
    emailHost.endsWith(`.${site}`) ||
    site.endsWith(`.${emailHost}`)
  );
}
