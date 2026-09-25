import React from "react";
import { Mail, Phone } from "lucide-react";
import {
  teacherFieldLabelKey,
  type Contact,
  type Teacher,
} from "@mms/shared";
import { ContactPhoneAction, ContactEmailAction } from "@/components/ui/ContactAction";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  resolveAllContactPhones,
  resolveAllContactEmails,
} from "@/lib/contacts/contactI18n";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18nFormat";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import type { TeacherMessagingLabels } from "@/lib/faculty/facultyMessagingLabels";
import { TeacherDetailAttributeRow } from "@/tenant/features/faculty/components/FacultyDetailAttributeRow";

export interface BuildFacultyContactRowsParams {
  teacher: Teacher;
  displayName: string;
  t: TranslationFunction;
  emptyDash: string;
  messagingLabels: TeacherMessagingLabels;
}

/** Generates gender, phone, and email attribute rows for the Faculty detail drawer. */
export function buildFacultyContactRows({
  teacher,
  displayName,
  t,
  emptyDash,
  messagingLabels,
}: BuildFacultyContactRowsParams): React.ReactNode[] {
  const contactRows: React.ReactNode[] = [];

  contactRows.push(
    <TeacherDetailAttributeRow
      key="gender"
      variant="inset"
      icon={getGenderIcon(teacher.gender)}
      iconClassName={getGenderIconClass(teacher.gender)}
      label={t(teacherFieldLabelKey("gender"))}
      value={teacher.gender ? formatContactGenderLabel(teacher.gender, t) : emptyDash}
    />,
  );

  const contact: Partial<Contact> = {
    phone: teacher.phone,
    email: teacher.email,
  };
  const allPhones = resolveAllContactPhones(contact);
  const allEmails = resolveAllContactEmails(contact);

  if (allPhones.length > 0) {
    allPhones.forEach((p, idx) => {
      contactRows.push(
        <TeacherDetailAttributeRow
          key={`phone-${p.phone}-${idx}`}
          variant="inset"
          icon={Phone}
          label={p.label || t(teacherFieldLabelKey("phone"))}
          value={
            <ContactPhoneAction
              phone={p.phone}
              phoneDisplay={p.phoneDisplay}
              countryCode={p.countryCode}
              name={displayName}
              variant="inline"
              labels={{
                call: messagingLabels.call,
                sms: messagingLabels.sms,
                whatsapp: messagingLabels.whatsapp,
                copy: t("contacts.table.copy"),
                copied: t("contacts.table.copied"),
              }}
            />
          }
        />,
      );
    });
  }

  if (allEmails.length > 0) {
    allEmails.forEach((e, idx) => {
      contactRows.push(
        <TeacherDetailAttributeRow
          key={`email-${e.email}-${idx}`}
          variant="inset"
          icon={Mail}
          label={e.label || t(teacherFieldLabelKey("email"))}
          value={
            <ContactEmailAction
              email={e.email}
              name={displayName}
              variant="inline"
              labels={{
                mail: messagingLabels.email,
                copy: t("contacts.table.copy"),
                copied: t("contacts.table.copied"),
              }}
            />
          }
        />,
      );
    });
  }

  return contactRows;
}
