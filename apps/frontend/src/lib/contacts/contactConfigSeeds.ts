import {
  GENDERS,
  SOCIAL_PLATFORMS,
  RELATIONSHIPS,
  DEFAULT_PHONE_LABELS,
  DEFAULT_EMAIL_LABELS,
  DEFAULT_ADDRESS_LABELS,
  COUNTRY_CODES,
} from "@mms/shared";

export const CONTACT_CONFIG_COLLECTION_KEYS = {
  genders: "genders",
  socialPlatforms: "socialPlatforms",
  relationships: "relationships",
  phoneLabels: "phoneLabels",
  emailLabels: "emailLabels",
  addressLabels: "addressLabels",
  countryCodes: "countryCodes",
} as const;

/** Legacy messaging template collection key (cleaned on logout; Messaging owns templates now). */
export function contactWhatsappTemplatesKey(userId?: string | number | null): string {
  return userId ? `whatsappTemplates_u:${userId}` : "whatsappTemplates";
}

/** Seeds Setup option collections from shared DEFAULT_* constants (SSOT). */
export function getContactConfigCollectionDefaults(): {
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;
} {
  return {
    genders: [...GENDERS],
    socialPlatforms: [...SOCIAL_PLATFORMS],
    relationships: [...RELATIONSHIPS],
    phoneLabels: [...DEFAULT_PHONE_LABELS],
    emailLabels: [...DEFAULT_EMAIL_LABELS],
    addressLabels: [...DEFAULT_ADDRESS_LABELS],
    countryCodes: COUNTRY_CODES.map((entry) => ({ ...entry })),
  };
}
