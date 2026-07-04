import React from 'react';
import { Palette, Monitor, Wand2, ImageIcon, Loader2, Box } from 'lucide-react';
import { cornerStyleLabelKey, normalizeBrandingCornerStyle, normalizeThemeMode, resolveBrandingCornerRadius } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useApplyLogoColors } from '@/tenant/hooks/useApplyLogoColors';
import { useThemeSettingsDraft } from '@/tenant/features/settings/hooks/useThemeSettingsDraft';
import { useSettingsTab } from '@/lib/contexts/SettingsTabContext';
import { SectionCard } from '@/components/ui/SectionCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SettingsFormActions } from '@/components/ui/SettingsFormActions';
import BrandColorPanel from '@/tenant/features/settings/components/branding/BrandColorPanel';
import ThemeModeSelector from '@/tenant/features/settings/components/ThemeModeSelector';
import CornerStyleSelector from '@/tenant/features/settings/components/CornerStyleSelector';
import { FieldHint, FOOTER_MAX } from '@/tenant/features/settings/components/branding/BrandingShared';
import {
  SettingsColoursBadge,
  SettingsMetaBadge,
  SettingsPanel,
} from '@/components/ui/SettingsShell';

/**
 * All visual theming — display mode, brand colours, and footer (single settings tab).
 */
export default function ThemeSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { setActiveTab } = useSettingsTab();

  const {
    data,
    displayMode,
    setDisplayMode,
    previewMode,
    displayModeSummary,
    isDirty,
    saving,
    saved,
    upd,
    handleSave,
    defaultFooterPreview,
  } = useThemeSettingsDraft(t('theme.savedToast'), t('theme.savedToastDesc'));

  const { applying: applyingLogoColors, apply: applyLogoColors } = useApplyLogoColors({
    logoUrl: data.logoUrl,
    onPrimaryChange: (hex) => upd('primaryColor', hex),
    onSecondaryChange: (hex) => upd('secondaryColor', hex),
  });

  const footerPreview = data.footerText.trim() || defaultFooterPreview;

  return (
    <SettingsPanel
      width="wide"
      introKey="settings.introTheme"
      isDirty={isDirty}
      saved={saved}
      footer={
        <SettingsFormActions
          saveLabel={t('theme.save')}
          savingLabel={t('theme.saving')}
          onSave={() => void handleSave()}
          dirty={isDirty}
          saving={saving}
          saved={saved}
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium" aria-live="polite">
        <span className="text-muted-foreground">{t('theme.activeConfig')}:</span>
        <SettingsMetaBadge variant="primary">{displayModeSummary}</SettingsMetaBadge>
        <SettingsMetaBadge variant="muted">
          {t(
            cornerStyleLabelKey(normalizeBrandingCornerStyle(data.cornerStyle)),
            { radius: resolveBrandingCornerRadius(normalizeBrandingCornerStyle(data.cornerStyle)) }
          )}
        </SettingsMetaBadge>
        <SettingsColoursBadge
          primaryColor={data.primaryColor}
          secondaryColor={data.secondaryColor}
          ariaLabel={t('theme.coloursBadge', { primary: data.primaryColor, accent: data.secondaryColor })}
        />
      </div>

      <SectionCard
        title={t('theme.displayModeTitle')}
        subtitle={t('theme.displayModeDesc')}
        icon={Monitor}
      >
        <ThemeModeSelector
          value={normalizeThemeMode(displayMode)}
          onChange={(mode) => setDisplayMode(normalizeThemeMode(mode))}
        />
      </SectionCard>

      <SectionCard
        title={t('theme.cornerStyleTitle')}
        subtitle={t('theme.cornerStyleDesc')}
        icon={Box}
      >
        <CornerStyleSelector
          value={normalizeBrandingCornerStyle(data.cornerStyle)}
          onChange={(style) => upd('cornerStyle', style)}
        />
        <FieldHint id="corner-style-hint" className="mt-3">
          {t('theme.cornerStyleHint')}
        </FieldHint>
      </SectionCard>

      <SectionCard
        title={t('theme.coloursTitle')}
        subtitle={t('theme.coloursSubtitle')}
        icon={Palette}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={applyingLogoColors || !data.logoUrl.trim()}
              onClick={() => void applyLogoColors()}
            >
              {applyingLogoColors ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" aria-hidden />
              )}
              {applyingLogoColors ? t('theme.applyingLogoColors') : t('theme.applyLogoColors')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setActiveTab('branding')}>
              {t('theme.goToInstitution')}
            </Button>
          </div>
        }
      >
        {data.logoUrl.trim() ? (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
            <img
              src={data.logoUrl}
              alt={t('theme.logoSourceAlt')}
              className="h-10 w-10 shrink-0 rounded-lg border border-border object-contain bg-background"
            />
            <p className="text-xs text-muted-foreground">{t('theme.logoSourceHint')}</p>
          </div>
        ) : (
          <p className="mb-4 text-xs text-muted-foreground">{t('theme.logoSourceMissing')}</p>
        )}
        <BrandColorPanel
          primaryColor={data.primaryColor}
          secondaryColor={data.secondaryColor}
          previewMode={previewMode}
          onPrimaryChange={(hex) => upd('primaryColor', hex)}
          onSecondaryChange={(hex) => upd('secondaryColor', hex)}
          onApplyPreset={(primary, secondary) => {
            upd('primaryColor', primary);
            upd('secondaryColor', secondary);
          }}
        />
      </SectionCard>

      <SectionCard
        title={t('theme.footerTitle')}
        subtitle={t('theme.footerSubtitle')}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => upd('footerText', defaultFooterPreview)}>
            <Wand2 className="h-3.5 w-3.5" />
            {t('theme.footerGenerate')}
          </Button>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="footerText">{t('theme.footerLabel')}</Label>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {data.footerText.length}/{FOOTER_MAX}
            </span>
          </div>
          <Textarea
            id="footerText"
            value={data.footerText}
            maxLength={FOOTER_MAX}
            rows={2}
            placeholder={defaultFooterPreview}
            aria-describedby="footerText-hint"
            onChange={(event) => upd('footerText', event.target.value)}
          />
          <FieldHint id="footerText-hint">{t('theme.footerHint')}</FieldHint>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-[11px] font-medium text-muted-foreground">{t('theme.authPreviewLabel')}</p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col items-center gap-3 border-b border-border bg-muted/20 px-6 py-8">
              {data.logoUrl.trim() ? (
                <img
                  src={data.logoUrl}
                  alt={t('theme.authPreviewLogoAlt')}
                  className="h-12 w-12 rounded-lg border border-border object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                  {t('theme.authPreviewLogoPlaceholder')}
                </div>
              )}
              <p className="text-sm font-semibold text-foreground">
                {data.madrasaName.trim() || t('theme.authPreviewNamePlaceholder')}
              </p>
            </div>
            <p className="px-4 py-3 text-center text-xs text-muted-foreground">{footerPreview}</p>
          </div>
        </div>
      </SectionCard>
    </SettingsPanel>
  );
}
