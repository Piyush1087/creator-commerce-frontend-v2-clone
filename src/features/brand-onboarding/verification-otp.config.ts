/**
 * Brand Step 6 OTP — local hardcoded bypass (no env, no Postmark).
 *
 * Before production: set this to `true`, restore backend
 * `sendOtpReal` / `verifyOtpReal`, and delete `STUB_OTP_CODE`.
 *
 * @see creator-commerce-backend-v2/docs/brand-onboarding/VERIFICATION_OTP_TOGGLE.md
 */

export const USE_REAL_BRAND_VERIFICATION_OTP = false;

export const STUB_OTP_CODE = "123456";

export const STUB_OTP_TTL_MINUTES = 10;
