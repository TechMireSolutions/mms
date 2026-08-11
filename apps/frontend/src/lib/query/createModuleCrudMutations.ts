import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/apiClient";

export interface ModuleBulkRestoreResult {
  success: boolean;
  succeeded: number;
  failed: number;
  /** Optional per-row restore blockers (e.g. unique-field conflicts). */
  conflicts?: Array<{ id: string; errors: Array<{ message: string }> }>;
}

export interface CreateModuleCrudMutationsOptions<TRecord> {
  apiBase: string;
  normalizeStored: (record: TRecord) => TRecord;
  invalidate: (queryClient: QueryClient) => void;
  /** Key of the record in the update mutation input (`teacher`/`student`/`item`). */
  updateRecordKey?: string;
}

/**
 * Shared server CRUD mutation hooks (create / update / delete / bulk-delete /
 * restore / bulk-restore / bulk-status + export/setup audit) for module Work.
 * Teachers/Students adapters pass the module API base + normalize + invalidate.
 */
export function createModuleCrudMutations<TRecord>({
  apiBase,
  normalizeStored,
  invalidate,
  updateRecordKey = "item",
}: CreateModuleCrudMutationsOptions<TRecord>) {
  function useModuleMutations() {
    const queryClient = useQueryClient();
    const invalidateAll = () => invalidate(queryClient);

    const create = useMutation({
      mutationFn: async (record: TRecord) => {
        const normalized = normalizeStored(record);
        return apiJson<{ item: TRecord }>(apiBase, {
          method: "POST",
          body: JSON.stringify(normalized),
        });
      },
      onSuccess: invalidateAll,
    });

    const update = useMutation({
      mutationFn: async (input: { id: string } & Record<string, TRecord | string>) => {
        const { id } = input;
        const item = input[updateRecordKey] as TRecord;
        const normalized = normalizeStored(item);
        return apiJson<{ item: TRecord }>(`${apiBase}/${id}`, {
          method: "PUT",
          body: JSON.stringify(normalized),
        });
      },
      onSuccess: invalidateAll,
    });

    const remove = useMutation({
      mutationFn: async ({ id, deletionReason }: { id: string; deletionReason?: string }) =>
        apiJson<{ success: boolean }>(`${apiBase}/${id}`, {
          method: "DELETE",
          body: JSON.stringify(deletionReason ? { deletionReason } : {}),
        }),
      onSuccess: invalidateAll,
    });

    const bulkDelete = useMutation({
      mutationFn: async ({ ids, deletionReason }: { ids: string[]; deletionReason?: string }) =>
        apiJson<{ success: boolean; succeeded: number; failed: number }>(`${apiBase}/bulk-delete`, {
          method: "POST",
          body: JSON.stringify({
            ids,
            ...(deletionReason ? { deletionReason } : {}),
          }),
        }),
      onSuccess: invalidateAll,
    });

    const restore = useMutation({
      mutationFn: async (id: string) =>
        apiJson<{ success: boolean }>(`${apiBase}/${encodeURIComponent(id)}/restore`, {
          method: "POST",
        }),
      onSuccess: invalidateAll,
    });

    const bulkRestore = useMutation({
      mutationFn: async (ids: string[]) =>
        apiJson<ModuleBulkRestoreResult>(`${apiBase}/bulk-restore`, {
          method: "POST",
          body: JSON.stringify({ ids }),
        }),
      onSuccess: invalidateAll,
    });

    const bulkStatus = useMutation({
      mutationFn: async ({ ids, status }: { ids: string[]; status: string }) =>
        apiJson<{ success: boolean; succeeded: number; failed: number }>(`${apiBase}/bulk-status`, {
          method: "POST",
          body: JSON.stringify({ ids, status }),
        }),
      onSuccess: invalidateAll,
    });

    const logExportAudit = useMutation({
      mutationFn: async (payload: {
        count: number;
        scope: "all" | "filtered" | "selection";
      }) =>
        apiJson<{ success: boolean }>(`${apiBase}/export-audit`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
    });

    const logSetupAudit = useMutation({
      mutationFn: async (payload: { area: "fields" | "preferences"; summary: string }) =>
        apiJson<{ success: boolean }>(`${apiBase}/setup-audit`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
    });

    return {
      create,
      update,
      remove,
      bulkDelete,
      restore,
      bulkRestore,
      bulkStatus,
      logExportAudit,
      logSetupAudit,
    };
  }

  return useModuleMutations;
}
