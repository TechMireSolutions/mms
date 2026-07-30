import { useEffect, useMemo, useState } from "react";
import { ReceiptText, CreditCard } from "lucide-react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { Invoice } from '@/lib/data/financeData';
import { FINANCE_MODULE_MANIFEST, type InvoiceCreateInput, type PaymentCreateInput } from "@mms/shared";
import {
  useFinanceInvoices,
  useFinancePayments,
  useFinanceMutations,
  NotifiedFinanceMutationError,
} from "@/tenant/features/finance/hooks/useFinanceApi";
import { useFinanceInvoiceColumnLayout } from "@/tenant/features/finance/hooks/useFinanceInvoiceColumnLayout";
import { useFinancePaymentColumnLayout } from "@/tenant/features/finance/hooks/useFinancePaymentColumnLayout";
import { notify } from "@/lib/notify";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";

export function useFinancePageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(FINANCE_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SUB_TABS = useMemo(
    () => [
      { id: "invoices", label: t("finance.invoices"), icon: ReceiptText },
      { id: "payments", label: t("finance.payments"), icon: CreditCard },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>("finance_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("invoices");
  const [showDeleted, setShowDeleted] = useState(false);
  const invoicesResult = useFinanceInvoices({ includeDeleted: showDeleted });
  const paymentsResult = useFinancePayments({ includeDeleted: showDeleted });
  const invoices = invoicesResult.data;
  const payments = paymentsResult.data;
  const {
    createInvoice,
    createPayment,
    deleteInvoice,
    restoreInvoice,
    bulkDeleteInvoices,
    bulkRestoreInvoices,
    deletePayment,
    restorePayment,
    bulkDeletePayments,
    bulkRestorePayments,
  } = useFinanceMutations();
  const { canWriteMessaging } = useMessageComposerState();
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const invoiceColumnLayout = useFinanceInvoiceColumnLayout();
  const paymentColumnLayout = useFinancePaymentColumnLayout();

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setActiveTab("work");
      setActiveSubTab("invoices");
      setCreatingInvoice(true);
    },
  });

  useEffect(() => {
    if (activeTab !== "work") setShowDeleted(false);
  }, [activeTab]);

  const handleRecordPayment = async (paymentToRecord: PaymentCreateInput): Promise<void> => {
    try {
      await createPayment.mutateAsync(paymentToRecord);
      setRecordInvoice(null);
    } catch (error: unknown) {
      notify.error(t("finance.paymentSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw new NotifiedFinanceMutationError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCreateInvoice = async (invoiceToCreate: InvoiceCreateInput): Promise<void> => {
    try {
      await createInvoice.mutateAsync(invoiceToCreate);
      setCreatingInvoice(false);
      setActiveTab("work");
      setActiveSubTab("invoices");
    } catch (error: unknown) {
      notify.error(t("finance.invoiceSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw new NotifiedFinanceMutationError(error instanceof Error ? error.message : String(error));
    }
  };

  const mutationError = (error: Error): void => {
    notify.error(t("finance.trash.actionFailed"), { description: error.message });
  };

  const handleBulkResult = (
    result: { succeeded: number; failed: number },
    successKey: "finance.trash.deleted" | "finance.trash.restored",
  ): void => {
    if (result.failed > 0) {
      notify.error(t("finance.trash.bulkPartial", { succeeded: result.succeeded, failed: result.failed }));
    } else {
      notify.success(t(successKey));
    }
  };

  const openCreateInvoice = () => {
    setActiveTab("work");
    setActiveSubTab("invoices");
    setCreatingInvoice(true);
  };

  return {
    t,
    canWrite,
    canDelete,
    PAGE_TABS,
    SUB_TABS,
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    showDeleted,
    setShowDeleted,
    invoicesResult,
    paymentsResult,
    invoices,
    payments,
    createInvoice,
    canWriteMessaging,
    viewInvoice,
    setViewInvoice,
    recordInvoice,
    setRecordInvoice,
    creatingInvoice,
    setCreatingInvoice,
    invoiceColumnLayout,
    paymentColumnLayout,
    handleRecordPayment,
    handleCreateInvoice,
    mutationError,
    handleBulkResult,
    openCreateInvoice,
    deleteInvoice,
    restoreInvoice,
    bulkDeleteInvoices,
    bulkRestoreInvoices,
    deletePayment,
    restorePayment,
    bulkDeletePayments,
    bulkRestorePayments,
  };
}

export type FinancePageController = ReturnType<typeof useFinancePageController>;
