const TRACK_KEY = "creator_onboarding_track_id";
const HANDLE_KEY = "creator_onboarding_handle";
const EMAIL_KEY = "creator_onboarding_email";
const SKIP_IG_KEY = "creator_onboarding_skip_ig";

export function saveOnboardingTrack(trackId: string, handle: string): void {
  sessionStorage.setItem(TRACK_KEY, trackId);
  sessionStorage.setItem(HANDLE_KEY, handle);
}

export function getOnboardingTrackId(): string | null {
  return sessionStorage.getItem(TRACK_KEY);
}

export function getOnboardingHandle(): string | null {
  return sessionStorage.getItem(HANDLE_KEY);
}

export function saveOnboardingEmail(email: string): void {
  sessionStorage.setItem(EMAIL_KEY, email);
}

export function getOnboardingEmail(): string | null {
  return sessionStorage.getItem(EMAIL_KEY);
}

export function markInstagramConnectSkipped(): void {
  sessionStorage.setItem(SKIP_IG_KEY, "1");
}

export function isInstagramConnectSkipped(): boolean {
  return sessionStorage.getItem(SKIP_IG_KEY) === "1";
}

export function clearOnboardingSession(): void {
  sessionStorage.removeItem(TRACK_KEY);
  sessionStorage.removeItem(HANDLE_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
  sessionStorage.removeItem(SKIP_IG_KEY);
}
