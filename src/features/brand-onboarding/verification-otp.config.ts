/**
 * Brand Step 6 OTP toggle (pre-prod vs production).
 *
 * @see creator-commerce-backend-v2/docs/brand-onboarding/VERIFICATION_OTP_TOGGLE.md
 */

/** PROD: set to `true` before deploy. Pre-prod/staging: keep `false` (UI stub `123456`). */
export const USE_REAL_BRAND_VERIFICATION_OTP = false;

export const STUB_OTP_CODE = "123456";

export const STUB_OTP_TTL_MINUTES = 10;
