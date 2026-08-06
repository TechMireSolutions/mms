import type React from "react";
import { Calendar, User } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import type { FieldDefinition } from "@mms/shared";
import {
  ContactProfileValue,
  FieldError,
  resolveStudentFieldLabel,
  type StudentFieldErrorGetter,
} from "@/tenant/features/students/components/StudentFormSectionShared";

interface StudentContactSectionProps {
  contactId?: string | number | null;
  excludeIds: string[];
  linkedGenderRaw?: string;
  linkedGenderLabel: string;
  linkedDob: string;
  genderError?: string;
  dobError?: string;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: StudentFieldErrorGetter;
  onContactSelect: (id: string | number | null) => void;
  onStudentAvatarChange: (avatarUrl: string) => void | Promise<void>;
}

export function StudentContactSection({
  contactId,
  excludeIds,
  linkedGenderRaw,
  linkedGenderLabel,
  linkedDob,
  genderError,
  dobError,
  fields,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  onContactSelect,
  onStudentAvatarChange,
}: StudentContactSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showContact = isFieldEnabled("contactId");
  const showGender = isFieldEnabled("gender");
  const showDob = isFieldEnabled("dob");
  const showProfileRow = Boolean(contactId) && (showGender || showDob);

  if (!showContact && !showProfileRow) {
    return null;
  }

  const GenderGlyph = getGenderIcon(linkedGenderRaw);
  const contactLabel = resolveStudentFieldLabel(fields, "basic", "contactId", "students.form.contactLabel", t);
  const genderLabel = resolveStudentFieldLabel(fields, "basic", "gender", "students.gender", t);
  const dobLabel = resolveStudentFieldLabel(fields, "basic", "dob", "students.form.fieldDob", t);

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.contactLabel")}
        subtitle={t("students.form.contactHint")}
        icon={User}
        accentColor="primary"
      >
        <div className="space-y-4">
          {showContact ? (
            <>
              <ContactPicker
                label={contactLabel}
                value={contactId ? String(contactId) : null}
                onChange={onContactSelect}
                excludeIds={excludeIds}
                onAvatarChange={onStudentAvatarChange}
                searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                emptyTitle={t("contacts.picker.emptyTitle")}
                emptyHint={t("contacts.picker.emptyHint")}
                required={isFieldRequired("contactId")}
                error={!!getFieldError("contactId")}
                id="contactId"
              />
              <FieldError message={getFieldError("contactId")} />
            </>
          ) : null}

          {showProfileRow ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
              {showGender ? (
                <ContactProfileValue
                  label={genderLabel}
                  value={linkedGenderLabel}
                  icon={GenderGlyph}
                  iconClassName={getGenderIconClass(linkedGenderRaw)}
                  error={genderError}
                />
              ) : null}
              {showDob ? (
                <ContactProfileValue
                  label={dobLabel}
                  value={linkedDob}
                  icon={Calendar}
                  error={dobError}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
