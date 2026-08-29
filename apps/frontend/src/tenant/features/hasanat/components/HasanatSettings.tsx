import React, { useEffect } from "react";
import { Star } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useHasanatSetupPanelState } from "@/tenant/features/hasanat/hooks/useHasanatSetupPanelState";

export interface HasanatSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const HasanatSettings = React.memo(function HasanatSettings({
  onPrefsDirtyChange,
}: HasanatSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useHasanatSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("hasanat.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <SectionCard
      accentColor="primary"
      icon={Star}
      title={t("hasanat.settings.titlePreferences")}
      className="shadow-sm hover:shadow-md border-border/80 max-w-3xl text-start"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="points-per-unit" className={FORM_LABEL}>
              {t("hasanat.settings.pointsPerUnit")}
            </label>
            <Input
              id="points-per-unit"
              type="number"
              className={FORM_INPUT}
              value={settingsDraft.pointsPerUnit || 10}
              onChange={(event) => upd("pointsPerUnit", Number(event.target.value))}
            />
          </div>
        </div>
        <div className="pt-1">
          <ToggleRow
            label={t("hasanat.settings.autoApprovePayouts")}
            description={t("hasanat.settings.autoApprovePayoutsHint")}
            value={settingsDraft.autoApprovePayouts || false}
            onChange={(value) => upd("autoApprovePayouts", value)}
          />
        </div>

        <ModuleSetupSaveFooter
          dirty={isPrefsDirty}
          saving={saving}
          saved={saved}
          unsavedWarning={unsavedWarning}
          saveLabel={t("common.save")}
          savedLabel={t("settings.savedBadge")}
          onSave={handleSave}
        />
      </div>
    </SectionCard>
  );
});

export default HasanatSettings;
