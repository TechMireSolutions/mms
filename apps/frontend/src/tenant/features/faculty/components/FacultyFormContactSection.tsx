import type React from "react";
import { GraduationCap, Mail, Phone, School, User } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getContactQualification,
  getContactSpecialization,
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
  type FieldDefinition,
  type Teacher,
} from "@mms/shared";
import { resolveTeacherFieldLabel } from "@/tenant/features/faculty/components/FacultyFormSectionShared";

export interface TeacherContactSectionProps {
  teacherDraft: Partial<Teacher>;
  linkedContact?: Contact | null;
  linkedTeacherContactIds: Array<string | number>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
}

export function TeacherContactSection({
  teacherDraft,
  linkedContact,
  linkedTeacherContactIds,
  errors,
  fields,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: TeacherContactSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showContact = isFieldEnabled("contactId");
  if (!showContact) return null;

  const contactLabel = resolveTeacherFieldLabel(fields, "basic", "contactId", t);
  const primaryPhone = linkedContact ? getPrimaryPhone(linkedContact) : null;
  const primaryEmail = linkedContact ? getPrimaryEmail(linkedContact) : null;
  const contactQualification = linkedContact ? getContactQualification(linkedContact) : "";
  const contactSpecialization = linkedContact ? getContactSpecialization(linkedContact) : "";
  const hasProfilePills =
    Boolean(teacherDraft.contactId) &&
    (Boolean(primaryPhone) ||
      Boolean(primaryEmail) ||
      Boolean(contactQualification) ||
      Boolean(contactSpecialization));

  return (
    <SectionCard title={contactLabel} icon={User} accentColor="primary" className="z-sticky">
      <div className="space-y-3">
        <ContactPicker
          id="contactId"
          name="contactId"
          label={contactLabel}
          value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
          onChange={(contactId) => onDraftChange({ contactId: contactId ? String(contactId) : "" })}
          excludeIds={linkedTeacherContactIds.map(String)}
          searchPlaceholder={t("teachers.form.searchContact")}
          emptyTitle={t("teachers.form.noContacts")}
          emptyHint={t("teachers.form.noContactsHint")}
          required={isFieldRequired("contactId")}
          error={!!errors.contactId}
          errorMessage={errors.contactId}
        />
        {hasProfilePills && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
            {primaryPhone && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium">
                <Phone className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{primaryPhone}</span>
              </div>
            )}
            {primaryEmail && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium">
                <Mail className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{primaryEmail}</span>
              </div>
            )}
            {contactQualification && (
              <div
                data-testid="teacher-contact-qualification-pill"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium"
                title={t("teachers.field.qualification")}
              >
                <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{contactQualification}</span>
              </div>
            )}
            {contactSpecialization && (
              <div
                data-testid="teacher-contact-specialization-pill"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium"
                title={t("teachers.field.specialization")}
              >
                <School className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{contactSpecialization}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
