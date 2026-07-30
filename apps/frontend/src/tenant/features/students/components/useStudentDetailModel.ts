import { useMemo } from "react";
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  type FieldDefinition,
  type Student,
  calcAge,
  getPrimaryPhone,
  getPrimaryEmail,
} from "@mms/shared";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useContactsByIds } from '@/tenant/hooks/collections/contacts';
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTranslation } from "@/hooks/useTranslation";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";

export function useStudentDetailModel(student: Student) {
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

  const hasVisibleDetailFields = sortedEnabledFields.some((field) =>
    field.key === "fatherLink"
      ? (fatherContact || student.fatherName)
      : field.key === "motherLink"
        ? (motherContact || student.motherName)
        : field.key === "guardianLink"
          ? (guardianContact || student.guardianName)
          : true,
  );

  return {
    t,
    statusBadgeConfig,
    messagingTarget,
    openComposer,
    closeComposer,
    sortedEnabledFields,
    studentContact,
    fatherContact,
    motherContact,
    guardianContact,
    age,
    enrolledSessionDetails,
    primaryPhone,
    primaryEmail,
    fatherPhone,
    motherPhone,
    guardianPhone,
    hasVisibleDetailFields,
  };
}
