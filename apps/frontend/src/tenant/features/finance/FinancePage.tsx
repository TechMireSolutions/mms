import React from "react";
import { useFinancePageController } from "@/tenant/features/finance/hooks/useFinancePageController";
import { AnimatePresence } from "framer-motion";
import { Plus, DollarSign, CalendarRange, Bell, AlarmClock } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ModuleEntityIoToolbar } from "@/components/ui/ModuleEntityIoToolbar";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { InvoicesList } from "@/tenant/features/finance/components/InvoicesList";
import { PaymentsList } from "@/tenant/features/finance/components/PaymentsList";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { type Invoice } from '@/lib/data/financeData';
import { FinanceCommandMetrics } from "@/tenant/features/finance/components/FinanceCommandMetrics";
import { notify } from "@/lib/notify";
import { FinanceOverlays } from "@/tenant/features/finance/components/FinanceOverlays";

const FinanceSetupTier = React.lazy(() =>
  import("@/tenant/features/finance/components/FinanceSetupTier").then((m) => ({
    default: m.FinanceSetupTier,
  }))
);
const FinanceReportsTier = React.lazy(() =>
  import("@/tenant/features/finance/components/FinanceReportsTier").then((m) => ({
    default: m.FinanceReportsTier,
  }))
);

/**
 * Finance — invoices and payments. Work | Reports | Setup.
 */
