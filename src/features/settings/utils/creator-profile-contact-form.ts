import type {
  CreatorCanonicalProfileResponse,
  CreatorDefaultContactResponse,
  UpdateCreatorCanonicalProfilePayload,
  UpsertCreatorDefaultContactPayload,
} from "../contracts/creator-profile-contact.contracts";

export type CreatorProfileContactForm = {
  userName: string;
  displayName: string;
  avatarUrl: string;
  primaryRegion: string;
  organizationName: string;
  recipientName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  countryCode: string;
  phoneCountryCallingCode: string;
  phoneNationalNumber: string;
  deliveryInstructions: string;
};

export function creatorProfileContactFormFromApi(
  profile: CreatorCanonicalProfileResponse,
  contact: CreatorDefaultContactResponse,
): CreatorProfileContactForm {
  const address = contact.default_contact;
  return {
    userName: profile.profile.user_name ?? "",
    displayName: profile.profile.display_name ?? "",
    avatarUrl: profile.profile.avatar_url ?? "",
    primaryRegion: profile.profile.primary_region,
    organizationName: profile.organization.name,
    recipientName: address?.recipient_name ?? "",
    addressLine1: address?.address_line_1 ?? "",
    addressLine2: address?.address_line_2 ?? "",
    city: address?.city ?? "",
    stateRegion: address?.state_region ?? "",
    postalCode: address?.postal_code ?? "",
    countryCode: address?.country_code ?? profile.profile.primary_region,
    phoneCountryCallingCode: address?.phone?.country_calling_code ?? "",
    phoneNationalNumber: address?.phone?.national_number ?? "",
    deliveryInstructions: address?.delivery_instructions ?? "",
  };
}

function normalized(value: string): string {
  return value.trim();
}

export function buildCreatorProfileContactSavePayload(
  form: CreatorProfileContactForm,
  baseline: CreatorProfileContactForm,
): {
  profile?: UpdateCreatorCanonicalProfilePayload;
  contact?: UpsertCreatorDefaultContactPayload;
} {
  const profile: UpdateCreatorCanonicalProfilePayload = {};
  if (form.userName !== baseline.userName) {
    profile.userName = normalized(form.userName) || null;
  }
  if (form.displayName !== baseline.displayName) {
    profile.displayName = normalized(form.displayName) || null;
  }
  if (form.avatarUrl !== baseline.avatarUrl) {
    profile.avatarUrl = normalized(form.avatarUrl) || null;
  }
  if (form.primaryRegion !== baseline.primaryRegion) {
    profile.primaryRegion = normalized(form.primaryRegion).toUpperCase();
  }
  if (form.organizationName !== baseline.organizationName) {
    profile.organizationName = normalized(form.organizationName);
  }

  const contactKeys: Array<keyof CreatorProfileContactForm> = [
    "recipientName",
    "addressLine1",
    "addressLine2",
    "city",
    "stateRegion",
    "postalCode",
    "countryCode",
    "phoneCountryCallingCode",
    "phoneNationalNumber",
    "deliveryInstructions",
  ];
  const contactChanged = contactKeys.some((key) => form[key] !== baseline[key]);

  return {
    ...(Object.keys(profile).length > 0 ? { profile } : {}),
    ...(contactChanged
      ? {
          contact: {
            recipientName: normalized(form.recipientName),
            addressLine1: normalized(form.addressLine1),
            addressLine2: normalized(form.addressLine2) || null,
            city: normalized(form.city),
            stateRegion: normalized(form.stateRegion) || null,
            postalCode: normalized(form.postalCode),
            countryCode: normalized(form.countryCode).toUpperCase(),
            phoneCountryCallingCode:
              normalized(form.phoneCountryCallingCode) || null,
            phoneNationalNumber: normalized(form.phoneNationalNumber) || null,
            deliveryInstructions: normalized(form.deliveryInstructions) || null,
          },
        }
      : {}),
  };
}
