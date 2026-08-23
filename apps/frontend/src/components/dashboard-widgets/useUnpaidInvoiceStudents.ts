import { useMemo } from "react";
import { isOpenInvoiceStatus } from "@mms/shared";
import { useFinanceInvoicesPaginated } from "@/tenant/features/finance/hooks/useFinanceApi";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { uniqueRegistryIds } from "@/lib/registryResolve";

/**
 * Shared finance-widget pipeline: load invoices, filter to open (unpaid)
 * invoices via the `isOpenInvoiceStatus` SSOT predicate, and hydrate the
 * referenced students into a lookup map. Consumed by the outstanding-fees
 * and overdue-obligations widgets.
 */
export function useUnpaidInvoiceStudents() {
  const invoices = useFinanceInvoicesPaginated({ page: 1, limit: 500 }).data?.invoices ?? [];
  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => isOpenInvoiceStatus(invoice.status)),
    [invoices],
  );
  const studentIds = useMemo(
    () => uniqueRegistryIds(unpaidInvoices.map((invoice) => invoice.studentId)),
    [unpaidInvoices],
  );
  const { data: students = [] } = useStudentsByIds(studentIds);
  const studentMap = useMemo(
    () => new Map(students.map((student: any) => [String(student.id), student])),
    [students],
  );
  return { invoices, unpaidInvoices, students, studentMap };
}