import { type HasanatSettings as HasanatSettingsType } from "@mms/shared";
import React from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Save, Star } from "lucide-react";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { notify } from "@/lib/notify";

export const HasanatSettings = React.memo(function HasanatSettings(): React.ReactElement {
      const { t } = useTranslation();
      const config = useHasanatConfig();
      const {
        settingsDraft,
        saved,
        upd,
        saveSettingsAsync,
      } = useModuleSettingsEditor<HasanatSettingsType>({
        config,
      });

      const handleSave = async () => {
        try {
          await saveSettingsAsync();
          notify.success(t("hasanat.settings.saved"));
        } catch (error: unknown) {
          notify.error(t("hasanat.settings.saveFailed"), {
            description: error instanceof Error ? error.message : String(error),
          });
        }
      };

      return (
        <SectionCard
          accentColor="primary"
          icon={Star}
          title={t("hasanat.settings.titlePreferences")}
          className="shadow-sm hover:shadow-md border-border/80"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="points-per-unit" className={FORM_LABEL}>{t("hasanat.settings.pointsPerUnit")}</label>
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
          </div>

          <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
            <Button
              type="button"
              onClick={() => { void handleSave(); }}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? t("hasanat.settings.btnSaved") : t("hasanat.settings.btnSave")}
            </Button>
          </footer>
        </SectionCard>
      );
    });
