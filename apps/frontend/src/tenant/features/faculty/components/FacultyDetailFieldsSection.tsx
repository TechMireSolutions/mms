import React from "react";
import { Award, Mail, Phone, School } from "lucide-react";
import {
  teacherFieldLabelKey,
  type Contact,
  type Teacher,
  type TeachersSettings,
} from "@mms/shared";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { ContactPhoneAction, ContactEmailAction } from "@/components/ui/ContactAction";
import { useTranslation } from "@/hooks/useTranslation";
import {
  resolveRegistryLabel,
  resolveAllContactPhones,
  resolveAllContactEmails,
} from "@/lib/contacts/contactI18n";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18nFormat";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import { teacherMessagingLabels } from "@/lib/faculty/facultyMessagingLabels";
import { TeacherDetailAttributeRow } from "@/tenant/features/faculty/components/FacultyDetailAttributeRow";
import type { TeacherDetailFieldRow } from "@/tenant/features/faculty/components/facultyDetailFields";
import {
  resolveTeacherFieldDisplayText,
} from "@/tenant/features/faculty/components/facultyFieldDisplay";
import {
  resolveTeacherTabLabel,
  SYSTEM_FIELD_ICONS,
} from "@/tenant/features/faculty/components/facultyDetailShared";

export interface TeacherDetailFieldsSectionProps {
  teacher: Teacher;
  detailFields: TeacherDetailFieldRow[];
  displayName: string;
  settings: TeachersSettings;
}

export function TeacherDetailFieldsSection({
  teacher,
  detailFields,
  displayName,
  settings,
}: TeacherDetailFieldsSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const emptyDash = t("teachers.table.emptyDash");
  const messagingLabels = teacherMessagingLabels(t);

  const rowForField = (field: TeacherDetailFieldRow): React.ReactNode => {
    const label = resolveRegistryLabel(field, t);
    const icon = field.isCustom
      ? School
      : (SYSTEM_FIELD_ICONS[field.key] ?? School);
    const displayValue = resolveTeacherFieldDisplayText(teacher, field.key, {
      t,
      displayName,
      customFieldLabel: field.label,
      customFieldType: field.type,
      isCustom: field.isCustom,
    });
    // For the designation field, also surface the assignable roles of the current designation.
    const assignableRoles: string[] =
      field.key === 'designation'
        ? ((teacher as Record<string, unknown>).designationAssignableRoles as string[] | undefined) ?? []
        : [];
    return (
      <React.Fragment key={field.key}>
        <TeacherDetailAttributeRow
          variant="inset"
          icon={icon}
          label={label}
          value={displayValue || emptyDash}
        />
        {assignableRoles.length > 0 && (
          <TeacherDetailAttributeRow
            variant="inset"
            icon={Award}
            label={t('faculty.designations.roles')}
            value={
              <div className="flex flex-wrap gap-1">
                {assignableRoles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs font-normal">
                    {role}
                  </Badge>
                ))}
              </div>
            }
          />
        )}
      </React.Fragment>
    );
  };

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

  const allPhones = resolveAllContactPhones(teacher as unknown as Contact);
  const allEmails = resolveAllContactEmails(teacher as unknown as Contact);

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

  const byTab = new Map<string, TeacherDetailFieldRow[]>();
  const order: string[] = [];
  for (const field of detailFields) {
    if (field.key === "status" || field.key === "notes") continue;
    let list = byTab.get(field.tab);
    if (!list) {
      list = [];
      byTab.set(field.tab, list);
      order.push(field.tab);
    }
    list.push(field);
  }

  const basicTabId = "basic";
  if (contactRows.length > 0 && !order.includes(basicTabId)) order.unshift(basicTabId);

  const sections = order.map((tabId) => {
    const rows: React.ReactNode[] = (byTab.get(tabId) ?? []).map(rowForField);
    if (tabId === basicTabId) rows.push(...contactRows);
    if (rows.length === 0) return null;
    return (
      <div key={tabId} className="space-y-2">
        <DetailSectionTitle>
          {resolveTeacherTabLabel(settings, tabId, t)}
        </DetailSectionTitle>
        <Card className="divide-y divide-border/50 p-0">{rows}</Card>
      </div>
    );
  });

  if (sections.every((section) => section == null)) return null;

  return <>{sections}</>;
}

export type FacultyDetailFieldsSectionProps = TeacherDetailFieldsSectionProps;
export const FacultyDetailFieldsSection = TeacherDetailFieldsSection;

