import { useMemo } from 'react';
import type { Contact, MessagingRoleFilter, MessagingGenderFilter } from '@mms/shared';
import {
  getPrimaryEmail,
  getPrimaryPhone,
  CONTACTS_MODULE_MANIFEST,
} from '@mms/shared';
import { useContactsPaginated, useContactsByIds } from '@/tenant/hooks/collections/contacts';
import { useStudentLinkedContactIds } from '@/tenant/hooks/collections/students';
import { useTeacherLinkedContactIds } from '@/tenant/hooks/collections/teachers';
import { useUsers } from '@/tenant/hooks/collections/users';

const TEACHER_USER_ROLES = new Set(['teacher', 'assistant_teacher']);

function hasReachableAddress(contact: Contact): boolean {
  return Boolean(getPrimaryPhone(contact)) || Boolean(getPrimaryEmail(contact));
}

function matchesGender(contact: Contact, genderFilter: MessagingGenderFilter): boolean {
  if (genderFilter === 'all') return true;
  const gender = String(contact.gender || '').toLowerCase();
  if (genderFilter === 'unspecified') return !gender || gender === 'unspecified';
  return gender === genderFilter;
}

function matchesSearch(contact: Contact, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const name = `${contact.name || ''} ${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
  const phone = getPrimaryPhone(contact)?.toLowerCase() ?? '';
  const email = getPrimaryEmail(contact)?.toLowerCase() ?? '';
  return name.includes(query) || phone.includes(query) || email.includes(query);
}

function paginateIds<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function orderedContactsFromIds(ids: Array<string | number>, resolved: Contact[]): Contact[] {
  const byId = new Map<string, Contact>();
  for (const contact of resolved) {
    byId.set(String(contact.id), contact);
  }
  return ids
    .map((id) => byId.get(String(id)))
    .filter((contact): contact is Contact => Boolean(contact));
}

export interface UseMessagingWorkRecipientsParams {
  roleFilter: MessagingRoleFilter;
  genderFilter: MessagingGenderFilter;
  search: string;
  page: number;
  pageSize?: number;
  enabled?: boolean;
}

export interface MessagingWorkRecipientsResult {
  contacts: Contact[];
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  isError: boolean;
  isPending: boolean;
  refetch: () => void;
}

function buildFilteredPage(
  filtered: Contact[],
  page: number,
  pageSize: number,
): Pick<MessagingWorkRecipientsResult, 'contacts' | 'page' | 'total' | 'limit' | 'hasMore'> {
  const total = filtered.length;
  return {
    contacts: paginateIds(filtered, page, pageSize),
    page,
    total,
    limit: pageSize,
    hasMore: page * pageSize < total,
  };
}

/**
 * Resolves Work-tab recipients from authoritative module links
 * (students / teachers / users / contacts) instead of retired contact role fields.
 */
export function useMessagingWorkRecipients(
  params: UseMessagingWorkRecipientsParams,
): MessagingWorkRecipientsResult {
  const pageSize = params.pageSize ?? CONTACTS_MODULE_MANIFEST.defaultPageSize;
  const enabled = params.enabled !== false;
  const roleFilter = params.roleFilter;
  const genderFilter = params.genderFilter;
  const search = params.search;
  const page = params.page;

  const useContactsSource = roleFilter === 'all' || roleFilter === 'contacts';
  const useStudentsSource = roleFilter === 'students';
  const useTeachersSource = roleFilter === 'teachers';
  const useStaffSource = roleFilter === 'staff';
  const needsExcludeLinks = roleFilter === 'contacts';
  const needStudentLinks = enabled && (useStudentsSource || needsExcludeLinks);
  const needTeacherLinks = enabled && (useTeachersSource || needsExcludeLinks);

  const studentLinksQuery = useStudentLinkedContactIds(undefined, needStudentLinks);
  const teacherLinksQuery = useTeacherLinkedContactIds(undefined, needTeacherLinks);

  const excludeIdsReady = !needsExcludeLinks
    || (studentLinksQuery.isSuccess && teacherLinksQuery.isSuccess);
  const excludeIds = useMemo(() => {
    if (!needsExcludeLinks || !excludeIdsReady) return undefined;
    const ids = [
      ...(studentLinksQuery.data ?? []),
      ...(teacherLinksQuery.data ?? []),
    ];
    return ids.length > 0 ? ids : undefined;
  }, [excludeIdsReady, needsExcludeLinks, studentLinksQuery.data, teacherLinksQuery.data]);

  const contactsPageQuery = useContactsPaginated({
    page,
    limit: pageSize,
    search,
    gender: genderFilter === 'all' ? undefined : genderFilter,
    hasReachable: true,
    excludeIds,
    enabled: enabled && useContactsSource && excludeIdsReady,
  });

  const studentLinkIds = useMemo(
    () => (useStudentsSource ? (studentLinksQuery.data ?? []) : []),
    [studentLinksQuery.data, useStudentsSource],
  );
  const teacherLinkIds = useMemo(
    () => (useTeachersSource ? (teacherLinksQuery.data ?? []) : []),
    [teacherLinksQuery.data, useTeachersSource],
  );

  const {
    data: studentContacts = [],
    isPending: studentContactsPending,
    isError: studentContactsError,
    refetch: refetchStudentContacts,
  } = useContactsByIds(studentLinkIds);
  const {
    data: teacherContacts = [],
    isPending: teacherContactsPending,
    isError: teacherContactsError,
    refetch: refetchTeacherContacts,
  } = useContactsByIds(teacherLinkIds);

  const usersQuery = useUsers({ enabled: enabled && useStaffSource });

  const staffContactIdsAll = useMemo(() => {
    if (!useStaffSource) return [] as Array<string | number>;
    return usersQuery.syncedData
      .filter((user) => user.contactId != null && !TEACHER_USER_ROLES.has(String(user.role || '').toLowerCase()))
      .map((user) => user.contactId as string | number);
  }, [useStaffSource, usersQuery.syncedData]);

  const {
    data: staffContactsAll = [],
    isPending: staffContactsPending,
    isError: staffContactsError,
    refetch: refetchStaffContacts,
  } = useContactsByIds(useStaffSource ? staffContactIdsAll : []);

  const filterModuleContacts = (ids: Array<string | number>, resolved: Contact[]): Contact[] => (
    orderedContactsFromIds(ids, resolved)
      .filter(hasReachableAddress)
      .filter((contact) => matchesGender(contact, genderFilter))
      .filter((contact) => matchesSearch(contact, search))
  );

  if (useStudentsSource) {
    const filtered = filterModuleContacts(studentLinkIds, studentContacts);
    return {
      ...buildFilteredPage(filtered, page, pageSize),
      isError: studentLinksQuery.isError || studentContactsError,
      isPending: studentLinksQuery.isPending || (studentLinkIds.length > 0 && studentContactsPending),
      refetch: () => {
        void studentLinksQuery.refetch();
        void refetchStudentContacts();
      },
    };
  }

  if (useTeachersSource) {
    const filtered = filterModuleContacts(teacherLinkIds, teacherContacts);
    return {
      ...buildFilteredPage(filtered, page, pageSize),
      isError: teacherLinksQuery.isError || teacherContactsError,
      isPending: teacherLinksQuery.isPending || (teacherLinkIds.length > 0 && teacherContactsPending),
      refetch: () => {
        void teacherLinksQuery.refetch();
        void refetchTeacherContacts();
      },
    };
  }

  if (useStaffSource) {
    const filtered = filterModuleContacts(staffContactIdsAll, staffContactsAll);
    return {
      ...buildFilteredPage(filtered, page, pageSize),
      isError: usersQuery.queryResult.isError || staffContactsError,
      isPending: usersQuery.queryResult.isPending || (staffContactIdsAll.length > 0 && staffContactsPending),
      refetch: () => {
        void usersQuery.queryResult.refetch();
        void refetchStaffContacts();
      },
    };
  }

  if (!excludeIdsReady) {
    return {
      contacts: [],
      page,
      total: 0,
      limit: pageSize,
      hasMore: false,
      isError: studentLinksQuery.isError || teacherLinksQuery.isError,
      isPending: true,
      refetch: () => {
        void studentLinksQuery.refetch();
        void teacherLinksQuery.refetch();
      },
    };
  }

  return {
    contacts: contactsPageQuery.data?.contacts ?? [],
    page: contactsPageQuery.data?.page ?? page,
    total: contactsPageQuery.data?.total ?? 0,
    limit: contactsPageQuery.data?.limit ?? pageSize,
    hasMore: Boolean(contactsPageQuery.data?.hasMore),
    isError: contactsPageQuery.isError,
    isPending: contactsPageQuery.isPending,
    refetch: () => {
      void contactsPageQuery.refetch();
      if (needsExcludeLinks) {
        void studentLinksQuery.refetch();
        void teacherLinksQuery.refetch();
      }
    },
  };
}
