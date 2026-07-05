import React, { useMemo, useState } from "react";
import { useModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptText, CreditCard, Plus, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { InvoiceList } from "@/tenant/features/finance/components/InvoiceList";
import { InvoiceDetail } from "@/tenant/features/finance/components/InvoiceDetail";
import { InvoiceForm } from "@/tenant/features/finance/components/InvoiceForm";
import { PaymentForm } from "@/tenant/features/finance/components/PaymentForm";
import { PaymentTracker } from "@/tenant/features/finance/components/PaymentTracker";
import { FinanceSettings } from "@/tenant/features/finance/components/FinanceSettings";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Invoice, Payment } from '@/lib/data/financeData';
import {
  useFinanceInvoicesCollection,
  useFinancePaymentsCollection,
  useFinanceMutations,
} from "@/tenant/features/finance/hooks/useFinanceApi";
import { useFinanceInvoiceColumnLayout } from "@/tenant/features/finance/hooks/useFinanceInvoiceColumnLayout";
import { useFinancePaymentColumnLayout } from "@/tenant/features/finance/hooks/useFinancePaymentColumnLayout";
import { FinanceCommandMetrics } from "@/tenant/features/finance/components/FinanceCommandMetrics";

/**
 * Finance — invoices and payments. Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Finance page component.
 */
export default function Finance() {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => [
      { id: "invoices", label: t("finance.invoices"), icon: ReceiptText },
      { id: "payments", label: t("finance.payments"), icon: CreditCard },
    ],
    [t]
  );
  const [activeTab, setActiveTab] = useState("work");
  const [activeSubTab, setActiveSubTab] = useState("invoices");
  const invoices = useFinanceInvoicesCollection();
  const payments = useFinancePaymentsCollection();
  const { createInvoice, createPayment } = useFinanceMutations();
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const invoiceColumnLayout = useFinanceInvoiceColumnLayout();
  const paymentColumnLayout = useFinancePaymentColumnLayout();

  const handleRecordPayment = (paymentToRecord: Payment) => {
    createPayment.mutate(paymentToRecord, {
      onSuccess: () => {
        setRecordInvoice(null);
      },
    });
  };

  const handleCreateInvoice = (invoiceToCreate: Invoice) => {
    createInvoice.mutate(invoiceToCreate, {
      onSuccess: () => {
        setCreatingInvoice(false);
        setActiveTab("work");
        setActiveSubTab("invoices");
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - {t("nav.finance")}</title>
      <meta name="description" content={t("page.finance.subtitle")} />
      <PageHeader
        icon={DollarSign}
        title={t("nav.finance")}
        subtitle={t("page.finance.subtitle")}
        actions={
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
        }
      />

      <FinanceCommandMetrics invoiceTotal={invoices.length} />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="finance-tab"
      >
        {activeTab === "work" && (
          <SubTabBar
            tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={activeSubTab}
            onChange={setActiveSubTab}
          />
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
              <FinanceSettings mode="preferences" />
            )}

            {activeTab === "work" && activeSubTab === "invoices" && (
              <InvoiceList
                invoices={invoices}
                onView={setViewInvoice}
                onRecord={setRecordInvoice}
                isColumnVisible={invoiceColumnLayout.isColumnVisible}
                columnCustomizer={{
                  columnRegistry: invoiceColumnLayout.columnRegistry,
                  updateUserColumnLayout: invoiceColumnLayout.updateUserColumnLayout,
                  labels: invoiceColumnLayout.customizerLabels,
                }}
              />
            )}
            {activeTab === "work" && activeSubTab === "payments" && (
              <PaymentTracker
                payments={payments}
                isColumnVisible={paymentColumnLayout.isColumnVisible}
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
        {creatingInvoice && (
          <InvoiceForm
            open={creatingInvoice}
            saving={createInvoice.isPending}
            onClose={() => setCreatingInvoice(false)}
            onSave={handleCreateInvoice}
          />
        )}
        {viewInvoice && (
          <InvoiceDetail invoice={viewInvoice} onClose={() => setViewInvoice(null)} onRecord={(invoiceToRecord: Invoice) => { setViewInvoice(null); setRecordInvoice(invoiceToRecord); }} />
        )}
        {recordInvoice && (
          <PaymentForm open={!!recordInvoice} invoice={recordInvoice} onClose={() => setRecordInvoice(null)} onSave={handleRecordPayment} />
        )}
      </AnimatePresence>
    </div>
  );
}
