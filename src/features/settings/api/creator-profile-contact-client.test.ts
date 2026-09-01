// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adoptAuthSession,
  resetAuthSessionForTests,
} from "../../../shared/auth/auth-session";
import {
  CreatorProfileContactApiError,
  fetchCreatorCanonicalProfile,
  upsertCreatorDefaultContact,
} from "./creator-profile-contact-client";

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  resetAuthSessionForTests();
  adoptAuthSession({
    accessToken: "creator-settings-token",
    accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
    user: {
      id: "manager-user",
      email: "manager@example.test",
      name: "Manager",
      role: "CREATOR",
    },
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("Creator profile/contact API client", () => {
  it("uses shared authenticated transport for the canonical profile", async () => {
    fetchMock.mockResolvedValueOnce(response({ actor_role: "MANAGER" }));

    await expect(fetchCreatorCanonicalProfile()).resolves.toEqual({
      actor_role: "MANAGER",
    });
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer creator-settings-token");
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/creator/settings/profile",
    );
  });

  it("writes structured phone parts and never sends a derived E.164 authority", async () => {
    fetchMock.mockResolvedValueOnce(response({ default_contact: null }));
    await upsertCreatorDefaultContact({
      recipientName: "Ava Creator",
      addressLine1: "18 Address Road",
      city: "Bengaluru",
      postalCode: "560001",
      countryCode: "IN",
      phoneCountryCallingCode: "+91",
      phoneNationalNumber: "98765 43210",
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      phoneCountryCallingCode: "+91",
      phoneNationalNumber: "98765 43210",
    });
    expect(body).not.toHaveProperty("phoneE164");
    expect(body).not.toHaveProperty("organizationDisplayName");
  });

  it("preserves a backend authorization failure", async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        { message: "Creator action CONTACT_READ is not permitted." },
        403,
      ),
    );

    const error = await upsertCreatorDefaultContact({
      recipientName: "Ava Creator",
      addressLine1: "18 Address Road",
      city: "Bengaluru",
      postalCode: "560001",
      countryCode: "IN",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CreatorProfileContactApiError);
    expect(error).toMatchObject({ status: 403 });
  });
});
