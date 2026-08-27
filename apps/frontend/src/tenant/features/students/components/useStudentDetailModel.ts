import { useMemo } from "react";
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  listStudentContactRelationships,
  resolveStudentGuardianLinks,
  mergeStoredAndDerivedSiblingLinks,
  getContactTags,
  STUDENT_DETAIL_HERO_FIELD_KEYS,
  STUDENT_GUARDIAN_RELATIONSHIP_LABEL,
  STUDENT_PARENT_RELATIONSHIP_LABEL,
  OBSOLETE_STUDENT_GUARDIAN_FIELD_KEYS,
  type Address,
  type EmailAddress,
  type FieldDefinition,
  type PhoneNumber,
  type Student,
  type StudentContactRelationshipLink,
  calcAge,
  getPrimaryPhone,
  getPrimaryEmail,
  hasWhatsApp,
} from "@mms/shared";
import { useSessions, useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useContactsByIds, useContactById } from "@/tenant/hooks/collections/contacts";
import { useStudentsContractList } from "@/tenant/features/students/hooks/useStudentsTsrHooks";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { formatLocalizedRelationshipParts } from "@/lib/contacts/formatLocalizedRelationshipLabel";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";
import { relationshipBadgeCode } from "@/tenant/features/students/components/guardianRelationshipBadge";
import type { SiblingStudentItem } from "@/tenant/features/students/components/StudentDetailSiblingsSection";
import type { StudentContactProfileData } from "@/tenant/features/students/components/StudentDetailContactSection";
import type { StudentRelationshipCardData } from "@/tenant/features/students/components/StudentRelationshipCard";

