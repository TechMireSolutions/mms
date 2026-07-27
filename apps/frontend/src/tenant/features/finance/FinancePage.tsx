import React, { useEffect, useMemo, useState } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptText, CreditCard, Plus, DollarSign, Archive } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import { InvoiceList } from "@/tenant/features/finance/components/InvoiceList";
import { InvoiceDetail } from "@/tenant/features/finance/components/InvoiceDetail";
import { InvoiceForm } from "@/tenant/features/finance/components/InvoiceForm";
import { PaymentForm } from "@/tenant/features/finance/components/PaymentForm";
import { PaymentTracker } from "@/tenant/features/finance/components/PaymentTracker";
import { FinanceSettings } from "@/tenant/features/finance/components/FinanceSettings";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Invoice } from '@/lib/data/financeData';
import { FINANCE_MODULE_CONTRACT, type InvoiceCreateInput, type PaymentCreateInput } from "@mms/shared";
import {
  useFinanceInvoices,
  useFinancePayments,
  useFinanceMutations,
  NotifiedFinanceMutationError,
} from "@/tenant/features/finance/hooks/useFinanceApi";
import { useFinanceInvoiceColumnLayout } from "@/tenant/features/finance/hooks/useFinanceInvoiceColumnLayout";
import { useFinancePaymentColumnLayout } from "@/tenant/features/finance/hooks/useFinancePaymentColumnLayout";
import { FinanceCommandMetrics } from "@/tenant/features/finance/components/FinanceCommandMetrics";
import { notify } from "@/lib/notify";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";

/**
 * Finance — invoices and payments. Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Finance page component.
 */
