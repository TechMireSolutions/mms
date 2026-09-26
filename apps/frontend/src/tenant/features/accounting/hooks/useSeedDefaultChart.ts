import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/apiClient";
import { invalidateAccountingQueries } from "@/tenant/features/accounting/hooks/invalidateAccountingQueries";

/** Seeds the default Chart of Accounts; the server refuses (409) when any account already exists. */
export function useSeedDefaultChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiJson<{ success: boolean; count: number }>("/api/accounting/accounts/seed-default", { method: "POST" }),
    onSettled: () => invalidateAccountingQueries(queryClient),
  });
}