export function useStudentDetailModel(student: Student) {
  const { t } = useTranslation();
  const emptyDash = t("students.table.emptyDash");
  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const sessionsQuery = useSessions();
  const sessions = useSessionsCollection();

  const { data: primaryContact } = useContactById(
    student.contactId != null ? String(student.contactId) : undefined,
  );

  const rawRelationshipLinks = useMemo(
    () => listStudentContactRelationships(primaryContact ?? null),
    [primaryContact],
  );

  const guardians = useMemo(
    () => resolveStudentGuardianLinks(student, primaryContact ?? null),
    [student, primaryContact],
  );

  const linkedIds = useMemo(() => {
    const ids = new Set<string>();
    if (student.contactId != null && String(student.contactId).trim()) {
      ids.add(String(student.contactId).trim());
    }
    if (student.fatherContactId != null && String(student.fatherContactId).trim()) {
      ids.add(String(student.fatherContactId).trim());
    }
    if (student.guardianContactId != null && String(student.guardianContactId).trim()) {
      ids.add(String(student.guardianContactId).trim());
    }
    if (guardians.fatherContactId) ids.add(String(guardians.fatherContactId).trim());
    if (guardians.guardianContactId) ids.add(String(guardians.guardianContactId).trim());

    for (const rel of primaryContact?.relationshipContacts ?? []) {
      if (rel.contactId != null && String(rel.contactId).trim()) {
        ids.add(String(rel.contactId).trim());
      }
    }
    for (const rel of primaryContact?.relationships ?? []) {
      if (rel.contactId != null && String(rel.contactId).trim()) {
        ids.add(String(rel.contactId).trim());
      }
    }

    return Array.from(ids);
  }, [
    student.contactId,
    student.fatherContactId,
    student.guardianContactId,
    guardians.fatherContactId,
    guardians.guardianContactId,
    primaryContact?.relationshipContacts,
    primaryContact?.relationships,
  ]);

  const contactsQuery = useContactsByIds(linkedIds);
  const contactList = contactsQuery.data ?? [];

  const studentContact = useMemo(() => {
    return (
      contactList.find((c) => String(c.id) === String(student.contactId)) ??
      primaryContact ??
      undefined
    );
  }, [contactList, student.contactId, primaryContact]);

  const { settings } = useStudentConfig();
  const fields = useMemo(() => settings.fields || {}, [settings.fields]);

  const tabOrderMap = useMemo(() => {
    const tabs = settings.formTabs || [];
    return Object.fromEntries(tabs.map((tab, tabIndex) => [tab.key, tabIndex]));
  }, [settings.formTabs]);

  const enabledTabIds = useMemo(
    () => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS),
    [settings.enabledTabs],
  );

  const sortedEnabledFields = useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      labelKey?: FieldDefinition["labelKey"];
      type: string;
      tab: string;
      enabled: boolean;
      order: number;
      group: string;
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
            group: fieldDefinition.group?.trim() || t("students.detail.extendedProfiles"),
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
  }, [fields, enabledTabIds, tabOrderMap, t]);

  const studentPhones: PhoneNumber[] = useMemo(() => {
    if (studentContact?.phones && studentContact.phones.length > 0) {
      return studentContact.phones;
    }
    const fallbackPhone = (studentContact ? getPrimaryPhone(studentContact) : null) || student.phone;
    if (fallbackPhone) {
      return [{ number: fallbackPhone, label: t("contacts.fields.phoneNumber"), isPrimary: true }];
    }
    return [];
  }, [studentContact, student.phone, t]);

  const studentEmails: EmailAddress[] = useMemo(() => {
    if (studentContact?.emails && studentContact.emails.length > 0) {
      return studentContact.emails;
    }
    const fallbackEmail = (studentContact ? getPrimaryEmail(studentContact) : null) || student.email;
    if (fallbackEmail) {
      return [{ address: fallbackEmail, label: t("contacts.fields.emailAddress"), isPrimary: true }];
    }
    return [];
  }, [studentContact, student.email, t]);

  const studentAddresses: Address[] = useMemo(() => {
    if (studentContact?.addresses && studentContact.addresses.length > 0) {
      return studentContact.addresses;
    }
    const line1 = studentContact?.address || studentContact?.line1 || student.address;
    const city = studentContact?.city || student.city;
    const state = studentContact?.state || student.state;
    const country = studentContact?.country || student.country;
    if (line1 || city || state || country) {
      return [{ line1, city, state, country, label: t("students.detail.addressesLabel"), isPrimary: true }];
    }
    return [];
  }, [studentContact, student.address, student.city, student.state, student.country, t]);

  const studentContactProfile: StudentContactProfileData = useMemo(() => {
    const rawTags = studentContact
      ? getContactTags(studentContact)
      : getContactTags({
          tag: typeof student.tag === "string" ? student.tag : undefined,
          tags: Array.isArray(student.tags) ? (student.tags as string[]) : undefined,
        });
    return {
      contactId: student.contactId != null ? String(student.contactId) : undefined,
      displayName: studentContact?.name || student.name || "",
      phones: studentPhones,
      emails: studentEmails,
      addresses: studentAddresses,
      cnic: studentContact?.cnic || student.cnic,
      isSyed: studentContact?.isSyed ?? student.isSyed,
      tags: rawTags,
    };
  }, [studentContact, student, studentPhones, studentEmails, studentAddresses]);

  const hydratedRelationships: StudentRelationshipCardData[] = useMemo(() => {
    const mergedLinks = studentContact
      ? mergeStoredAndDerivedSiblingLinks(studentContact, contactList)
      : [];

    const relationshipKeySet = new Set<string>();
    const results: StudentRelationshipCardData[] = [];

    const addRelationshipItem = (
      contactId: string | undefined,
      name: string | undefined,
      relationshipStr: string,
      inferred = false,
      derivedSibling = false,
      phoneHint?: string,
      emailHint?: string,
      notesHint?: string,
    ) => {
      const target = contactId
        ? contactList.find((entry) => String(entry.id) === String(contactId))
        : undefined;

      const resolvedName = target?.name || name || t("students.detail.unknownContact");
      const key = contactId
        ? `contact-${contactId}-${relationshipStr}`
        : `name-${resolvedName.toLowerCase()}-${relationshipStr}`;

      if (relationshipKeySet.has(key)) return;
      relationshipKeySet.add(key);

      const resolvedGender = target?.gender;
      const { display, label } = formatLocalizedRelationshipParts(
        relationshipStr,
        resolvedGender,
        t,
      );

      const targetPhones: PhoneNumber[] =
        target?.phones && target.phones.length > 0
          ? target.phones
          : target?.phone || phoneHint
            ? [{ number: (target?.phone || phoneHint)!, label: t("contacts.fields.phoneNumber"), isPrimary: true }]
            : [];

      const targetEmails: EmailAddress[] =
        target?.emails && target.emails.length > 0
          ? target.emails
          : target?.email || emailHint
            ? [{ address: (target?.email || emailHint)!, label: t("contacts.fields.emailAddress"), isPrimary: true }]
            : [];

      results.push({
        key,
        contactId: target?.id != null ? String(target.id) : contactId,
        name: resolvedName,
        avatar: target?.avatar,
        gender: resolvedGender,
        relationship: relationshipStr,
        relationshipLabel: label,
        badgeCode: relationshipBadgeCode(display, emptyDash),
        badgeTone: SEMANTIC_BADGE.info,
        inferred: inferred || Boolean(target && edgeIsInferred(contactId, studentContact)),
        derivedSibling,
        phones: targetPhones,
        emails: targetEmails,
        cnic: target?.cnic,
        notes: target?.notes || notesHint,
        targetContact: target,
      });
    };

    function edgeIsInferred(targetId?: string, subject?: typeof studentContact): boolean {
      if (!targetId || !subject?.relationshipContacts) return false;
      const found = subject.relationshipContacts.find((r: { contactId?: string | number; inferred?: boolean }) => String(r.contactId) === String(targetId));
      return found?.inferred === true;
    }

    for (const link of mergedLinks) {
      addRelationshipItem(
        link.contactId ? String(link.contactId) : undefined,
        link.name,
        link.relationship || STUDENT_PARENT_RELATIONSHIP_LABEL,
        link.inferred === true,
        link.derivedSibling === true,
        link.phone,
      );
    }

    if (guardians.fatherContactId || guardians.fatherName || student.fatherName || student.fatherContactId) {
      const fatherId = guardians.fatherContactId ? String(guardians.fatherContactId) : (student.fatherContactId ? String(student.fatherContactId) : undefined);
      const fatherName = guardians.fatherName || student.fatherName || undefined;
      addRelationshipItem(
        fatherId,
        fatherName,
        STUDENT_PARENT_RELATIONSHIP_LABEL,
      );
    }

    if (guardians.guardianContactId || guardians.guardianName || student.guardianName || student.guardianContactId) {
      const guardianId = guardians.guardianContactId ? String(guardians.guardianContactId) : (student.guardianContactId ? String(student.guardianContactId) : undefined);
      const guardianName = guardians.guardianName || student.guardianName || undefined;
      addRelationshipItem(
        guardianId,
        guardianName,
        STUDENT_GUARDIAN_RELATIONSHIP_LABEL,
      );
    }

    return results;
  }, [
    studentContact,
    contactList,
    guardians,
    student.fatherName,
    student.fatherContactId,
    student.guardianName,
    student.guardianContactId,
    emptyDash,
    t,
  ]);

  const age = calcAge(student.dob || studentContact?.dob);
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
      return hydratedRelationships.length > 0;
    }
    return true;
  });

  const allStudentsQuery = useStudentsContractList({ page: 1, limit: 100 });
  const allStudents = useMemo(() => allStudentsQuery.data?.body?.students ?? [], [allStudentsQuery.data?.body?.students]);

  const siblings: SiblingStudentItem[] = useMemo(() => {
    if (!student.id) return [];
    const fatherId = guardians.fatherContactId ? String(guardians.fatherContactId) : null;
    const guardianId = guardians.guardianContactId ? String(guardians.guardianContactId) : null;
    const fatherName = (guardians.fatherName || student.fatherName || "").trim().toLowerCase();

    if (!fatherId && !guardianId && !fatherName) return [];

    const matched: SiblingStudentItem[] = [];

    for (const other of allStudents) {
      if (String(other.id) === String(student.id)) continue;
      const otherFatherId = other.fatherContactId ? String(other.fatherContactId) : null;
      const otherGuardianId = other.guardianContactId ? String(other.guardianContactId) : null;
      const otherFatherName = (other.fatherName || "").trim().toLowerCase();

      const isMatch =
        (fatherId && otherFatherId && fatherId === otherFatherId) ||
        (guardianId && otherGuardianId && guardianId === otherGuardianId) ||
        (fatherName && otherFatherName && fatherName === otherFatherName);

      if (isMatch) {
        const sessionNames = sessions
          .filter((sess) => other.enrolledSessions?.includes(sess.id))
          .map((sess) => sess.name);

        matched.push({
          id: String(other.id),
          name: other.name || "",
          grNumber: other.grNumber,
          status: other.status,
          gender: other.gender,
          sessionNames,
        });
      }
    }

    return matched;
  }, [student, guardians, allStudents, sessions]);

  const showNotesSection = Boolean(student.notes) && sortedEnabledFields.some((field) => field.key === "notes");

  const legacyRelationshipLinks: StudentContactRelationshipLink[] = useMemo(() => {
    return hydratedRelationships.map((r) => ({
      contactId: r.contactId,
      name: r.name,
      phone: r.phones[0]?.number,
      email: r.emails[0]?.address,
      gender: r.gender,
      relationship: r.relationship,
    }));
  }, [hydratedRelationships]);

  return {
    t,
    statusBadgeConfig,
    sortedEnabledFields,
    relationshipLinks: legacyRelationshipLinks,
    hydratedRelationships,
    studentContact,
    studentContactProfile,
    age,
    enrolledSessionDetails,
    sessionsLoading: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.isError,
    primaryPhone,
    primaryEmail,
    hasWhatsAppContact: hasWhatsApp({ phone: primaryPhone ?? undefined }),
    hasVisibleDetailFields,
    showNotesSection,
    siblings,
    allStudents,
  };
}

