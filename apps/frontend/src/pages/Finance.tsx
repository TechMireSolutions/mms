import React, { useMemo, useState } from "react";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import useConfigSubTabs from "@/hooks/useConfigSubTabs";
import useTranslation from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptText, CreditCard, Plus, DollarSign } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ActionButton from "../components/ui/ActionButton";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import InvoiceList from "../components/finance/InvoiceList";
import InvoiceDetail from "../components/finance/InvoiceDetail";
import PaymentForm from "../components/finance/PaymentForm";
import PaymentTracker from "../components/finance/PaymentTracker";
import FinanceSettings from "../components/finance/FinanceSettings";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { INVOICES, PAYMENTS, Invoice, Payment } from "../lib/financeData";
import { saveCollection } from "../lib/db";
import { useLiveCollection } from "../hooks/useLiveCollection";

/**
 * Finance page component for tracking and managing invoices and payments.
 * 
 * @returns {React.ReactElement} The Finance page component.
 */
export default function Finance() {
  const PAGE_TABS = useModuleTierTabs();
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => [
      { id: "invoices", label: t("finance.invoices"), icon: ReceiptText },
      { id: "payments", label: t("finance.payments"), icon: CreditCard },
    ],
    [t]
  );
  const [activeTab, setActiveTab] = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("invoices");
  const [subTab, setSubTab] = useState("fields");
  const invoices = useLiveCollection("finance_invoices");
  const payments = useLiveCollection("finance_payments");
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null);

  const handleRecordPayment = (paymentData: Payment) => {
    saveCollection("finance_payments", [...payments, paymentData]);
    saveCollection("finance_invoices", invoices.map((inv) => {
      if (inv.id !== paymentData.invoiceId) return inv;
      const newPaid = (inv.paidAmt || 0) + paymentData.amount;
      return { ...inv, status: newPaid >= inv.finalAmt ? "paid" : "partial", paidAmt: newPaid, paidDate: paymentData.date, method: paymentData.method };
    }));
    setRecordInvoice(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Finance Portal</title>
      <meta name="description" content="Manage student invoices, track payments, and review financial collections and reports." />
      <PageHeader
        icon={DollarSign}
        title={t("nav.finance")}
        subtitle={t("page.finance.subtitle")}
        actions={
          <ActionButton variant="primary" icon={Plus}>{t("finance.newInvoice")}</ActionButton>
        }
      />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="finance-tab"
      >
        {activeTab === "operations" && (
          <SubTabBar
            tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={activeSubTab}
            onChange={setActiveSubTab}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab + "-" + activeSubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
            <ErrorBoundary>
            {activeTab === "analytics" && (
              <div className="space-y-4">
                <KPISummary category="financial" />
                <ModuleReports category="financial" />
              </div>
            )}
            {activeTab === "configuration" && (
              <div className="space-y-4">
                <SubTabBar
                  tabs={configSubTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
                  value={subTab}
                  onChange={setSubTab}
                />
                <FinanceSettings mode={subTab as "fields" | "preferences"} />
              </div>
            )}

            {activeTab === "operations" && activeSubTab === "invoices" && <InvoiceList invoices={invoices} onView={setViewInvoice} onRecord={setRecordInvoice} />}
            {activeTab === "operations" && activeSubTab === "payments" && <PaymentTracker payments={payments} />}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {viewInvoice && (
          <InvoiceDetail invoice={viewInvoice} onClose={() => setViewInvoice(null)} onRecord={(inv: Invoice) => { setViewInvoice(null); setRecordInvoice(inv); }} />
        )}
        {recordInvoice && (
          <PaymentForm invoice={recordInvoice} onClose={() => setRecordInvoice(null)} onSave={handleRecordPayment} />
        )}
      </AnimatePresence>
    </div>
  );
}