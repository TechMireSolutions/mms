import React, { useMemo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit2, GraduationCap, User } from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  type FieldDefinition,
  type Student,
  calcAge,
  formatDate,
  formatDateTime,
  getPrimaryPhone,
  getPrimaryEmail,
  toMessagingRecipient,
  toTitleCase,
} from "@mms/shared";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useContactsByIds } from '@/tenant/hooks/collections/contacts';
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTranslation } from "@/hooks/useTranslation";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";
import { GuardianContactCard } from "@/tenant/features/students/components/GuardianContactCard";
import { StudentDetailAttributeRow } from "@/tenant/features/students/components/StudentDetailAttributeRow";
import { StudentDetailHero } from "@/tenant/features/students/components/StudentDetailHero";
import { StudentDetailNotesSection } from "@/tenant/features/students/components/StudentDetailNotesSection";
import { StudentDetailQuickActions } from "@/tenant/features/students/components/StudentDetailQuickActions";
import { StudentDetailSessionsSection } from "@/tenant/features/students/components/StudentDetailSessionsSection";

export interface StudentDetailProps {
  student: Student;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

/**
 * Detailed slide-over panel displaying student records, guardian profiles, and enrolled courses.
 */
export default function StudentDetail({ student, onClose, onEdit }: StudentDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const sessions = useSessionsCollection();
  const linkedIds = useMemo(
    () => [student.contactId, student.fatherContactId, student.motherContactId, student.guardianContactId],
    [student.contactId, student.fatherContactId, student.motherContactId, student.guardianContactId],
  );
  const contacts = useContactsByIds(linkedIds);
  const contactList = contacts.data ?? [];

  const { settings } = useStudentConfig();
  const fields = useMemo(() => settings.fields || {}, [settings.fields]);

  const tabOrderMap = useMemo(() => {
    const tabs = settings.formTabs || [];
    return Object.fromEntries(tabs.map((tab, tabIndex) => [tab.key, tabIndex]));
  }, [settings.formTabs]);

  const enabledTabIds = useMemo(() => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS), [settings.enabledTabs]);

  const sortedEnabledFields = useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      type: string;
      tab: string;
      enabled: boolean;
      order: number;
    }> = [];

    Object.entries(fields).forEach(([tabId, tabFields]) => {
      if (tabId !== "basic" && !enabledTabIds.has(tabId)) return;
      (tabFields as FieldDefinition[]).forEach((fieldDefinition) => {
        if (fieldDefinition.enabled) {
          list.push({
            key: fieldDefinition.key,
            label: fieldDefinition.label,
            type: fieldDefinition.type,
            tab: tabId,
            enabled: fieldDefinition.enabled,
            order: fieldDefinition.order,
          });
        }
      });
    });

    return list.sort((a, b) => {
      const aTabIdx = tabOrderMap[a.tab] ?? 9999;
      const bTabIdx = tabOrderMap[b.tab] ?? 9999;
      if (aTabIdx !== bTabIdx) {
        return aTabIdx - bTabIdx;
      }
      return (a.order ?? 999) - (b.order ?? 999);
    });
  }, [fields, enabledTabIds, tabOrderMap]);

  const studentContact = contactList.find((contact) => String(contact.id) === String(student.contactId));
  const fatherContact = contactList.find((contact) => String(contact.id) === String(student.fatherContactId));
  const motherContact = contactList.find((contact) => String(contact.id) === String(student.motherContactId));
  const guardianContact = contactList.find((contact) => String(contact.id) === String(student.guardianContactId));

  const age = calcAge(student.dob);
  const enrolledSessionDetails = sessions.filter((session) => student.enrolledSessions?.includes(session.id));

  const primaryPhone = (studentContact ? getPrimaryPhone(studentContact) : null) || student.phone;
  const primaryEmail = (studentContact ? getPrimaryEmail(studentContact) : null) || student.email;

  const fatherPhone = fatherContact ? (getPrimaryPhone(fatherContact) || undefined) : undefined;
  const motherPhone = motherContact ? (getPrimaryPhone(motherContact) || undefined) : undefined;
  const guardianPhone = guardianContact ? (getPrimaryPhone(guardianContact) || undefined) : undefined;

  return (
    <>
      <DetailDrawerShell
        onClose={onClose}
        title={t("students.detail.title")}
        subtitle={t("students.detail.grSubtitle", { gr: student.grNumber || t("common.notSpecified") })}
        icon={GraduationCap}
        ariaLabel={t("students.detail.ariaLabel")}
        headerActions={
          onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onEdit(student)}
              className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t("students.detail.editTitle")}
              aria-label={t("students.detail.editTitle")}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          ) : undefined
        }
        footer={
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs font-bold text-success uppercase">{t("students.detail.synced")}</span>
          </div>
        }
      >
        <StudentDetailHero student={student} statusBadgeConfig={statusBadgeConfig} />

        <StudentDetailQuickActions
          student={student}
          primaryPhone={primaryPhone}
          primaryEmail={primaryEmail}
          openComposer={openComposer}
        />

        {/* Ordered Attributes & Connections list */}
        {sortedEnabledFields.some((field) => field.key === "fatherLink" ? (fatherContact || student.fatherName) : field.key === "motherLink" ? (motherContact || student.motherName) : field.key === "guardianLink" ? (guardianContact || student.guardianName) : true) && (
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
                      onWhatsApp={fatherPhone ? () => openComposer("whatsapp", [toMessagingRecipient({ id: fatherId, name: fatherName, phone: fatherPhone })]) : undefined}
                      onSms={fatherPhone ? () => openComposer("sms", [toMessagingRecipient({ id: fatherId, name: fatherName, phone: fatherPhone })]) : undefined}
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
                      onWhatsApp={motherPhone ? () => openComposer("whatsapp", [toMessagingRecipient({ id: motherId, name: motherName, phone: motherPhone })]) : undefined}
                      onSms={motherPhone ? () => openComposer("sms", [toMessagingRecipient({ id: motherId, name: motherName, phone: motherPhone })]) : undefined}
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
                      onWhatsApp={guardianPhone ? () => openComposer("whatsapp", [toMessagingRecipient({ id: guardianId, name: guardianName, phone: guardianPhone })]) : undefined}
                      onSms={guardianPhone ? () => openComposer("sms", [toMessagingRecipient({ id: guardianId, name: guardianName, phone: guardianPhone })]) : undefined}
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Internal Notes */}
        {student.notes && <StudentDetailNotesSection notes={student.notes} />}

        <StudentDetailSessionsSection sessions={enrolledSessionDetails} />
      </DetailDrawerShell>

      {messagingTarget && (
        <Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </Suspense>
      )}
    </>
  );
}
