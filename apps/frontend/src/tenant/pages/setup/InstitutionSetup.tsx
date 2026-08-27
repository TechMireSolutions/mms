import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, MapPin, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  type BrandingSettings,
  mergeBrandingSettings,
} from '@mms/shared';

import { useTranslation } from '@/hooks/useTranslation';
import { useBranding } from '@/tenant/hooks/useBranding';
import { saveBrandingSettings } from '@/lib/db';
import { ROUTES } from '@/lib/config/routes';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/ui/SectionCard';
import BrandingIdentityPreview from '@/components/branding/BrandingIdentityPreview';
import EntryPageHead, { formatEntryTitle } from '@/components/entry/EntryPageHead';

interface FieldErrors {
  madrasaName?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export default function InstitutionSetup(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentBranding = useBranding();

  const [data, setData] = useState<BrandingSettings>(() =>
    mergeBrandingSettings(currentBranding),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof BrandingSettings>(
    field: K,
    value: BrandingSettings[K],
  ): void => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    const reqKey = t('institutionSetup.fieldRequired');

    if (!data.madrasaName.trim()) nextErrors.madrasaName = reqKey;
    if (!data.tagline.trim()) nextErrors.tagline = reqKey;
    if (!data.email.trim()) nextErrors.email = reqKey;
    if (!data.phone.trim()) nextErrors.phone = reqKey;
    if (!data.addressLine1.trim()) nextErrors.addressLine1 = reqKey;
    if (!data.city.trim()) nextErrors.city = reqKey;
    if (!data.country.trim()) nextErrors.country = reqKey;
    if (!data.postalCode.trim()) nextErrors.postalCode = reqKey;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!validate()) {
      notify.error(t('common.formPleaseFixErrors'), {
        description: t('institutionSetup.fieldRequired'),
      });
      return;
    }

    setSaving(true);
    try {
      const merged = mergeBrandingSettings(data);
      const res = await saveBrandingSettings(merged);
      if (!res.ok) {
        throw new Error('Failed to persist institution settings');
      }
      notify.success(t('institutionSetup.success'), {
        description: t('branding.savedToastDesc'),
      });
      navigate(ROUTES.home, { replace: true });
    } catch (err: unknown) {
      notify.error(
        err instanceof Error ? err.message : t('branding.imageErrorUpload'),
      );
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = formatEntryTitle(
    t('institutionSetup.title'),
    t('entry.productName'),
  );

  return (
    <>
      <EntryPageHead
        title={pageTitle}
        description={t('institutionSetup.subtitle')}
      />

      <main className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header Banner */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-6 w-6" aria-hidden />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {t('institutionSetup.title')}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3 w-3" />
                    {t('common.required')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('institutionSetup.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Form inputs (2 cols) */}
              <div className="space-y-6 lg:col-span-2">
                {/* 1. Identity */}
                <SectionCard
                  title={t('institutionSetup.identitySection')}
                  subtitle={t('institutionSetup.identitySectionDesc')}
                  icon={Building2}
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="setup-madrasaName" className="font-semibold">
                        {t('branding.madrasaName')} *
                      </Label>
                      <Input
                        id="setup-madrasaName"
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
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="setup-email" className="font-semibold">
                        {t('branding.email')} *
                      </Label>
                      <Input
                        id="setup-email"
                        type="email"
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
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="setup-addressLine1" className="font-semibold">
                        {t('branding.addressLine1')} *
                      </Label>
                      <Input
                        id="setup-addressLine1"
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
                </SectionCard>
              </div>

              {/* Sidebar Preview (1 col) */}
              <div className="space-y-6">
                <div className="sticky top-6 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">
                      {t('branding.previewTitle')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('branding.previewSubtitle')}
                    </p>
                  </div>
                  <BrandingIdentityPreview data={data} />

                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('common.actions')}
                    </h3>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full min-h-11 rounded-xl text-sm font-semibold shadow-sm"
                    >
                      {saving ? (
                        t('institutionSetup.saving')
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          {t('institutionSetup.submit')}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
