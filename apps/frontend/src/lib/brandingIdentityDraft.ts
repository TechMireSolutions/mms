import {
  BRANDING_IDENTITY_FIELD_KEYS,
  BRANDING_THEME_FIELD_KEYS,
  mergeBrandingSettings,
  pickBrandingFields,
  type BrandingSettings,
} from '@mms/shared';

/** Persist institution fields from draft; keep theme/appearance from baseline. */
export function mergeBrandingIdentityForSave(
  draft: BrandingSettings,
  baseline: BrandingSettings,
): BrandingSettings {
  return mergeBrandingSettings({
    ...baseline,
    ...pickBrandingFields(draft, BRANDING_IDENTITY_FIELD_KEYS),
  });
}

/** After identity save, keep unsaved theme-field edits in the shared draft. */
export function retainThemeDraftAfterIdentitySave(
  persisted: BrandingSettings,
  draft: BrandingSettings,
): BrandingSettings {
  return mergeBrandingSettings({
    ...persisted,
    ...pickBrandingFields(draft, BRANDING_THEME_FIELD_KEYS),
  });
}
