import type React from "react";
import { Users } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import type { Contact, Student } from "@mms/shared";
import {
  FieldError,
  type StudentFieldErrorGetter,
} from "@/tenant/features/students/components/StudentFormSectionShared";

function resolveGenderOption(genders: string[], preferred: string, fallbackIndex: number): string {
  const match = genders.find((option) => option.toLowerCase() === preferred.toLowerCase());
  return match ?? genders[fallbackIndex] ?? genders[0] ?? preferred;
}

interface StudentGuardianSectionProps {
  enabled: boolean;
  studentDraft: Partial<Student>;
  fatherExcludeIds: string[];
  motherExcludeIds: string[];
  guardianExcludeIds: string[];
  getFieldError: StudentFieldErrorGetter;
  isFieldEnabled: (fieldId: string) => boolean;
  onParentSelect: (
    role: "father" | "mother" | "guardian",
    id: string | number | null,
    contactObj?: Contact | null,
  ) => void;
}

export function StudentGuardianSection({
  enabled,
  studentDraft,
  fatherExcludeIds,
  motherExcludeIds,
  guardianExcludeIds,
  getFieldError,
  isFieldEnabled,
  onParentSelect,
}: StudentGuardianSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { genders } = useContactConfig();
  const fatherGender = resolveGenderOption(genders, "male", 0);
  const motherGender = resolveGenderOption(genders, "female", 1);
  if (!enabled) return null;

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.guardiansSection")}
        subtitle={t("students.form.guardiansSectionDesc")}
        icon={Users}
        accentColor="info"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isFieldEnabled("fatherLink") && (
            <div className="space-y-1">
              <ContactPicker
                label={t("students.form.fatherLink")}
                value={studentDraft.fatherContactId ? String(studentDraft.fatherContactId) : null}
                onChange={(id, contactObj) => onParentSelect("father", id, contactObj)}
                filterGender={fatherGender}
                createDefaults={{ gender: fatherGender.toLowerCase(), lockGender: true }}
                excludeIds={fatherExcludeIds}
                searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                emptyTitle={t("contacts.picker.emptyTitle")}
                error={!!getFieldError("fatherLink")}
              />
              <FieldError message={getFieldError("fatherLink")} />
            </div>
          )}

          {isFieldEnabled("motherLink") && (
            <div className="space-y-1">
              <ContactPicker
                label={t("students.form.motherLink")}
                value={studentDraft.motherContactId ? String(studentDraft.motherContactId) : null}
                onChange={(id, contactObj) => onParentSelect("mother", id, contactObj)}
                filterGender={motherGender}
                createDefaults={{ gender: motherGender.toLowerCase(), lockGender: true }}
                excludeIds={motherExcludeIds}
                searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                emptyTitle={t("contacts.picker.emptyTitle")}
                error={!!getFieldError("motherLink")}
              />
              <FieldError message={getFieldError("motherLink")} />
            </div>
          )}

          {isFieldEnabled("guardianLink") && (
            <div className="sm:col-span-2 space-y-1">
              <ContactPicker
                label={t("students.form.guardianLink")}
                value={studentDraft.guardianContactId ? String(studentDraft.guardianContactId) : null}
                onChange={(id, contactObj) => onParentSelect("guardian", id, contactObj)}
                excludeIds={guardianExcludeIds}
                searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                emptyTitle={t("contacts.picker.emptyTitle")}
                error={!!getFieldError("guardianLink")}
              />
              <FieldError message={getFieldError("guardianLink")} />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