export default function Finance(): React.JSX.Element {
  const c = useFinancePageController();
  const [receiptInvoices, setReceiptInvoices] = React.useState<Invoice[]>([]);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${c.t("nav.finance")}`}
      seoDescription={c.t("page.finance.subtitle")}
      headerIcon={DollarSign}
      headerTitle={c.t("nav.finance")}
      headerSubtitle={c.t("page.finance.subtitle")}
      headerActions={
        c.canWrite && !c.showDeleted ? (
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              variant="secondary"
              icon={AlarmClock}
              loading={c.collectPending}
              onClick={() => void c.handleCollectOverdue()}
            >
              {c.t("finance.collect.action")}
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={Bell}
              loading={c.remindPending}
              onClick={() => void c.handleRemindInvoices()}
            >
              {c.t("finance.collect.remindAction")}
            </ActionButton>
            <ActionButton variant="secondary" icon={CalendarRange} onClick={() => c.setGeneratingInvoices(true)}>
              {c.t("finance.generate.action")}
            </ActionButton>
            <ActionButton variant="primary" icon={Plus} onClick={c.openCreateInvoice}>
              {c.t("finance.newInvoice")}
            </ActionButton>
          </div>
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
          <>
            <SubTabBar
              tabs={c.SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
              value={c.activeSubTab}
              onChange={c.setActiveSubTab}
            />
            {c.activeSubTab === "invoices" ? (
              <ModuleEntityIoToolbar
                canWrite={c.canWrite}
                viewingDeleted={c.showDeleted}
                onAdd={c.openCreateInvoice}
                addLabel={c.t("finance.newInvoice")}
                addIcon={Plus}
              />
            ) : null}
          </>
        )}

        <AnimatePresence mode="wait">
          <ModuleTierMotion tier={c.activeTab + "-" + c.activeSubTab} className="space-y-4">
            <ErrorBoundary>
              {c.activeTab === "reports" && (
                <React.Suspense fallback={<RouteStatusFallback />}>
                  <FinanceReportsTier />
                </React.Suspense>
              )}
              {c.activeTab === "setup" && (
                <React.Suspense fallback={<RouteStatusFallback />}>
                  <FinanceSetupTier />
                </React.Suspense>
              )}

              {c.activeTab === "work" && c.activeSubTab === "invoices" && c.invoicesResult.isError ? (
                <ErrorState
                  title={c.t("finance.loadFailed")}
                  description={c.t("finance.loadFailedHint")}
                  onRetry={() => void c.invoicesResult.refetch()}
                />
              ) : c.activeTab === "work" && c.activeSubTab === "invoices" && (
                <InvoicesList
                  invoices={c.invoices}
                  {...c.invoiceStatusFilter}
                  onView={c.setViewInvoice}
                  onRecord={c.setRecordInvoice}
                  canWrite={c.canWrite}
                  canDelete={c.canDelete}
                  canWriteMessaging={c.canWriteMessaging}
                  showDeleted={c.showDeleted}
                  onToggleDeleted={() => c.setShowDeleted((value) => !value)}
                  onDelete={(id) => c.deleteInvoice.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.deleted")), onError: c.mutationError })}
                  onRestore={(id) => c.restoreInvoice.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.restored")), onError: c.mutationError })}
                  onBulkDelete={(ids) => c.bulkDeleteInvoices.mutate(ids, { onSuccess: (result: unknown) => c.handleBulkResult(result as { succeeded: number; failed: number }, "finance.trash.deleted", "invoices"), onError: c.mutationError })}
                  onBulkRestore={(ids) => c.bulkRestoreInvoices.mutate(ids, { onSuccess: (result: unknown) => c.handleBulkResult(result as { succeeded: number; failed: number }, "finance.trash.restored", "invoices"), onError: c.mutationError })}
                  onBulkStatusChange={(ids, status) => void c.handleBulkStatusChange(ids, status)}
                  onBulkPrintReceipts={(inv) => setReceiptInvoices(inv)}
                  isBulkStatusPending={c.bulkUpdateInvoiceStatus.isPending}
                  selectedIds={c.invoiceSelection.selectedIds}
                  onToggleSelectedInvoice={c.invoiceSelection.toggleSelected}
                  onToggleSelectAll={c.invoiceSelection.toggleSelectAll}
                  onClearSelection={c.invoiceSelection.clearSelection}
                  isColumnVisible={c.invoiceColumnLayout.isColumnVisible}
                  getColumnWidth={c.invoiceColumnLayout.getColumnWidth}
                  onColumnResize={c.invoiceColumnLayout.setColumnWidth}
                  columnCustomizer={{
                    columnRegistry: c.invoiceColumnLayout.columnRegistry,
                    updateUserColumnLayout: c.invoiceColumnLayout.updateUserColumnLayout,
                    onResetLayout: c.invoiceColumnLayout.resetColumnLayout,
                    labels: c.invoiceColumnLayout.customizerLabels,
                  }}
                />
              )}
              {c.activeTab === "work" && c.activeSubTab === "payments" && c.paymentsResult.isError ? (
                <ErrorState
                  title={c.t("finance.loadFailed")}
                  description={c.t("finance.loadFailedHint")}
                  onRetry={() => void c.paymentsResult.refetch()}
                />
              ) : c.activeTab === "work" && c.activeSubTab === "payments" && (
                <PaymentsList
                  payments={c.payments}
                  canDelete={c.canDelete}
                  showDeleted={c.showDeleted}
                  onDelete={(id) => c.deletePayment.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.deleted")), onError: c.mutationError })}
                  onRestore={(id) => c.restorePayment.mutate(id, { onSuccess: () => notify.success(c.t("finance.trash.restored")), onError: c.mutationError })}
                  onBulkDelete={(ids) => c.bulkDeletePayments.mutate(ids, { onSuccess: (result: unknown) => c.handleBulkResult(result as { succeeded: number; failed: number }, "finance.trash.deleted", "payments"), onError: c.mutationError })}
                  onBulkRestore={(ids) => c.bulkRestorePayments.mutate(ids, { onSuccess: (result: unknown) => c.handleBulkResult(result as { succeeded: number; failed: number }, "finance.trash.restored", "payments"), onError: c.mutationError })}
                  selectedIds={c.paymentSelection.selectedIds}
                  onTogglePayment={c.paymentSelection.toggleSelected}
                  onToggleSelectAll={c.paymentSelection.toggleSelectAll}
                  onClearSelection={c.paymentSelection.clearSelection}
                  isColumnVisible={c.paymentColumnLayout.isColumnVisible}
                  getColumnWidth={c.paymentColumnLayout.getColumnWidth}
                  onColumnResize={c.paymentColumnLayout.setColumnWidth}
                  columnCustomizer={{
                    columnRegistry: c.paymentColumnLayout.columnRegistry,
                    updateUserColumnLayout: c.paymentColumnLayout.updateUserColumnLayout,
                    onResetLayout: c.paymentColumnLayout.resetColumnLayout,
                    labels: c.paymentColumnLayout.customizerLabels,
                  }}
                  onRowClick={(id: string) => {
                    const p = c.payments.find((x) => x.id === id);
                    if (p) c.setActivePayment(p);
                  }}
                />
              )}
            </ErrorBoundary>
          </ModuleTierMotion>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <FinanceOverlays
        c={c}
        receiptInvoices={receiptInvoices}
        onCloseReceipts={() => setReceiptInvoices([])}
        onSetReceiptInvoices={setReceiptInvoices}
      />
    </ModulePageShell>
  );
}
