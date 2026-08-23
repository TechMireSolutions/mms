/**
 * Phase 7: Contract-driven query/mutation hooks for the Contacts module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { CONTACTS_QUERY_KEY, CONTACTS_REPORT_ANALYTICS_QUERY_KEY } from '@/tenant/features/contacts/hooks/contactsQueryKeys';
import { invalidateContactsQueries } from '@/tenant/features/contacts/hooks/invalidateContactsQueries';

export function useContactsContractList(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.list.useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, 'contract-list', query],
    queryData: { query: query as any },
    staleTime: 15_000,
    enabled,
  });
}

export function useContactsContractGet(id: string, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.get.useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, 'detail', id],
    queryData: { params: { id } },
    enabled,
    staleTime: 30_000,
  });
}

export function useContactsContractReportAnalytics(query: { years?: number[]; lang?: string }, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.reportAnalytics.useQuery({
    queryKey: [...CONTACTS_REPORT_ANALYTICS_QUERY_KEY, query],
    queryData: { query },
    enabled,
    staleTime: 60_000,
  });
}

export function useContactsContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.create.useMutation({ onSuccess: () => invalidateContactsQueries(queryClient) });
}

export function useContactsContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.update.useMutation({ onSuccess: () => invalidateContactsQueries(queryClient) });
}

export function useContactsContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.delete.useMutation({ onSuccess: () => invalidateContactsQueries(queryClient) });
}

export function useContactsContractRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.restore.useMutation({ onSuccess: () => invalidateContactsQueries(queryClient) });
}

export function useContactsContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.bulkDelete.useMutation({ onSuccess: () => invalidateContactsQueries(queryClient) });
}

export function useContactsContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.bulkRestore.useMutation({ onSuccess: () => invalidateContactsQueries(queryClient) });
}

export function useContactsContractLogExportAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.exportAudit.useMutation({});
}

export function useContactsContractLogSetupAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.setupAudit.useMutation({});
}

export function useContactsContractFieldConfig(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.getFieldConfig.useQuery({
    queryKey: ['contacts', 'field-config', 'contract'],
    queryData: {},
    staleTime: 30_000,
    enabled,
  });
}

export function useContactsContractPreferences(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.getPreferences.useQuery({
    queryKey: ['contacts', 'preferences', 'contract'],
    queryData: {},
    staleTime: 30_000,
    enabled,
  });
}

export function useContactsContractUpdateFieldConfig() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.updateFieldConfig.useMutation({
    onSuccess: () => invalidateContactsQueries(queryClient)
  });
}

export function useContactsContractUpdatePreferences() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.updatePreferences.useMutation({
    onSuccess: () => invalidateContactsQueries(queryClient)
  });
}
