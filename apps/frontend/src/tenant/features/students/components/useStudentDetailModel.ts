import { useMemo } from "react";
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  listStudentContactRelationships,
  resolveStudentGuardianLinks,
  STUDENT_DETAIL_HERO_FIELD_KEYS,
  STUDENT_GUARDIAN_RELATIONSHIP_LABEL,
  STUDENT_PARENT_RELATIONSHIP_LABEL,
  OBSOLETE_STUDENT_GUARDIAN_FIELD_KEYS,
  type FieldDefinition,
  type Student,
  type StudentContactRelationshipLink,
  calcAge,
  getPrimaryPhone,
  getPrimaryEmail,
} from "@mms/shared";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useContactsByIds, useContactById } from '@/tenant/hooks/collections/contacts';
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTranslation } from "@/hooks/useTranslation";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";

export function useStudentDetailModel(student: Student) {
  const { t } = useTranslation();
  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();
  const sessions = useSessionsCollection();
  const { data: primaryContact } = useContactById(
    student.contactId != null ? String(student.contactId) : undefined,
  );
  const relationshipLinks = useMemo(
    () => listStudentContactRelationships(primaryContact ?? null),
    [primaryContact],
  );
  const guardians = useMemo(
    () => resolveStudentGuardianLinks(student, primaryContact ?? null),
    [student, primaryContact],
  );
  const linkedIds = useMemo(
    () => [
      student.contactId,
      ...relationshipLinks.map((link) => link.contactId),
      guardians.fatherContactId,
      guardians.guardianContactId,
    ],
    [student.contactId, relationshipLinks, guardians.fatherContactId, guardians.guardianContactId],
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
      labelKey?: FieldDefinition["labelKey"];
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
            labelKey: fieldDefinition.labelKey,
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

  const studentContact = contactList.find((contact) => String(contact.id) === String(student.contactId))
    ?? primaryContact
    ?? undefined;

  const graphLinks: StudentContactRelationshipLink[] = relationshipLinks.map((link) => {
    const contact = link.contactId
      ? contactList.find((entry) => String(entry.id) === String(link.contactId))
      : undefined;
    const gender = contact?.gender;
    return {
      ...link,
      name: contact?.name || link.name,
      phone: (contact ? getPrimaryPhone(contact) : null) || link.phone,
      ...(gender ? { gender } : {}),
    };
  });

  const fatherGender = guardians.fatherContactId
    ? contactList.find((entry) => String(entry.id) === String(guardians.fatherContactId))?.gender
    : undefined;
  const guardianGender = guardians.guardianContactId
    ? contactList.find((entry) => String(entry.id) === String(guardians.guardianContactId))?.gender
    : undefined;

  const hydratedLinks: StudentContactRelationshipLink[] =
    graphLinks.length > 0
      ? graphLinks
      : [
          ...(guardians.fatherContactId || guardians.fatherName
            ? [{
                ...(guardians.fatherContactId ? { contactId: guardians.fatherContactId } : {}),
                ...(guardians.fatherName ? { name: guardians.fatherName } : {}),
                ...(fatherGender ? { gender: fatherGender } : {}),
                relationship: STUDENT_PARENT_RELATIONSHIP_LABEL,
              } satisfies StudentContactRelationshipLink]
            : []),
          ...(guardians.guardianContactId || guardians.guardianName
            ? [{
                ...(guardians.guardianContactId ? { contactId: guardians.guardianContactId } : {}),
                ...(guardians.guardianName ? { name: guardians.guardianName } : {}),
                ...(guardianGender ? { gender: guardianGender } : {}),
                relationship: STUDENT_GUARDIAN_RELATIONSHIP_LABEL,
              } satisfies StudentContactRelationshipLink]
            : []),
        ];

  const age = calcAge(student.dob);
  const enrolledSessionDetails = sessions.filter((session) => student.enrolledSessions?.includes(session.id));

  const primaryPhone = (studentContact ? getPrimaryPhone(studentContact) : null) || student.phone;
  const primaryEmail = (studentContact ? getPrimaryEmail(studentContact) : null) || student.email;

  const hasVisibleDetailFields = sortedEnabledFields.some((field) => {
    if (
      STUDENT_DETAIL_HERO_FIELD_KEYS.has(field.key)
      || OBSOLETE_STUDENT_GUARDIAN_FIELD_KEYS.has(field.key)
    ) {
      return false;
    }
    if (field.key === "contactRelationships") {
      return hydratedLinks.some((link) => link.name || link.contactId);
    }
    return true;
  });

  const showNotesSection = Boolean(student.notes) && sortedEnabledFields.some((field) => field.key === "notes");

  return {
    t,
    statusBadgeConfig,
    messagingTarget,
    openComposer,
    closeComposer,
    canWriteMessaging,
    sortedEnabledFields,
    studentContact,
    relationshipLinks: hydratedLinks,
    age,
    enrolledSessionDetails,
    primaryPhone,
    primaryEmail,
    hasVisibleDetailFields,
    showNotesSection,
  };
}
