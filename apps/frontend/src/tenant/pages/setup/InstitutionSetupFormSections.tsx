import React from 'react';
import { Building2, Mail, MapPin } from 'lucide-react';
import type { BrandingSettings } from '@mms/shared';

import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/ui/SectionCard';
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from '@/components/ui/formStyles';

export interface InstitutionSetupFieldErrors {
  madrasaName?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface InstitutionSetupFormSectionProps {
  data: BrandingSettings;
  errors: InstitutionSetupFieldErrors;
  updateField: <K extends keyof BrandingSettings>(
    field: K,
    value: BrandingSettings[K],
  ) => void;
}

/** Identity / Official Contact / Campus Address cards for the first-run setup wizard. */
export function InstitutionSetupFormSections({
  data,
  errors,
  updateField,
}: InstitutionSetupFormSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* 1. Identity */}
      <SectionCard
        title={t('institutionSetup.identitySection')}
        subtitle={t('institutionSetup.identitySectionDesc')}
        icon={Building2}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="setup-madrasaName" className="font-semibold">
              {t('branding.madrasaName')} *
            </Label>
            <Input
              id="setup-madrasaName"
              className={FORM_INPUT}
              value={data.madrasaName}
              onChange={(e) => updateField('madrasaName', e.target.value)}
              placeholder={t('branding.madrasaNamePlaceholder')}
              aria-invalid={Boolean(errors.madrasaName)}
            />
            {errors.madrasaName ? (
              <p className="text-xs text-destructive">{errors.madrasaName}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('branding.madrasaNameHint')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setup-tagline" className="font-semibold">
              {t('branding.tagline')} *
            </Label>
            <Input
              id="setup-tagline"
              className={FORM_INPUT}
              value={data.tagline}
              onChange={(e) => updateField('tagline', e.target.value)}
              placeholder={t('institutionSetup.taglinePlaceholder')}
              aria-invalid={Boolean(errors.tagline)}
            />
            {errors.tagline && (
              <p className="text-xs text-destructive">{errors.tagline}</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* 2. Official Contact */}
      <SectionCard
        title={t('institutionSetup.contactSection')}
        subtitle={t('institutionSetup.contactSectionDesc')}
        icon={Mail}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="setup-email" className="font-semibold">
              {t('branding.email')} *
            </Label>
            <Input
              id="setup-email"
              type="email"
              className={FORM_INPUT}
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder={t('branding.emailPlaceholder')}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setup-phone" className="font-semibold">
              {t('branding.phone')} *
            </Label>
            <Input
              id="setup-phone"
              type="tel"
              className={FORM_INPUT}
              value={data.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder={t('branding.phonePlaceholder')}
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="setup-website">{t('branding.website')}</Label>
            <Input
              id="setup-website"
              type="url"
              className={FORM_INPUT}
              value={data.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://www.yourmadrasa.org"
            />
          </div>
        </div>
      </SectionCard>

      {/* 3. Campus Address */}
      <SectionCard
        title={t('institutionSetup.addressSection')}
        subtitle={t('institutionSetup.addressSectionDesc')}
        icon={MapPin}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="setup-addressLine1" className="font-semibold">
              {t('branding.addressLine1')} *
            </Label>
            <Input
              id="setup-addressLine1"
              className={FORM_INPUT}
              value={data.addressLine1}
              onChange={(e) => updateField('addressLine1', e.target.value)}
              placeholder="e.g. 123 Education Way"
              aria-invalid={Boolean(errors.addressLine1)}
            />
            {errors.addressLine1 && (
              <p className="text-xs text-destructive">{errors.addressLine1}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setup-addressLine2">{t('branding.addressLine2')}</Label>
            <Input
              id="setup-addressLine2"
              className={FORM_INPUT}
              value={data.addressLine2}
              onChange={(e) => updateField('addressLine2', e.target.value)}
              placeholder="Suite, building, floor (optional)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="setup-city" className="font-semibold">
                {t('branding.city')} *
              </Label>
              <Input
                id="setup-city"
                className={FORM_INPUT}
                value={data.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="City / Town"
                aria-invalid={Boolean(errors.city)}
              />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setup-region">{t('branding.region')}</Label>
              <Input
                id="setup-region"
                className={FORM_INPUT}
                value={data.region}
                onChange={(e) => updateField('region', e.target.value)}
                placeholder="State / Province / County"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setup-postalCode" className="font-semibold">
                {t('branding.postalCode')} *
              </Label>
              <Input
                id="setup-postalCode"
                className={FORM_INPUT}
                value={data.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                placeholder="Postal / Zip code"
                aria-invalid={Boolean(errors.postalCode)}
              />
              {errors.postalCode && (
                <p className="text-xs text-destructive">{errors.postalCode}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setup-country" className="font-semibold">
                {t('branding.country')} *
              </Label>
              <Input
                id="setup-country"
                className={FORM_INPUT}
                value={data.country}
                onChange={(e) => updateField('country', e.target.value)}
                placeholder={t('branding.countryPlaceholder')}
                aria-invalid={Boolean(errors.country)}
              />
              {errors.country && (
                <p className="text-xs text-destructive">{errors.country}</p>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          {t('branding.locationGlobalDefaultsNote')}
        </p>
      </SectionCard>
    </div>
  );
}