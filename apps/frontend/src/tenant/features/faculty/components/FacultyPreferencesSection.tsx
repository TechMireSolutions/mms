import React from "react";
import { ShieldCheck } from "lucide-react";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultySettings } from "@mms/shared";
import { FacultyIdSettingsCard } from "./FacultyIdSettingsCard";

export interface FacultyPreferencesSectionProps {
  settingsDraft: FacultySettings;
  upd: <K extends keyof FacultySettings>(field: K, value: FacultySettings[K]) => void;
  isPrefsDirty?: boolean;
  saving?: boolean;
  saved?: boolean;
  unsavedWarning?: string;
  onSave?: () => void | Promise<void>;
}

/** Faculty Setup Preferences body — Employee ID sequence & Registration governance. */
export function FacultyPreferencesSection({
  settingsDraft,
  upd,
  isPrefsDirty,
  saving,
  saved,
  unsavedWarning,
  onSave,
}: FacultyPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      {/* Employee ID Format & Generation Card */}
      <FacultyIdSettingsCard
        settingsDraft={settingsDraft}
        upd={upd}
      />

      {/* Registration & Identity Governance Card */}
      <SectionCard
        title={t("faculty.settings.registrationGovernance")}
        icon={ShieldCheck}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-3">
          <ToggleRow
            label={t("faculty.settings.requireContactLink")}
            description={t("faculty.settings.requireContactLinkDesc")}
            value={settingsDraft.requireContactLink}
            onChange={(value) => upd("requireContactLink", value)}
          />
        </div>
      </SectionCard>

      {/* Single authoritative Save footer for Faculty Preferences */}
      <ModuleSetupSaveFooter
        dirty={Boolean(isPrefsDirty)}
        saving={Boolean(saving)}
        saved={Boolean(saved)}
        unsavedWarning={unsavedWarning}
        saveLabel={saving ? t("global.saving") : t("common.save")}
        savedLabel={t("settings.savedBadge")}
        onSave={onSave ?? (() => {})}
        disableUnsavedGuard
        footerClassName="mt-4 pt-3"
      />
    </div>
  );
}
