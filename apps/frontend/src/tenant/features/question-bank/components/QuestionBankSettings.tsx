import React, { useEffect } from "react";
import { Library } from "lucide-react";
import {
  type QuestionDifficultyRegistryEntry,
  type QuestionTypeRegistryEntry,
  type AppTranslationKey,
} from "@mms/shared";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CategoryManager } from "@/tenant/features/question-bank/components/CategoryManager";
import { useQuestionBankSetupPanelState } from "@/tenant/features/question-bank/hooks/useQuestionBankSetupPanelState";

export interface QuestionBankSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const QuestionBankSettings = React.memo(function QuestionBankSettings({
  onPrefsDirtyChange,
}: QuestionBankSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useQuestionBankSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const toggleQuestionType = (questionTypeId: string): void => {
    const types = settingsDraft.questionTypes ?? [];
    const updated = types.map((entry) =>
      entry.id === questionTypeId ? { ...entry, enabled: !entry.enabled } : entry,
    );
    upd("questionTypes", updated);
  };

  const toggleDifficulty = (difficultyId: string): void => {
    const diffs = settingsDraft.difficultyLevels ?? [];
    const updated = diffs.map((entry) =>
      entry.id === difficultyId ? { ...entry, enabled: !entry.enabled } : entry,
    );
    upd("difficultyLevels", updated);
  };

  const unsavedWarning = isPrefsDirty
    ? t("questionBank.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <SectionCard
      accentColor="primary"
      icon={Library}
      title={t("questionBank.settingsPrefsTitle")}
      className="space-y-4 shadow-sm hover:shadow-md border-border/80 max-w-3xl text-start"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t("questionBank.aiGrading")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("questionBank.aiGradingDesc")}
          </p>
        </div>
        <Switch
          checked={settingsDraft.aiGrading}
          onCheckedChange={(v) => upd("aiGrading", v)}
          aria-label={t("questionBank.aiGrading")}
        />
      </div>

      <div>
        <label className={FORM_LABEL} htmlFor="qb-default-duration">
          {t("questionBank.defaultDuration")}
        </label>
        <Input
          id="qb-default-duration"
          type="number"
          min={5}
          className={FORM_INPUT}
          value={settingsDraft.defaultTestDuration}
          onChange={(event) =>
            upd("defaultTestDuration", Number(event.target.value) || 30)
          }
        />
      </div>

      <CategoryManager
        categories={settingsDraft.categories ?? []}
        onChange={(categories) => upd("categories", categories)}
      />

      <div className="space-y-2 border-t border-border/60 pt-3">
        <SectionLabel as="h4" weight="bold" tracking="wide">
          {t("questionBank.typesTitle")}
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {(settingsDraft.questionTypes ?? []).map(
            (entry: QuestionTypeRegistryEntry) => (
              <Button
                key={entry.id}
                type="button"
                variant="outline"
                onClick={() => toggleQuestionType(entry.id)}
                className={`rounded-full border px-3 text-xs font-semibold transition-colors min-h-11 ${
                  entry.enabled
                    ? "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {t(`questionBank.type.${entry.id}` as AppTranslationKey)}
              </Button>
            ),
          )}
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel as="h4" weight="bold" tracking="wide">
          {t("questionBank.difficultiesTitle")}
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {(settingsDraft.difficultyLevels ?? []).map(
            (entry: QuestionDifficultyRegistryEntry) => (
              <Button
                key={entry.id}
                type="button"
                variant="outline"
                onClick={() => toggleDifficulty(entry.id)}
                className={`rounded-full border px-3 text-xs font-semibold transition-colors min-h-11 ${
                  entry.enabled
                    ? "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {t(`questionBank.difficulty.${entry.id}` as AppTranslationKey)}
              </Button>
            ),
          )}
        </div>
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
    </SectionCard>
  );
});

export default QuestionBankSettings;
