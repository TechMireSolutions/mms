import type React from "react";
import { Calendar, User } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import {
  ContactProfileValue,
  FieldError,
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
  getFieldError,
  onContactSelect,
  onStudentAvatarChange,
}: StudentContactSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const GenderGlyph = getGenderIcon(linkedGenderRaw);

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.contactLabel")}
        subtitle={t("students.form.contactHint")}
        icon={User}
        accentColor="primary"
      >
        <div className="space-y-4">
          <ContactPicker
            label={t("students.form.contactLabel")}
            value={contactId ? String(contactId) : null}
            onChange={onContactSelect}
            excludeIds={excludeIds}
            onAvatarChange={onStudentAvatarChange}
            searchPlaceholder={t("contacts.picker.searchPlaceholder")}
            emptyTitle={t("contacts.picker.emptyTitle")}
            emptyHint={t("contacts.picker.emptyHint")}
            error={!!getFieldError("contactId")}
            id="contactId"
          />
          <FieldError message={getFieldError("contactId")} />

          {contactId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
              <ContactProfileValue
                label={t("students.gender")}
                value={linkedGenderLabel}
                icon={GenderGlyph}
                iconClassName={getGenderIconClass(linkedGenderRaw)}
                error={genderError}
              />
              <ContactProfileValue label={t("students.form.fieldDob")} value={linkedDob} icon={Calendar} error={dobError} />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
