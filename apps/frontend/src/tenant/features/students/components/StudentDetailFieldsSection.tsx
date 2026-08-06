import React from "react";
import { Calendar, Clock, FileText, User } from "lucide-react";
import {
  type AppTranslationKey,
  type Student,
  type StudentContactRelationshipLink,
  OBSOLETE_STUDENT_GUARDIAN_FIELD_KEYS,
  STUDENT_DETAIL_HERO_FIELD_KEYS,
  formatDate,
  formatDateTime,
  toMessagingRecipient,
} from "@mms/shared";
import { DETAIL_SECTION_TITLE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactGenderLabel, resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { formatLocalizedRelationshipParts } from "@/lib/contacts/formatLocalizedRelationshipLabel";
import { GuardianContactCard } from "@/tenant/features/students/components/GuardianContactCard";
import { relationshipBadgeCode } from "@/tenant/features/students/components/guardianRelationshipBadge";
import { StudentDetailAttributeRow } from "@/tenant/features/students/components/StudentDetailAttributeRow";
import type { StandardMessagingRecipient as MessagingRecipient } from "@mms/shared";

interface SortedField {
  key: string;
  label: string;
  labelKey?: AppTranslationKey;
  type: string;
  tab: string;
  enabled: boolean;
  order: number;
}

interface StudentDetailFieldsSectionProps {
  student: Student;
  sortedEnabledFields: SortedField[];
  age: number | null;
  relationshipLinks: StudentContactRelationshipLink[];
  openComposer: (channel: "sms" | "whatsapp", recipients: MessagingRecipient[]) => void;
  messagingEnabled?: boolean;
}

export function StudentDetailFieldsSection({
  student,
  sortedEnabledFields,
  age,
  relationshipLinks,
  openComposer,
  messagingEnabled = true,
}: StudentDetailFieldsSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const canMessage = messagingEnabled;
  const emptyDash = t("students.table.emptyDash");

  return (
    <div className="space-y-4">
      <h4 className={`${DETAIL_SECTION_TITLE} ps-1`}>{t("students.detail.sectionDetails")}</h4>
      <div className="space-y-2.5">
        {sortedEnabledFields.map((field) => {
          if (
            STUDENT_DETAIL_HERO_FIELD_KEYS.has(field.key)
            || OBSOLETE_STUDENT_GUARDIAN_FIELD_KEYS.has(field.key)
          ) {
            return null;
          }

          const fieldLabel = resolveRegistryLabel(field, t);

          if (field.key === "gender") {
            return (
              <StudentDetailAttributeRow
                key="gender"
                icon={User}
                label={fieldLabel}
                value={student.gender ? formatContactGenderLabel(student.gender, t) : emptyDash}
              />
            );
          }

          if (field.key === "dob") {
            return (
              <StudentDetailAttributeRow
                key="dob"
                icon={Calendar}
                label={fieldLabel}
                value={`${student.dob ? formatDate(student.dob, true) : emptyDash} ${age ? t("students.list.ageYears", { age }) : ""}`}
              />
            );
          }

          if (field.key === "registeredDate") {
            return (
              <StudentDetailAttributeRow
                key="registeredDate"
                icon={Clock}
                label={fieldLabel}
                value={student.registeredDate ? formatDateTime(student.registeredDate, true) : emptyDash}
              />
            );
          }

          if (field.key === "contactRelationships") {
            return relationshipLinks.map((link, index) => {
              const name = link.name?.trim();
              if (!name) return null;
              const contactId = link.contactId || `rel-${index}`;
              const phone = link.phone;
              const { display, label } = formatLocalizedRelationshipParts(
                link.relationship,
                link.gender,
                t,
              );
              return (
                <GuardianContactCard
                  key={`${link.relationship}-${contactId}-${index}`}
                  label={label}
                  badgeCode={relationshipBadgeCode(display, emptyDash)}
                  badgeBg="bg-info/10"
                  badgeText="text-info"
                  name={name}
                  phone={phone}
                  onWhatsApp={
                    canMessage && phone
                      ? () => openComposer("whatsapp", [toMessagingRecipient({ id: contactId, name, phone })])
                      : undefined
                  }
                  onSms={
                    canMessage && phone
                      ? () => openComposer("sms", [toMessagingRecipient({ id: contactId, name, phone })])
                      : undefined
                  }
                />
              );
            });
          }

          const rawValue = (student as Record<string, unknown>)[field.key];
          const displayValue = formatStudentCustomFieldValue(rawValue, field.type, t);
          if (displayValue == null) return null;
          return (
            <StudentDetailAttributeRow
              key={field.key}
              icon={FileText}
              label={fieldLabel}
              value={displayValue}
            />
          );
        })}
      </div>
    </div>
  );
}

function formatStudentCustomFieldValue(
  value: unknown,
  type: string,
  t: (key: "common.yes" | "common.no") => string,
): string | null {
  if (value == null) return null;
  if (typeof value === "string" && !value.trim()) return null;
  if (Array.isArray(value)) {
    const joined = value.map(String).filter(Boolean).join(", ");
    return joined || null;
  }
  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }
  if (type === "date" && typeof value === "string") {
    return formatDate(value, true);
  }
  if (type === "datetime" && typeof value === "string") {
    return formatDateTime(value, true);
  }
  return String(value);
}
