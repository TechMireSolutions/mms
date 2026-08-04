import React from "react";
import { useFinancePageController } from "@/tenant/features/finance/hooks/useFinancePageController";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, DollarSign } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
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
import { FinanceCommandMetrics } from "@/tenant/features/finance/components/FinanceCommandMetrics";
import { notify } from "@/lib/notify";

/**
 * Finance — invoices and payments. Work | Reports | Setup.
 */
export default function Finance() {
  const c = useFinancePageController();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${c.t("nav.finance")}`}
      seoDescription={c.t("page.finance.subtitle")}
      headerIcon={DollarSign}
      headerTitle={c.t("nav.finance")}
      headerSubtitle={c.t("page.finance.subtitle")}
      headerActions={
        c.canWrite && !c.showDeleted ? (
          <ActionButton variant="primary" icon={Plus} onClick={c.openCreateInvoice}>
            {c.t("finance.newInvoice")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={<FinanceCommandMetrics invoiceTotal={c.invoices.length} />}
    >
      <ResponsiveAccordionTabs
        tabs={c.PAGE_TABS}
        activeTab={c.activeTab}
        onTabChange={c.setActiveTab}
        panelIdPrefix="finance-tab"
      >
        {c.activeTab === "work" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SubTabBar
              tabs={c.SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
              value={c.activeSubTab}
              onChange={c.setActiveSubTab}
            />
            {c.canDelete && (
              <ModuleTrashToggle
                showDeleted={c.showDeleted}
                onToggle={() => c.setShowDeleted((value) => !value)}
                showActiveLabel={c.t("finance.trash.showActive")}
                showDeletedLabel={c.t("finance.trash.showDeleted")}
              />
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={c.activeTab + "-" + c.activeSubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
            <ErrorBoundary>
              {c.activeTab === "reports" && (
                <div className="space-y-4">
                  <KPISummary category="financial" />
                  <ModuleReports category="financial" />
                </div>
              )}
              {c.activeTab === "setup" && <FinanceSettings />}

              {c.activeTab === "work" && c.activeSubTab === "invoices" && c.invoicesResult.queryResult.isError ? (
                <ErrorState
                  title={c.t("finance.loadFailed")}
                  description={c.t("finance.loadFailedHint")}
                  onRetry={() => void c.invoicesResult.queryResult.refetch()}
                />
              ) : c.activeTab === "work" && c.activeSubTab === "invoices" && (
                <InvoiceList
                  invoices={c.invoices}
                  onView={c.setViewInvoice}
                  onRecord={c.setRecordInvoice}
                  canWrite={c.canWrite}
                  canDelete={c.canDelete}
                  canWriteMessaging={c.canWriteMessaging}
                  showDeleted={c.showDeleted}
                  onDelete={(id) => c.deleteInvoice.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.deleted")), onError: c.mutationError })}
                  onRestore={(id) => c.restoreInvoice.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.restored")), onError: c.mutationError })}
                  onBulkDelete={(ids) => c.bulkDeleteInvoices.mutate(ids, { onSuccess: (result) => c.handleBulkResult(result, "finance.trash.deleted"), onError: c.mutationError })}
                  onBulkRestore={(ids) => c.bulkRestoreInvoices.mutate(ids, { onSuccess: (result) => c.handleBulkResult(result, "finance.trash.restored"), onError: c.mutationError })}
                  selectionResetKey={`${c.activeSubTab}:${c.showDeleted}`}
                  isColumnVisible={c.invoiceColumnLayout.isColumnVisible}
                  getColumnWidth={c.invoiceColumnLayout.getColumnWidth}
                  onColumnResize={c.invoiceColumnLayout.setColumnWidth}
                  columnCustomizer={{
                    columnRegistry: c.invoiceColumnLayout.columnRegistry,
                    updateUserColumnLayout: c.invoiceColumnLayout.updateUserColumnLayout,
                    labels: c.invoiceColumnLayout.customizerLabels,
                  }}
                />
              )}
              {c.activeTab === "work" && c.activeSubTab === "payments" && c.paymentsResult.queryResult.isError ? (
                <ErrorState
                  title={c.t("finance.loadFailed")}
                  description={c.t("finance.loadFailedHint")}
                  onRetry={() => void c.paymentsResult.queryResult.refetch()}
                />
              ) : c.activeTab === "work" && c.activeSubTab === "payments" && (
                <PaymentTracker
                  payments={c.payments}
                  canDelete={c.canDelete}
                  showDeleted={c.showDeleted}
                  onDelete={(id) => c.deletePayment.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.deleted")), onError: c.mutationError })}
                  onRestore={(id) => c.restorePayment.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.restored")), onError: c.mutationError })}
                  onBulkDelete={(ids) => c.bulkDeletePayments.mutate(ids, { onSuccess: (result) => c.handleBulkResult(result, "finance.trash.deleted"), onError: c.mutationError })}
                  onBulkRestore={(ids) => c.bulkRestorePayments.mutate(ids, { onSuccess: (result) => c.handleBulkResult(result, "finance.trash.restored"), onError: c.mutationError })}
                  selectionResetKey={`${c.activeSubTab}:${c.showDeleted}`}
                  isColumnVisible={c.paymentColumnLayout.isColumnVisible}
                  getColumnWidth={c.paymentColumnLayout.getColumnWidth}
                  onColumnResize={c.paymentColumnLayout.setColumnWidth}
                  columnCustomizer={{
                    columnRegistry: c.paymentColumnLayout.columnRegistry,
                    updateUserColumnLayout: c.paymentColumnLayout.updateUserColumnLayout,
                    labels: c.paymentColumnLayout.customizerLabels,
                  }}
                />
              )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {c.creatingInvoice && c.canWrite && !c.showDeleted && (
          <InvoiceForm
            open={c.creatingInvoice}
            saving={c.createInvoice.isPending}
            onClose={() => c.setCreatingInvoice(false)}
            onSave={c.handleCreateInvoice}
          />
        )}
        {c.viewInvoice && (
          <InvoiceDetail
            invoice={c.viewInvoice}
            onClose={() => c.setViewInvoice(null)}
            onRecord={(invoiceToRecord: Invoice) => { c.setViewInvoice(null); c.setRecordInvoice(invoiceToRecord); }}
            canWrite={c.canWrite}
          />
        )}
        {c.recordInvoice && c.canWrite && !c.showDeleted && (
          <PaymentForm open={!!c.recordInvoice} invoice={c.recordInvoice} onClose={() => c.setRecordInvoice(null)} onSave={c.handleRecordPayment} />
        )}
      </AnimatePresence>
    </ModulePageShell>
  );
}
