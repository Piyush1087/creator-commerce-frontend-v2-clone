import { IDENTITY_TEST_SESSION_KEY } from "../constants";
import {
  isIdentityTestDryRunResponse,
  type IdentityTestDryRunResponse,
} from "../contracts/identity-test.contracts";

export function saveIdentityTestResult(
  result: IdentityTestDryRunResponse,
): void {
  sessionStorage.setItem(IDENTITY_TEST_SESSION_KEY, JSON.stringify(result));
}

export function loadIdentityTestResult(): IdentityTestDryRunResponse | null {
  const raw = sessionStorage.getItem(IDENTITY_TEST_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isIdentityTestDryRunResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearIdentityTestResult(): void {
  sessionStorage.removeItem(IDENTITY_TEST_SESSION_KEY);
}
