import React from 'react';
import { Building2, Mail } from 'lucide-react';
import type { BrandingSettings } from '@mms/shared';

import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/ui/SectionCard';
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from '@/components/ui/formStyles';
import { InstitutionSetupAddressSection } from './InstitutionSetupAddressSection';

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
      <InstitutionSetupAddressSection
        data={data}
        errors={errors}
        updateField={updateField}
      />
    </div>
  );
}