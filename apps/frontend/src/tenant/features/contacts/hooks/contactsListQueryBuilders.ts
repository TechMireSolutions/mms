import {
  CONTACTS_MODULE_MANIFEST,
  type Contact,
  type ContactsListPageResult,
  type ContactsQuickFilter,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import {
  CONTACTS_API,
  CONTACTS_QUERY_KEY,
} from "@/tenant/features/contacts/hooks/contactsQueryKeys";

export interface ContactsPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  gender?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: "asc" | "desc";
  hasPhone?: boolean;
  hasReachable?: boolean;
  quickFilter?: ContactsQuickFilter;
  excludeIds?: Array<string | number>;
  excludeLinkedModules?: Array<"students" | "teachers">;
  enabled?: boolean;
}

export function buildContactsPageUrl(params: ContactsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(params.page));
  queryParams.set("limit", String(params.limit ?? CONTACTS_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set("search", params.search.trim());
  if (params.gender) queryParams.set("gender", params.gender);
  if (params.includeDeleted) queryParams.set("includeDeleted", "true");
  if (params.hasPhone) queryParams.set("hasPhone", "true");
  if (params.hasReachable) queryParams.set("hasReachable", "true");
  if (params.quickFilter && params.quickFilter !== "all") {
    queryParams.set("quickFilter", params.quickFilter);
  }
  if (params.excludeIds && params.excludeIds.length > 0) {
    queryParams.set("excludeIds", params.excludeIds.map(String).join(","));
  }
  if (params.excludeLinkedModules && params.excludeLinkedModules.length > 0) {
    queryParams.set("excludeLinkedModules", params.excludeLinkedModules.join(","));
  }
  if (params.sortField) queryParams.set("sortField", params.sortField);
  if (params.sortDir) queryParams.set("sortDir", params.sortDir);
  return `${CONTACTS_API}?${queryParams.toString()}`;
}

export function contactsListQueryKeyParams(params: ContactsPaginatedParams) {
  return {
    page: params.page,
    limit: params.limit ?? CONTACTS_MODULE_MANIFEST.defaultPageSize,
    search: params.search?.trim() || "",
    gender: params.gender || "",
    includeDeleted: Boolean(params.includeDeleted),
    hasPhone: Boolean(params.hasPhone),
    hasReachable: Boolean(params.hasReachable),
    quickFilter: params.quickFilter ?? "all",
    excludeIds: (params.excludeIds ?? []).map(String).join(","),
    excludeLinkedModules: (params.excludeLinkedModules ?? []).join(","),
    sortField: params.sortField || "",
    sortDir: params.sortDir || "asc",
  };
}

export function contactsPaginatedQueryKey(params: ContactsPaginatedParams) {
  return [...CONTACTS_QUERY_KEY, "page", contactsListQueryKeyParams(params)] as const;
}

export function sameContactsListFilters(
  previous: ReturnType<typeof contactsListQueryKeyParams> | undefined,
  next: ReturnType<typeof contactsListQueryKeyParams>,
): boolean {
  if (!previous) return false;
  return (
    previous.search === next.search &&
    previous.gender === next.gender &&
    previous.includeDeleted === next.includeDeleted &&
    previous.hasPhone === next.hasPhone &&
    previous.hasReachable === next.hasReachable &&
    previous.quickFilter === next.quickFilter &&
    previous.excludeIds === next.excludeIds &&
    previous.excludeLinkedModules === next.excludeLinkedModules &&
    previous.sortField === next.sortField &&
    previous.sortDir === next.sortDir &&
    previous.limit === next.limit
  );
}

/** Fetches all pages matching Work filters for export. */
export async function fetchAllContactsForQuery(
  params: Omit<ContactsPaginatedParams, "page" | "enabled">,
  onProgress?: (fetched: number, total: number) => void,
): Promise<Contact[]> {
  const limit = CONTACTS_MODULE_MANIFEST.maxPageSize;
  const all: Contact[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const contactsPage = await apiJson<ContactsListPageResult>(
      buildContactsPageUrl({ ...params, page, limit }),
    );
    all.push(...contactsPage.contacts);
    total = contactsPage.total;
    onProgress?.(all.length, total);
    if (!contactsPage.hasMore || all.length >= total) break;
    const maxPages = Math.max(1, Math.ceil(Math.max(total, 1) / limit) + 2);
    if (page >= maxPages) break;
    page += 1;
  }

  return all;
}

export async function fetchContactById(contactId: string): Promise<Contact> {
  const contactResponse = await apiJson<{ contact: Contact }>(`${CONTACTS_API}/${contactId}`);
  return contactResponse.contact;
}

export async function fetchContacts(includeDeleted = false): Promise<Contact[]> {
  return fetchAllContactsForQuery({ includeDeleted });
}
