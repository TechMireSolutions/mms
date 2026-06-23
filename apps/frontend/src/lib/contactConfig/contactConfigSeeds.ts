export const CONTACT_CONFIG_COLLECTION_KEYS = {
  genders: "genders",
  socialPlatforms: "socialPlatforms",
  relationships: "relationships",
  lifecycleStages: "lifecycleStages",
  whatsappTemplates: "whatsappTemplates",
  phoneLabels: "phoneLabels",
  emailLabels: "emailLabels",
  addressLabels: "addressLabels",
  countryCodes: "countryCodes",
} as const;

export const CONTACT_CONFIG_OBJECT_KEYS = {
  lifecycleColors: "lifecycleColors",
  socialPlaceholders: "socialPlaceholders",
} as const;

export function contactWhatsappTemplatesKey(userId?: string | number | null): string {
  return userId
    ? `whatsappTemplates_u:${userId}`
    : CONTACT_CONFIG_COLLECTION_KEYS.whatsappTemplates;
}

export function getContactConfigCollectionDefaults(): {
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  lifecycleStages: string[];
  whatsappTemplates: WhatsAppTemplate[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;
} {
  return {
    genders: [],
    socialPlatforms: [],
    relationships: [],
    lifecycleStages: [],
    whatsappTemplates: [],
    phoneLabels: [],
    emailLabels: [],
    addressLabels: [],
    countryCodes: [],
  };
}

export function getDefaultLifecycleColors() {
  return {} as Record<string, { bg: string; text: string; border: string }>;
}

export function getDefaultSocialPlaceholders() {
  return {};
}
import type { WhatsAppTemplate } from "@mms/shared";
