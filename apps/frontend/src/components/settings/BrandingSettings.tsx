import React from 'react';
import { Mail, Phone, Globe, MapPin, Share2, Building2, Type,
} from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useSettingsBrandingDraft } from '@/lib/contexts/SettingsBrandingDraftContext';
import SectionCard from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsFormActions from '@/components/ui/SettingsFormActions';
import BrandingIdentityPreview from '@/components/branding/BrandingIdentityPreview';
import { SettingsPanel } from '@/components/ui/SettingsShell';
import {
  FieldHint,
  ImageUploadField,
  NAME_MAX,
  SocialLinksEditor,
  TAGLINE_MAX,
} from '@/components/branding/BrandingShared';

/**
 * Institution identity — name, logo, contact, address, and social profiles.
 * Theme colours live in ThemeSettings (`/settings/theme`).
 */
export default function BrandingSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { data, isIdentityDirty, saved, saving, upd, handleSaveIdentity } =
    useSettingsBrandingDraft();

  return (
    <SettingsPanel
      width="medium"
      introKey="settings.introBranding"
      isDirty={isIdentityDirty}
      saved={saved}
      footer={
        <SettingsFormActions
          saveLabel={t('branding.save')}
          savingLabel={t('branding.saving')}
          onSave={() =>
            void handleSaveIdentity({
              saveSuccessMessage: t('branding.savedToast'),
              saveSuccessDescription: t('branding.savedToastDesc'),
            })
          }
          dirty={isIdentityDirty}
          saving={saving}
          saved={saved}
        />
      }
    >
      <SectionCard title={t('branding.previewTitle')} subtitle={t('branding.previewSubtitle')}>
        <BrandingIdentityPreview data={data} />
      </SectionCard>

      <SectionCard title={t('branding.profileTitle')} subtitle={t('branding.profileDesc')} icon={Type}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="madrasaName">{t('branding.madrasaName')}</Label>
                <span className="text-xs text-muted-foreground" aria-live="polite">
                  {data.madrasaName.length}/{NAME_MAX}
                </span>
              </div>
              <Input
                id="madrasaName"
                value={data.madrasaName}
                maxLength={NAME_MAX}
                placeholder={t('branding.madrasaNamePlaceholder')}
                aria-describedby="madrasaName-hint"
                onChange={(e) => upd('madrasaName', e.target.value)}
              />
              <FieldHint id="madrasaName-hint">{t('branding.madrasaNameHint')}</FieldHint>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="tagline">{t('branding.tagline')}</Label>
                <span className="text-xs text-muted-foreground" aria-live="polite">
                  {data.tagline.length}/{TAGLINE_MAX}
                </span>
              </div>
              <Input
                id="tagline"
                value={data.tagline}
                maxLength={TAGLINE_MAX}
                placeholder={t('branding.taglinePlaceholder')}
                aria-describedby="tagline-hint"
                onChange={(e) => upd('tagline', e.target.value)}
              />
              <FieldHint id="tagline-hint">{t('branding.taglineHint')}</FieldHint>
            </div>
          </div>
          <div className="space-y-6">
            <ImageUploadField
              id="branding-logo"
              label={t('branding.logo')}
              hint={t('branding.logoHint')}
              value={data.logoUrl}
              purpose="logo"
              onChange={(url) => upd('logoUrl', url)}
              onClear={() => upd('logoUrl', '')}
              onBrandColorsExtracted={(colors) => {
                upd('primaryColor', colors.primaryColor);
                upd('secondaryColor', colors.secondaryColor);
                notify.success(t('branding.logoColorsApplied'), {
                  description: t('branding.logoColorsAppliedDesc'),
                });
              }}
            />
            <ImageUploadField
              id="branding-favicon"
              label={t('branding.favicon')}
              hint={t('branding.faviconHint')}
              value={data.faviconUrl}
              onChange={(url) => upd('faviconUrl', url)}
              onClear={() => upd('faviconUrl', '')}
              purpose="favicon"
              previewSize="favicon"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('branding.contactTitle')} subtitle={t('branding.contactSubtitle')} icon={Mail}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branding-email">{t('branding.email')}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="branding-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={data.email}
                placeholder={t('branding.emailPlaceholder')}
                className="pl-9"
                onChange={(e) => upd('email', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branding-phone">{t('branding.phone')}</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="branding-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={data.phone}
                placeholder={t('branding.phonePlaceholder')}
                className="pl-9"
                onChange={(e) => upd('phone', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="branding-website">{t('branding.website')}</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="branding-website"
                type="url"
                inputMode="url"
                value={data.website}
                placeholder={t('branding.websitePlaceholder')}
                className="pl-9"
                onChange={(e) => upd('website', e.target.value)}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('branding.addressTitle')} subtitle={t('branding.addressSubtitle')} icon={MapPin}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">{t('branding.addressLine1')}</Label>
            <Input
              id="addressLine1"
              value={data.addressLine1}
              autoComplete="address-line1"
              onChange={(e) => upd('addressLine1', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">{t('branding.addressLine2')}</Label>
            <Input
              id="addressLine2"
              value={data.addressLine2}
              autoComplete="address-line2"
              onChange={(e) => upd('addressLine2', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">{t('branding.city')}</Label>
              <Input id="city" value={data.city} autoComplete="address-level2" onChange={(e) => upd('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">{t('branding.region')}</Label>
              <Input id="region" value={data.region} autoComplete="address-level1" onChange={(e) => upd('region', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">{t('branding.postalCode')}</Label>
              <Input id="postalCode" value={data.postalCode} autoComplete="postal-code" onChange={(e) => upd('postalCode', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('branding.country')}</Label>
              <Input id="country" value={data.country} autoComplete="country-name" onChange={(e) => upd('country', e.target.value)} />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title={t('branding.legalTitle')} subtitle={t('branding.legalSubtitle')} icon={Building2}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">{t('branding.legalName')}</Label>
              <Input id="legalName" value={data.legalName} onChange={(e) => upd('legalName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">{t('branding.registrationNumber')}</Label>
              <Input id="registrationNumber" value={data.registrationNumber} onChange={(e) => upd('registrationNumber', e.target.value)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t('branding.socialTitle')} subtitle={t('branding.socialSubtitle')} icon={Share2}>
          <SocialLinksEditor links={data.socialLinks} onChange={(links) => upd('socialLinks', links)} />
        </SectionCard>
      </div>
    </SettingsPanel>
  );
}
