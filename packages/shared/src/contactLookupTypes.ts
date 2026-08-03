import { z } from 'zod';

/** Contacts Setup option-list kinds migrated off document-store `collections`. */
export const CONTACT_LOOKUP_KINDS = [
  'genders',
  'socialPlatforms',
  'relationships',
  'phoneLabels',
  'emailLabels',
  'addressLabels',
  'countryCodes',
] as const;

export type ContactLookupKind = (typeof CONTACT_LOOKUP_KINDS)[number];

export const contactLookupKindSchema = z.enum(CONTACT_LOOKUP_KINDS);

export const contactLookupCountryCodeSchema = z.object({
  country: z.string().min(1).max(200),
  code: z.string().min(1).max(32),
});

export type ContactLookupCountryCode = z.infer<typeof contactLookupCountryCodeSchema>;

export const contactLookupStringItemsSchema = z.array(z.string().min(1).max(200)).max(500);

export const contactLookupCountryItemsSchema = z.array(contactLookupCountryCodeSchema).max(500);

export const contactLookupsMapSchema = z.object({
  genders: contactLookupStringItemsSchema,
  socialPlatforms: contactLookupStringItemsSchema,
  relationships: contactLookupStringItemsSchema,
  phoneLabels: contactLookupStringItemsSchema,
  emailLabels: contactLookupStringItemsSchema,
  addressLabels: contactLookupStringItemsSchema,
  countryCodes: contactLookupCountryItemsSchema,
});

export type ContactLookupsMap = z.infer<typeof contactLookupsMapSchema>;

export const contactLookupKindParamsSchema = z.object({
  kind: contactLookupKindSchema,
});

export const contactLookupPutBodySchema = z.object({
  items: z.union([contactLookupStringItemsSchema, contactLookupCountryItemsSchema]),
});

export function isContactLookupKind(value: string): value is ContactLookupKind {
  return (CONTACT_LOOKUP_KINDS as readonly string[]).includes(value);
}

export function isContactLookupCountryKind(kind: ContactLookupKind): boolean {
  return kind === 'countryCodes';
}
