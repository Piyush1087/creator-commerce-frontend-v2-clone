// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CreatorCanonicalProfileResponse,
  CreatorDefaultContactResponse,
} from "../../contracts/creator-profile-contact.contracts";
import { CreatorProfileContactSettings } from "./creator-profile-contact-settings";
import {
  buildCreatorProfileContactSavePayload,
  creatorProfileContactFormFromApi,
} from "../../utils/creator-profile-contact-form";

const save = vi.fn();
const profile: CreatorCanonicalProfileResponse = {
  actor_role: "MANAGER",
  allowed_actions: [
    "WORKSPACE_PROFILE_READ",
    "WORKSPACE_PROFILE_MANAGE",
    "CONTACT_READ",
    "CONTACT_MANAGE",
  ],
  can_manage_personal_name: false,
  profile: {
    user_name: "Ava Creator",
    display_name: "Ava Creates",
    email: "owner@example.test",
    avatar_url: null,
    primary_region: "IN",
  },
  organization: { organization_id: "organization-1", name: "Ava Studio" },
};
const contact: CreatorDefaultContactResponse = {
  actor_role: "MANAGER",
  allowed_actions: profile.allowed_actions,
  default_contact: {
    contact_id: "contact-1",
    recipient_name: "Ava Creator",
    address_line_1: "18 Address Road",
    address_line_2: null,
    city: "Bengaluru",
    state_region: "Karnataka",
    postal_code: "560001",
    country_code: "IN",
    phone: {
      country_calling_code: "+91",
      national_number: "9876543210",
      e164: "+919876543210",
    },
    has_legacy_unstructured_phone: false,
    delivery_instructions: "Reception",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
};

vi.mock("../../hooks/use-creator-profile-contact-settings", () => ({
  useCreatorProfileContactSettings: () => ({
    profile,
    contact,
    loading: false,
    saving: false,
    error: null,
    save,
  }),
}));

beforeEach(() => save.mockReset().mockResolvedValue(undefined));
afterEach(cleanup);

describe("CreatorProfileContactSettings", () => {
  it("renders canonical editable ownership and a read-only account email", () => {
    render(createElement(CreatorProfileContactSettings));

    expect(
      screen
        .getAllByDisplayValue("Ava Creator")
        .find((element) => (element as HTMLInputElement).disabled),
    ).toMatchObject({
      value: "Ava Creator",
      disabled: true,
    });
    expect(
      screen.getByText(
        "Only the Owner can change their personal account name.",
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText("Organization name")).toHaveProperty(
      "value",
      "Ava Studio",
    );
    expect(screen.getByDisplayValue("owner@example.test")).toMatchObject({
      disabled: true,
      readOnly: true,
    });
    expect(screen.queryByLabelText(/workspace display/i)).toBeNull();
    expect(screen.queryByText(/Team management/i)).toBeNull();
  });

  it("submits long international contact values without client truncation", async () => {
    render(createElement(CreatorProfileContactSettings));
    const longAddress = `${"International destination block ".repeat(6)}Unit 48`;
    fireEvent.change(screen.getByLabelText("Address line 1"), {
      target: { value: longAddress },
    });
    fireEvent.change(screen.getByLabelText("Phone country calling code"), {
      target: { value: "+44" },
    });
    fireEvent.change(screen.getByLabelText("Phone national number"), {
      target: { value: "20 7946 0958" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(save).toHaveBeenCalledWith({
      contact: expect.objectContaining({
        addressLine1: longAddress,
        phoneCountryCallingCode: "+44",
        phoneNationalNumber: "20 7946 0958",
      }),
    });
  });

  it("builds only changed canonical fields", () => {
    const baseline = creatorProfileContactFormFromApi(profile, contact);
    const payload = buildCreatorProfileContactSavePayload(
      {
        ...baseline,
        organizationName: "Ava Studio International",
        deliveryInstructions: "Use the accessible west entrance.",
      },
      baseline,
    );

    expect(payload).toEqual({
      profile: { organizationName: "Ava Studio International" },
      contact: expect.objectContaining({
        deliveryInstructions: "Use the accessible west entrance.",
      }),
    });
    expect(JSON.stringify(payload)).not.toContain("organizationDisplayName");
  });
});
