import { useEffect, useState } from "react";
import { ReceiptText, CreditCard } from "lucide-react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleShortcuts } from "@/hooks/useModuleShortcuts";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { type Invoice } from '@/lib/data/financeData';
import { FINANCE_MODULE_MANIFEST, type InvoiceCreateInput, type Payment, type PaymentCreateInput } from "@mms/shared";
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
import { useFinanceCollectMutations } from "@/tenant/features/finance/hooks/useFinanceCollect";

export function useFinancePageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(FINANCE_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SUB_TABS = (() => [
      { id: "invoices", label: t("finance.invoices"), icon: ReceiptText },
      { id: "payments", label: t("finance.payments"), icon: CreditCard },
    ])();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("finance_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("invoices");
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const invoicesResult = useFinanceInvoicesPaginated({ includeDeleted: showDeleted, page: 1, limit: 100 });
  const paymentsResult = useFinancePaymentsPaginated({ includeDeleted: showDeleted, page: 1, limit: 100 });
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
  const { canWriteMessaging, messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const { collect, remind } = useFinanceCollectMutations();
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);

  const invoiceColumnLayout = useFinanceInvoiceColumnLayout();
  const paymentColumnLayout = useFinancePaymentColumnLayout();

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
    clearSelection: () => {
      setViewInvoice(null);
      setRecordInvoice(null);
      setCreatingInvoice(false);
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
      throw new NotifiedMutationError(error instanceof Error ? error.message : String(error));
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
      throw new NotifiedMutationError(error instanceof Error ? error.message : String(error));
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
    } else if (result.succeeded > 1) {
      notify.success(
        t(
          successKey === "finance.trash.deleted"
            ? "finance.trash.bulkDeleted"
            : "finance.trash.bulkRestored",
          { count: result.succeeded },
        ),
      );
    } else {
      notify.success(t(successKey));
    }
  };

  const handleCollectOverdue = async (): Promise<void> => {
    try {
      const result = await collect.mutateAsync({ applyLateFee: true });
      notify.success(t("finance.collect.success", { overdue: result.markedOverdue, lateFees: result.lateFeesApplied }));
    } catch (error) {
      notify.error(t("finance.collect.failed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRemindInvoices = async (): Promise<void> => {
    try {
      const result = await remind.mutateAsync({});
      if (result.recipients.length === 0) {
        notify.info(t("finance.collect.remindNone"));
        return;
      }
      notify.success(t("finance.collect.reminded", { count: result.reminded }));
      if (!canWriteMessaging) return;
      const hasPhone = result.recipients.some((recipient) => recipient.phone);
      openComposer(
        hasPhone ? "whatsapp" : "email",
        result.recipients.map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          phone: recipient.phone,
          email: recipient.email,
        })),
        { initialMessage: t("finance.collect.remindMessage") },
      );
    } catch (error) {
      notify.error(t("finance.collect.remindFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const openCreateInvoice = () => {
    setActiveTab("work");
    setActiveSubTab("invoices");
    setCreatingInvoice(true);
  };

  const handleBulkStatusChange = async (ids: string[], status: string): Promise<void> => {
    try {
      const result = await bulkUpdateInvoiceStatus.mutateAsync({ ids, status: status as import('@mms/shared').InvoicesBulkStatusBody['status'] });
      if (result.failed > 0) {
        notify.error(t('finance.bulkStatusFailed'), { description: `${result.succeeded} updated, ${result.failed} failed` });
      } else if (result.succeeded > 1) {
        notify.success(t('finance.bulkStatusSuccessMany', { count: result.succeeded }));
      } else {
        notify.success(t('finance.bulkStatusSuccess'));
      }
    } catch {
      notify.error(t('finance.bulkStatusFailed'));
    }
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
    collectPending: collect.isPending,
    remindPending: remind.isPending,
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
  };
}

export type FinancePageController = ReturnType<typeof useFinancePageController>;
