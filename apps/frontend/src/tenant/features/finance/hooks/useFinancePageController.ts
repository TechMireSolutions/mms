import { useEffect, useState } from "react";
import { ReceiptText, CreditCard } from "lucide-react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleShortcuts } from "@/hooks/useModuleShortcuts";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { useTrashMode } from "@/hooks/useTrashMode";
import { type Invoice } from '@/lib/data/financeData';
import {
  FINANCE_MODULE_MANIFEST,
  type InvoiceCreateInput,
  type Payment,
  type PaymentCreateInput,
} from "@mms/shared";
import {
  useFinanceInvoicesPaginated,
  useFinancePaymentsPaginated,
  useFinanceMutations,
} from "@/tenant/features/finance/hooks/useFinanceApi";
import { NotifiedMutationError } from "@/lib/notifiedMutationError";
import { useFinanceInvoiceColumnLayout } from "@/tenant/features/finance/hooks/useFinanceInvoiceColumnLayout";
import { useFinancePaymentColumnLayout } from "@/tenant/features/finance/hooks/useFinancePaymentColumnLayout";
import { notify } from "@/lib/notify";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useWorkSelection } from "@/hooks/useWorkSelection";
import { useFinanceCollectActions } from "./useFinanceCollectActions";
import { useFinanceBulkActions } from "./useFinanceBulkActions";

export function useFinancePageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(FINANCE_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SUB_TABS = [
    { id: "invoices", label: t("finance.invoices"), icon: ReceiptText },
    { id: "payments", label: t("finance.payments"), icon: CreditCard },
  ];
  const [activeTab, setActiveTab] = usePersistedTabState<string>("finance_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("invoices");
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [showDeleted, setShowDeleted] = useTrashMode();
  const invoicesResult = useFinanceInvoicesPaginated({
    includeDeleted: showDeleted,
    page: 1,
    limit: 100,
  });
  const paymentsResult = useFinancePaymentsPaginated({
    includeDeleted: showDeleted,
    page: 1,
    limit: 100,
  });
  const invoices = invoicesResult.data?.invoices ?? [];
  const payments = paymentsResult.data?.payments ?? [];
  const {
    createInvoice,
    createPayment,
    deleteInvoice,
    restoreInvoice,
    bulkDeleteInvoices,
    bulkRestoreInvoices,
    bulkUpdateInvoiceStatus,
    deletePayment,
    restorePayment,
    bulkDeletePayments,
    bulkRestorePayments,
  } = useFinanceMutations();
  const { canWriteMessaging, messagingTarget, openComposer, closeComposer } =
    useMessageComposerState();
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);

  const invoiceColumnLayout = useFinanceInvoiceColumnLayout();
  const paymentColumnLayout = useFinancePaymentColumnLayout();

  const invoiceSelection = useWorkSelection<string>();
  const paymentSelection = useWorkSelection<string>();

  const { clearSelection: clearInvoiceSelection } = invoiceSelection;
  const { clearSelection: clearPaymentSelection } = paymentSelection;
  useEffect(() => {
    clearInvoiceSelection();
    clearPaymentSelection();
  }, [activeSubTab, showDeleted, clearInvoiceSelection, clearPaymentSelection]);

  useModuleShortcuts({
    enabled: activeTab === "work",
    canWrite,
    showDeleted,
    onCreate: () => {
      setActiveTab("work");
      setActiveSubTab("invoices");
      setCreatingInvoice(true);
    },
    searchInputId: "finance-search-input",
    selectedCount: invoiceSelection.selectedIds.length + paymentSelection.selectedIds.length,
    clearSelection: () => {
      setViewInvoice(null);
      setRecordInvoice(null);
      setCreatingInvoice(false);
      clearInvoiceSelection();
      clearPaymentSelection();
    },
  });

  useEffect(() => {
    if (activeTab !== "work") setShowDeleted(false);
  }, [activeTab]);

  const handleRecordPayment = async (
    paymentToRecord: PaymentCreateInput,
  ): Promise<void> => {
    try {
      await createPayment.mutateAsync(paymentToRecord);
      setRecordInvoice(null);
    } catch (error: unknown) {
      notify.error(t("finance.paymentSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw new NotifiedMutationError(
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const handleCreateInvoice = async (
    invoiceToCreate: InvoiceCreateInput,
  ): Promise<void> => {
    try {
      await createInvoice.mutateAsync(invoiceToCreate);
      setCreatingInvoice(false);
      setActiveTab("work");
      setActiveSubTab("invoices");
    } catch (error: unknown) {
      notify.error(t("finance.invoiceSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw new NotifiedMutationError(
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const { mutationError, handleBulkResult, handleBulkStatusChange } =
    useFinanceBulkActions({
      bulkUpdateInvoiceStatus,
      clearInvoiceSelection,
      clearPaymentSelection,
      t,
    });

  const {
    handleCollectOverdue,
    handleRemindInvoices,
    collectPending,
    remindPending,
  } = useFinanceCollectActions({
    canWriteMessaging,
    openComposer,
    t,
  });

  const openCreateInvoice = () => {
    setActiveTab("work");
    setActiveSubTab("invoices");
    setCreatingInvoice(true);
  };

  return {
    activePayment,
    setActivePayment,
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
    generatingInvoices,
    setGeneratingInvoices,
    invoiceColumnLayout,
    paymentColumnLayout,
    handleRecordPayment,
    handleCreateInvoice,
    mutationError,
    handleBulkResult,
    openCreateInvoice,
    handleCollectOverdue,
    handleRemindInvoices,
    collectPending,
    remindPending,
    messagingTarget,
    closeComposer,
    deleteInvoice,
    restoreInvoice,
    bulkDeleteInvoices,
    bulkRestoreInvoices,
    deletePayment,
    restorePayment,
    bulkDeletePayments,
    bulkRestorePayments,
    bulkUpdateInvoiceStatus,
    handleBulkStatusChange,
    invoiceSelection,
    paymentSelection,
  };
}

export type FinancePageController = ReturnType<typeof useFinancePageController>;
