import React from "react";
import type { TeacherLookupKind } from "@mms/shared";
import { ModuleStringListLookupEditor } from "@/components/ui/ModuleStringListLookupEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { useTeacherLookupMutation } from "@/tenant/features/teachers/hooks/useTeacherLookups";

type LookupKindEditorProps = {
  kind: TeacherLookupKind;
  titleKey: "teachers.setup.lookupsStatuses" | "teachers.setup.lookupsSpecializations";
  hintKey: "teachers.setup.lookupsStatusesHint" | "teachers.setup.lookupsSpecializationsHint";
  items: string[];
};

function LookupKindEditor({
  kind,
  titleKey,
  hintKey,
  items,
}: LookupKindEditorProps): React.ReactElement {
  const mutation = useTeacherLookupMutation();

  return (
    <ModuleStringListLookupEditor
      titleKey={titleKey}
      hintKey={hintKey}
      items={items}
      addPlaceholderKey="teachers.setup.lookupsAddPlaceholder"
      savedToastKey="teachers.setup.lookupsSaved"
      saveFailedToastKey="teachers.setup.lookupsSaveFailed"
      onPersist={async (next) => {
        await mutation.mutateAsync({ kind, items: next });
      }}
    />
  );
}

export function TeachersSettingsLookupsPanel(): React.ReactElement {
  const { statuses, specializations } = useTeacherConfig();
  const { t } = useTranslation();

  return (
    <div className="space-y-6" aria-label={t("teachers.setup.lookups")}>
      <LookupKindEditor
        kind="statuses"
        titleKey="teachers.setup.lookupsStatuses"
        hintKey="teachers.setup.lookupsStatusesHint"
        items={statuses}
      />
      <LookupKindEditor
        kind="specializations"
        titleKey="teachers.setup.lookupsSpecializations"
        hintKey="teachers.setup.lookupsSpecializationsHint"
        items={specializations}
      />
    </div>
  );
}
