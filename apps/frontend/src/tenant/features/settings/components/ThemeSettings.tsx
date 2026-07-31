import React from 'react';
import { Monitor, Box } from 'lucide-react';
import { cornerStyleLabelKey, normalizeBrandingCornerStyle, normalizeThemeMode, resolveBrandingCornerRadius } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useApplyLogoColors } from '@/tenant/hooks/useApplyLogoColors';
import { useThemeSettingsDraft } from '@/tenant/features/settings/hooks/useThemeSettingsDraft';
import { useSettingsTab } from '@/lib/contexts/SettingsTabContext';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsFormActions } from '@/components/ui/SettingsFormActions';
import ThemeModeSelector from '@/tenant/features/settings/components/ThemeModeSelector';
import CornerStyleSelector from '@/tenant/features/settings/components/CornerStyleSelector';
import { FieldHint } from '@/components/branding/BrandingShared';
import {
  SettingsColoursBadge,
  SettingsMetaBadge,
  SettingsPanel,
} from '@/components/ui/SettingsShell';
import { ThemeSettingsColoursSection } from '@/tenant/features/settings/components/ThemeSettingsColoursSection';
import { ThemeSettingsFooterSection } from '@/tenant/features/settings/components/ThemeSettingsFooterSection';

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
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium" aria-live="polite">
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

      <ThemeSettingsColoursSection
        t={t}
        logoUrl={data.logoUrl}
        primaryColor={data.primaryColor}
        secondaryColor={data.secondaryColor}
        previewMode={previewMode}
        applyingLogoColors={applyingLogoColors}
        onApplyLogoColors={() => void applyLogoColors()}
        onGoToInstitution={() => setActiveTab('branding')}
        onPrimaryChange={(hex) => upd('primaryColor', hex)}
        onSecondaryChange={(hex) => upd('secondaryColor', hex)}
        onApplyPreset={(primary, secondary) => {
          upd('primaryColor', primary);
          upd('secondaryColor', secondary);
        }}
      />

      <ThemeSettingsFooterSection
        t={t}
        footerText={data.footerText}
        footerPreview={footerPreview}
        defaultFooterPreview={defaultFooterPreview}
        logoUrl={data.logoUrl}
        madrasaName={data.madrasaName}
        onFooterChange={(value) => upd('footerText', value)}
        onGenerateFooter={() => upd('footerText', defaultFooterPreview)}
      />
    </SettingsPanel>
  );
}
