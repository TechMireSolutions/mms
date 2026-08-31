import {
  mergeCountryDialCodeOptions,
  mergeCountryNameOptions,
  normalizeDialCode,
  type CountryCodeEntry,
} from "@/lib/contacts/countryCodeOptions";
import { buildOptionDefaults } from "@/tenant/features/contacts/hooks/contactFormDraftUtils";

export function useContactFormDraftOptions({
  phoneLabels,
  emailLabels,
  addressLabels,
  socialPlatforms,
  relationshipOptions,
  educationDegrees,
  employmentTypes,
  skillCategories,
  skillProficiencies,
  defaultCountryCode,
  countryCodes,
  defaultCountry,
  updateCountryCodes,
}: {
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  socialPlatforms: string[];
  relationshipOptions: string[];
  educationDegrees?: string[];
  employmentTypes?: string[];
  skillCategories?: string[];
  skillProficiencies?: string[];
  defaultCountryCode: string;
  countryCodes: CountryCodeEntry[];
  defaultCountry: string;
  updateCountryCodes: (next: CountryCodeEntry[]) => void;
}) {
  const optionDefaults = (() =>
      buildOptionDefaults({
        phoneLabels,
        emailLabels,
        addressLabels,
        socialPlatforms,
        relationshipOptions,
        educationDegrees,
        employmentTypes,
        skillCategories,
        skillProficiencies,
        defaultPhoneCountryCode: defaultCountryCode,
      }))();

  const countryCodeOptions = (() => {
    const list = (countryCodes || [])
      .map((countryItem) => normalizeDialCode(countryItem.code))
      .filter(Boolean);
    const fallback = normalizeDialCode(defaultCountryCode);
    return Array.from(new Set([fallback, ...list].filter(Boolean)));
  })();

  const countryOptions = (() => {
    const names = (countryCodes || []).map((entry) => entry.country).filter(Boolean);
    return Array.from(new Set([defaultCountry, ...names].filter(Boolean)));
  })();

  const updateCountryOptions = (nextCountries: string[]) => {
    updateCountryCodes(mergeCountryNameOptions(countryCodes, nextCountries));
  };

  const updateDialCodeOptions = (nextCodes: string[]) => {
    updateCountryCodes(mergeCountryDialCodeOptions(countryCodes, nextCodes));
  };

  return {
    optionDefaults,
    countryCodeOptions,
    countryOptions,
    updateCountryOptions,
    updateDialCodeOptions,
  };
}
