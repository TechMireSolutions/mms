import React from "react";
import { Calendar, Clock, User } from "lucide-react";
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
            if (!fatherContact && !student.fatherName) return null;
            const fatherName = student.fatherName || fatherContact?.name || "";
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
            if (!motherContact && !student.motherName) return null;
            const motherName = student.motherName || motherContact?.name || "";
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
            if (!guardianContact && !student.guardianName) return null;
            const guardianName = student.guardianName || guardianContact?.name || "";
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

          return null;
        })}
      </div>
    </div>
  );
}
