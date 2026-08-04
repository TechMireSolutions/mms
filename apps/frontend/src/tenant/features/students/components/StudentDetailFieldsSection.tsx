import React from "react";
import { Calendar, Clock, FileText, User } from "lucide-react";
import {
  type Student,
  formatDate,
  formatDateTime,
  toMessagingRecipient,
  toTitleCase,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { GuardianContactCard } from "@/tenant/features/students/components/GuardianContactCard";
import { StudentDetailAttributeRow } from "@/tenant/features/students/components/StudentDetailAttributeRow";
import type { Contact, StandardMessagingRecipient as MessagingRecipient } from "@mms/shared";

interface SortedField {
  key: string;
  label: string;
  type: string;
  tab: string;
  enabled: boolean;
  order: number;
}

interface StudentDetailFieldsSectionProps {
  student: Student;
  sortedEnabledFields: SortedField[];
  age: number | null;
  fatherContact?: Contact;
  motherContact?: Contact;
  guardianContact?: Contact;
  fatherPhone?: string;
  motherPhone?: string;
  guardianPhone?: string;
  openComposer: (channel: "sms" | "whatsapp", recipients: MessagingRecipient[]) => void;
  messagingEnabled?: boolean;
}

export function StudentDetailFieldsSection({
  student,
  sortedEnabledFields,
  age,
  fatherContact,
  motherContact,
  guardianContact,
  fatherPhone,
  motherPhone,
  guardianPhone,
  openComposer,
  messagingEnabled = true,
}: StudentDetailFieldsSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const canMessage = messagingEnabled;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest ps-1">{t("students.detail.sectionDetails")}</h4>
      <div className="space-y-2.5">
        {sortedEnabledFields.map((field) => {
          if (field.key === "gender") {
            return (
              <StudentDetailAttributeRow
                key="gender"
                icon={User}
                label={t("students.gender")}
                value={student.gender ? toTitleCase(student.gender) : t("common.notSpecified")}
              />
            );
          }

          if (field.key === "dob") {
            return (
              <StudentDetailAttributeRow
                key="dob"
                icon={Calendar}
                label={t("students.columns.dob")}
                value={`${student.dob ? formatDate(student.dob, true) : "—"} ${age ? t("students.list.ageYears", { age }) : ""}`}
              />
            );
          }

          if (field.key === "registeredDate") {
            return (
              <StudentDetailAttributeRow
                key="registeredDate"
                icon={Clock}
                label={t("students.form.registeredDate")}
                value={student.registeredDate ? formatDateTime(student.registeredDate, true) : "—"}
              />
            );
          }

          if (field.key === "fatherLink") {
            const fatherName = fatherContact?.name || student.fatherName || "";
            if (!fatherName) return null;
            const fatherId = fatherContact?.id || student.fatherContactId || "father";
            return (
              <GuardianContactCard
                key="fatherLink"
                label={t("students.detail.father")}
                badgeCode="FA"
                badgeBg="bg-info/10"
                badgeText="text-info"
                name={fatherName}
                phone={fatherPhone}
                onWhatsApp={
                  canMessage && fatherPhone
                    ? () => openComposer("whatsapp", [toMessagingRecipient({ id: fatherId, name: fatherName, phone: fatherPhone })])
                    : undefined
                }
                onSms={
                  canMessage && fatherPhone
                    ? () => openComposer("sms", [toMessagingRecipient({ id: fatherId, name: fatherName, phone: fatherPhone })])
                    : undefined
                }
              />
            );
          }

          if (field.key === "motherLink") {
            const motherName = motherContact?.name || student.motherName || "";
            if (!motherName) return null;
            const motherId = motherContact?.id || student.motherContactId || "mother";
            return (
              <GuardianContactCard
                key="motherLink"
                label={t("students.detail.mother")}
                badgeCode="MO"
                badgeBg="bg-secondary/10"
                badgeText="text-secondary"
                name={motherName}
                phone={motherPhone}
                onWhatsApp={
                  canMessage && motherPhone
                    ? () => openComposer("whatsapp", [toMessagingRecipient({ id: motherId, name: motherName, phone: motherPhone })])
                    : undefined
                }
                onSms={
                  canMessage && motherPhone
                    ? () => openComposer("sms", [toMessagingRecipient({ id: motherId, name: motherName, phone: motherPhone })])
                    : undefined
                }
              />
            );
          }

          if (field.key === "guardianLink") {
            const guardianName = guardianContact?.name || student.guardianName || "";
            if (!guardianName) return null;
            const guardianId = guardianContact?.id || student.guardianContactId || "guardian";
            return (
              <GuardianContactCard
                key="guardianLink"
                label={t("students.detail.guardian")}
                badgeCode="GU"
                badgeBg="bg-primary/10"
                badgeText="text-primary"
                name={guardianName}
                phone={guardianPhone}
                onWhatsApp={
                  canMessage && guardianPhone
                    ? () => openComposer("whatsapp", [toMessagingRecipient({ id: guardianId, name: guardianName, phone: guardianPhone })])
                    : undefined
                }
                onSms={
                  canMessage && guardianPhone
                    ? () => openComposer("sms", [toMessagingRecipient({ id: guardianId, name: guardianName, phone: guardianPhone })])
                    : undefined
                }
              />
            );
          }

          const rawValue = (student as Record<string, unknown>)[field.key];
          const displayValue = formatStudentCustomFieldValue(rawValue, field.type, t);
          if (displayValue == null) return null;
          return (
            <StudentDetailAttributeRow
              key={field.key}
              icon={FileText}
              label={field.label}
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
