import React from "react";
import type { StudentLookupKind } from "@mms/shared";
import { ModuleStringListLookupEditor } from "@/components/ui/ModuleStringListLookupEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useStudentLookupMutation } from "@/tenant/features/students/hooks/useStudentLookups";

type LookupKindEditorProps = {
  kind: Exclude<StudentLookupKind, "discountTypes">;
  titleKey: "students.setup.lookupsStatuses" | "students.setup.lookupsGenderFilters";
  hintKey: "students.setup.lookupsStatusesHint" | "students.setup.lookupsGenderFiltersHint";
  items: string[];
};

function LookupKindEditor({
  kind,
  titleKey,
  hintKey,
  items,
}: LookupKindEditorProps): React.ReactElement {
  const mutation = useStudentLookupMutation();

  return (
    <ModuleStringListLookupEditor
      titleKey={titleKey}
      hintKey={hintKey}
      items={items}
      addPlaceholderKey="students.setup.lookupsAddPlaceholder"
      savedToastKey="students.setup.lookupsSaved"
      saveFailedToastKey="students.setup.lookupsSaveFailed"
      onPersist={async (next) => {
        await mutation.mutateAsync({ kind, items: next });
      }}
    />
  );
}

export function StudentsSettingsLookupsPanel(): React.ReactElement {
  const { statuses, genderFilters } = useStudentConfig();
  const { t } = useTranslation();

  return (
    <div className="space-y-6" aria-label={t("students.setup.lookups")}>
      <LookupKindEditor
        kind="statuses"
        titleKey="students.setup.lookupsStatuses"
        hintKey="students.setup.lookupsStatusesHint"
        items={statuses}
      />
      <LookupKindEditor
        kind="genderFilters"
        titleKey="students.setup.lookupsGenderFilters"
        hintKey="students.setup.lookupsGenderFiltersHint"
        items={genderFilters}
      />
    </div>
  );
}
