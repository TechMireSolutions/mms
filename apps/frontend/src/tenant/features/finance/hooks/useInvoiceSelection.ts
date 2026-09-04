import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Invoice } from '@/lib/data/financeData';

/** Work directory row selection SSOT for Finance invoices (Enrollments-shaped). */
export function useInvoiceSelection(invoices: Invoice[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = new Set(selectedIds);
  const allVisibleSelected = invoices.length > 0
    && invoices.every((invoice) => selectedSet.has(invoice.id));
  const someVisibleSelected = selectedSet.size > 0 && invoices.some((invoice) => selectedSet.has(invoice.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = invoices.map((invoice) => invoice.id);
    const visibleSet = new Set(visibleIds);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleSet.has(id)));
  };

  const toggleSelectedInvoice = (id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  };

  const clearSelection = () => setSelectedIds([]);

  return {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedInvoice,
    clearSelection,
  };
}

export type InvoiceSelection = ReturnType<typeof useInvoiceSelection>;
export type { Dispatch, SetStateAction };