export default function Finance() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(FINANCE_MODULE_CONTRACT);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SUB_TABS = useMemo(
    () => [
      { id: "invoices", label: t("finance.invoices"), icon: ReceiptText },
      { id: "payments", label: t("finance.payments"), icon: CreditCard },
    ],
    [t]
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>("finance_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("invoices");
  const [showDeleted, setShowDeleted] = useState(false);
  const invoicesResult = useFinanceInvoices({ includeDeleted: showDeleted });
  const paymentsResult = useFinancePayments({ includeDeleted: showDeleted });
  const invoices = invoicesResult.syncedData;
  const payments = paymentsResult.syncedData;
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && canWrite && !showDeleted) {
        event.preventDefault();
        setActiveTab("work");
        setActiveSubTab("invoices");
        setCreatingInvoice(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canWrite, setActiveTab, showDeleted]);

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

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.finance")}`}
      seoDescription={t("page.finance.subtitle")}
      headerIcon={DollarSign}
      headerTitle={t("nav.finance")}
      headerSubtitle={t("page.finance.subtitle")}
      headerActions={
        canWrite && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => {
              setActiveTab("work");
              setActiveSubTab("invoices");
              setCreatingInvoice(true);
            }}
          >
            {t("finance.newInvoice")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <FinanceCommandMetrics invoiceTotal={invoices.length} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="finance-tab"
      >
        {activeTab === "work" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SubTabBar
              tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
              value={activeSubTab}
              onChange={setActiveSubTab}
            />
            {canDelete && (
              <Button type="button" variant="outline" onClick={() => setShowDeleted((value) => !value)}>
                <Archive className="w-4 h-4" />
                {showDeleted ? t("finance.trash.showActive") : t("finance.trash.showDeleted")}
              </Button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab + "-" + activeSubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
            <ErrorBoundary>
            {activeTab === "reports" && (
              <div className="space-y-4">
                <KPISummary category="financial" />
                <ModuleReports category="financial" />
              </div>
            )}
            {activeTab === "setup" && (
              <FinanceSettings />
            )}

            {activeTab === "work" && activeSubTab === "invoices" && invoicesResult.queryResult.isError ? (
              <ErrorState title={t("finance.loadFailed")} onRetry={() => void invoicesResult.queryResult.refetch()} />
            ) : activeTab === "work" && activeSubTab === "invoices" && (
              <InvoiceList
                invoices={invoices}
                onView={setViewInvoice}
                onRecord={setRecordInvoice}
                canWrite={canWrite}
                canDelete={canDelete}
                canWriteMessaging={canWriteMessaging}
                showDeleted={showDeleted}
                onDelete={(id) => deleteInvoice.mutate(id, { onSuccess: () => notify.success(t("finance.trash.deleted")), onError: mutationError })}
                onRestore={(id) => restoreInvoice.mutate(id, { onSuccess: () => notify.success(t("finance.trash.restored")), onError: mutationError })}
                onBulkDelete={(ids) => bulkDeleteInvoices.mutate(ids, { onSuccess: (result) => handleBulkResult(result, "finance.trash.deleted"), onError: mutationError })}
                onBulkRestore={(ids) => bulkRestoreInvoices.mutate(ids, { onSuccess: (result) => handleBulkResult(result, "finance.trash.restored"), onError: mutationError })}
                selectionResetKey={`${activeSubTab}:${showDeleted}`}
                isColumnVisible={invoiceColumnLayout.isColumnVisible}
                getColumnWidth={invoiceColumnLayout.getColumnWidth}
                onColumnResize={invoiceColumnLayout.setColumnWidth}
                columnCustomizer={{
                  columnRegistry: invoiceColumnLayout.columnRegistry,
                  updateUserColumnLayout: invoiceColumnLayout.updateUserColumnLayout,
                  labels: invoiceColumnLayout.customizerLabels,
                }}
              />
            )}
            {activeTab === "work" && activeSubTab === "payments" && paymentsResult.queryResult.isError ? (
              <ErrorState title={t("finance.loadFailed")} onRetry={() => void paymentsResult.queryResult.refetch()} />
            ) : activeTab === "work" && activeSubTab === "payments" && (
              <PaymentTracker
                payments={payments}
                canDelete={canDelete}
                showDeleted={showDeleted}
                onDelete={(id) => deletePayment.mutate(id, { onSuccess: () => notify.success(t("finance.trash.deleted")), onError: mutationError })}
                onRestore={(id) => restorePayment.mutate(id, { onSuccess: () => notify.success(t("finance.trash.restored")), onError: mutationError })}
                onBulkDelete={(ids) => bulkDeletePayments.mutate(ids, { onSuccess: (result) => handleBulkResult(result, "finance.trash.deleted"), onError: mutationError })}
                onBulkRestore={(ids) => bulkRestorePayments.mutate(ids, { onSuccess: (result) => handleBulkResult(result, "finance.trash.restored"), onError: mutationError })}
                selectionResetKey={`${activeSubTab}:${showDeleted}`}
                isColumnVisible={paymentColumnLayout.isColumnVisible}
                getColumnWidth={paymentColumnLayout.getColumnWidth}
                onColumnResize={paymentColumnLayout.setColumnWidth}
                columnCustomizer={{
                  columnRegistry: paymentColumnLayout.columnRegistry,
                  updateUserColumnLayout: paymentColumnLayout.updateUserColumnLayout,
                  labels: paymentColumnLayout.customizerLabels,
                }}
              />
            )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {creatingInvoice && canWrite && !showDeleted && (
          <InvoiceForm
            open={creatingInvoice}
            saving={createInvoice.isPending}
            onClose={() => setCreatingInvoice(false)}
            onSave={handleCreateInvoice}
          />
        )}
        {viewInvoice && (
          <InvoiceDetail
            invoice={viewInvoice}
            onClose={() => setViewInvoice(null)}
            onRecord={(invoiceToRecord: Invoice) => { setViewInvoice(null); setRecordInvoice(invoiceToRecord); }}
            canWrite={canWrite}
          />
        )}
        {recordInvoice && canWrite && !showDeleted && (
          <PaymentForm open={!!recordInvoice} invoice={recordInvoice} onClose={() => setRecordInvoice(null)} onSave={handleRecordPayment} />
        )}
      </AnimatePresence>
    </ModulePageShell>
  );
}
