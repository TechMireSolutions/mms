import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BankReconciliationMatch,
  BankStatement,
  BankStatementInsert,
  FiscalYear,
  OpeningBalance,
  PostingRules,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const RULES_KEY = ["accounting", "posting-rules"] as const;
const OPENING_KEY = ["accounting", "opening-balances"] as const;
const BANK_KEY = ["accounting", "bank-statements"] as const;

export function useAccountingPostingRules(enabled = true) {
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: async ({ signal }) => {
      const body = await apiJson<{ rules: PostingRules }>("/api/accounting/posting-rules", { signal });
      return body.rules;
    },
    enabled,
  });
}

export function useSaveAccountingPostingRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rules: PostingRules) =>
      apiJson<{ rules: PostingRules }>("/api/accounting/posting-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useCloseFiscalYear() {
  return useMutation({
    mutationFn: (id: string) =>
      apiJson<{ fiscalYear: FiscalYear }>(`/api/accounting/fiscal-years/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
  });
}

export function useOpeningBalances(fiscalYearId: string | undefined) {
  return useQuery({
    queryKey: [...OPENING_KEY, fiscalYearId],
    queryFn: async ({ signal }) => {
      const body = await apiJson<{ balances: OpeningBalance[] }>(
        `/api/accounting/opening-balances?fiscalYearId=${encodeURIComponent(fiscalYearId ?? "")}`,
        { signal },
      );
      return body.balances;
    },
    enabled: Boolean(fiscalYearId),
  });
}

export function useSaveOpeningBalances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { fiscalYearId: string; balances: OpeningBalance[] }) =>
      apiJson<{ balances: OpeningBalance[] }>("/api/accounting/opening-balances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OPENING_KEY }),
  });
}

export function usePostOpeningBalances() {
  return useMutation({
    mutationFn: (fiscalYearId: string) =>
      apiJson<{ success: boolean }>(`/api/accounting/opening-balances/${fiscalYearId}/post`, {
        method: "POST",
      }),
  });
}

export function useBankStatements(enabled = true) {
  return useQuery({
    queryKey: BANK_KEY,
    queryFn: async ({ signal }) => {
      const body = await apiJson<{ statements: BankStatement[] }>("/api/accounting/bank-statements", { signal });
      return body.statements;
    },
    enabled,
  });
}

export function useSaveBankStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (statement: BankStatementInsert) =>
      apiJson<{ statement: BankStatement }>("/api/accounting/bank-statements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statement),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANK_KEY }),
  });
}

export function useMatchBankReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (match: BankReconciliationMatch) =>
      apiJson<{ success: boolean }>("/api/accounting/bank-reconciliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(match),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANK_KEY }),
  });
}
