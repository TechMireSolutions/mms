import React from 'react';
import { Building2, MapPin, Share2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsBrandingDraft } from '@/lib/contexts/SettingsBrandingDraftContext';
import { SectionCard } from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsFormActions } from '@/components/ui/SettingsFormActions';
import BrandingIdentityPreview from '@/components/branding/BrandingIdentityPreview';
import { SettingsPanel } from '@/components/ui/SettingsShell';
import { SocialLinksEditor } from '@/components/branding/BrandingShared';
import {
  BrandingSettingsContactSection,
  BrandingSettingsProfileSection,
} from '@/tenant/features/settings/components/branding/BrandingSettingsIdentitySections';

/**
 * Institution identity — name, logo, contact, address, and social profiles.
 * Theme colours live in ThemeSettings (`/settings/theme`).
 */
export default function BrandingSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    data,
    isIdentityDirty,
    saved,
    saving,
    upd,
    handleSaveIdentity,
    handleDiscardIdentity,
  } = useSettingsBrandingDraft();

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
          onDiscard={handleDiscardIdentity}
          discardLabel={t('theme.discardChanges')}
          dirty={isIdentityDirty}
          saving={saving}
          saved={saved}
        />
      }
    >
      <SectionCard title={t('branding.previewTitle')} subtitle={t('branding.previewSubtitle')}>
        <BrandingIdentityPreview data={data} />
      </SectionCard>

      <BrandingSettingsProfileSection data={data} upd={upd} />
      <BrandingSettingsContactSection data={data} upd={upd} />

      <SectionCard title={t('branding.addressTitle')} subtitle={t('branding.addressSubtitle')} icon={MapPin}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">{t('branding.addressLine1')}</Label>
            <Input
              id="addressLine1"
              value={data.addressLine1}
              autoComplete="address-line1"
              onChange={(event) => upd('addressLine1', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">{t('branding.addressLine2')}</Label>
            <Input
              id="addressLine2"
              value={data.addressLine2}
              autoComplete="address-line2"
              onChange={(event) => upd('addressLine2', event.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">{t('branding.city')}</Label>
              <Input id="city" value={data.city} autoComplete="address-level2" onChange={(event) => upd('city', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">{t('branding.region')}</Label>
              <Input id="region" value={data.region} autoComplete="address-level1" onChange={(event) => upd('region', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">{t('branding.postalCode')}</Label>
              <Input id="postalCode" value={data.postalCode} autoComplete="postal-code" onChange={(event) => upd('postalCode', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('branding.country')}</Label>
              <Input id="country" value={data.country} autoComplete="country-name" onChange={(event) => upd('country', event.target.value)} />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title={t('branding.legalTitle')} subtitle={t('branding.legalSubtitle')} icon={Building2}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">{t('branding.legalName')}</Label>
              <Input id="legalName" value={data.legalName} onChange={(event) => upd('legalName', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">{t('branding.registrationNumber')}</Label>
              <Input id="registrationNumber" value={data.registrationNumber} onChange={(event) => upd('registrationNumber', event.target.value)} />
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
