import React from 'react';
import { MapPin } from 'lucide-react';
import type { BrandingSettings } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/ui/SectionCard';
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from '@/components/ui/formStyles';
import type { InstitutionSetupFieldErrors } from './InstitutionSetupFormSections';

export interface InstitutionSetupAddressSectionProps {
  data: BrandingSettings;
  errors: InstitutionSetupFieldErrors;
  updateField: <K extends keyof BrandingSettings>(
    field: K,
    value: BrandingSettings[K],
  ) => void;
}

export function InstitutionSetupAddressSection({
  data,
  errors,
  updateField,
}: InstitutionSetupAddressSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
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
            value={data.addressLine1 || ''}
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
            value={data.addressLine2 || ''}
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
              value={data.city || ''}
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
              value={data.region || ''}
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
              value={data.postalCode || ''}
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
              value={data.country || ''}
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
  );
}
