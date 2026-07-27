import React, { useMemo, useState } from "react";
import { ReceiptText, User, Hash, School, Calendar, DollarSign, Tag } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { FormModal } from "@/components/ui/FormModal";
import { Card } from "@/components/ui/card";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { todayISO, type InvoiceCreateInput } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useFinanceConfig } from "@/hooks/useStandardModuleConfig";
import { NotifiedFinanceMutationError } from "@/tenant/features/finance/hooks/useFinanceApi";

interface InvoiceFormProps {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (invoice: InvoiceCreateInput) => void | Promise<void>;
}

interface InvoiceDraft {
  studentId: string;
  studentName: string;
  class: string;
  session: string;
  baseFee: string;
  discountType: string;
  discountValue: string;
  dueDate: string;
}

function nextInvoiceId(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${prefix}-${stamp}`;
}

function createInitialDraft(dueDays: string): InvoiceDraft {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Math.max(0, Number.parseInt(dueDays, 10) || 0));
  return {
  studentId: "",
  studentName: "",
  class: "",
  session: "",
  baseFee: "",
  discountType: "",
  discountValue: "0",
    dueDate: dueDate.toISOString().slice(0, 10) || todayISO(),
  };
}

export function InvoiceForm({
  open,
  saving = false,
  onClose,
  onSave,
}: InvoiceFormProps): React.ReactElement {
  const { t } = useTranslation();
  const { settings } = useFinanceConfig();
  const { formatCurrency } = useFinanceCurrency();
  const [draft, setDraft] = useState<InvoiceDraft>(() => createInitialDraft(settings.dueDays));
  const [submitting, setSubmitting] = useState(false);

  const baseFee = Number(draft.baseFee || 0);
  const discountValue = Number(draft.discountValue || 0);
  const discountAmt = Math.min(Math.max(discountValue, 0), Math.max(baseFee, 0));
  const finalAmt = Math.max(baseFee - discountAmt, 0);

  const canSave = useMemo(
    () =>
      draft.studentName.trim().length > 0 &&
      draft.class.trim().length > 0 &&
      draft.session.trim().length > 0 &&
      draft.dueDate.trim().length > 0 &&
      baseFee > 0,
    [baseFee, draft],
  );

  const setField = (key: keyof InvoiceDraft, value: string): void => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  };

  const resetAndClose = (): void => {
    setDraft(createInitialDraft(settings.dueDays));
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await onSave({
      id: nextInvoiceId(settings.invoicePrefix.trim() || "INV"),
      studentId: draft.studentId.trim(),
      studentName: draft.studentName.trim(),
      class: draft.class.trim(),
      session: draft.session.trim(),
      baseFee,
      discountType: draft.discountType.trim() || null,
      discountValue,
      discountAmt,
      finalAmt,
      status: "pending",
      dueDate: draft.dueDate,
      paidDate: null,
      method: null,
      paidAmt: 0,
      });
      notify.success(t("finance.invoiceSaved"));
      resetAndClose();
    } catch (error: unknown) {
      if (!(error instanceof NotifiedFinanceMutationError)) {
        notify.error(t("finance.invoiceSaveFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={resetAndClose}
      title={t("finance.newInvoice")}
      subtitle={t("finance.form.subtitle")}
      icon={ReceiptText}
      cancelLabel={t("common.cancel")}
      saveLabel={t("finance.form.create")}
      onSave={handleSubmit}
      saving={saving || submitting}
      saveDisabled={!canSave}
    >
      <div className="space-y-5 text-left">
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
            <ReceiptText className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("finance.form.information")}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-student-name">
                {t("finance.form.studentName")}
              </label>
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-student-name"
                  name="studentName"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.studentName}
                  onChange={(event) => setField("studentName", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-student-id">
                {t("finance.form.studentId")}
              </label>
              <div className="relative flex items-center group/input">
                <Hash className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-student-id"
                  name="studentId"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.studentId}
                  onChange={(event) => setField("studentId", event.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-class">
                {t("finance.form.class")}
              </label>
              <div className="relative flex items-center group/input">
                <School className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-class"
                  name="class"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.class}
                  onChange={(event) => setField("class", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-session">
                {t("finance.form.session")}
              </label>
              <div className="relative flex items-center group/input">
                <Calendar className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-session"
                  name="session"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.session}
                  onChange={(event) => setField("session", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-base-fee">
                {t("finance.columns.baseFee")}
              </label>
              <div className="relative flex items-center group/input">
                <DollarSign className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-base-fee"
                  name="baseFee"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.baseFee}
                  onChange={(event) => setField("baseFee", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-due-date">
                {t("finance.columns.dueDate")}
              </label>
              <DatePicker
                value={draft.dueDate}
                onChange={(value) => setField("dueDate", value)}
                required
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-discount-type">
                {t("finance.form.discountType")}
              </label>
              <FormSelect
                id="invoice-discount-type"
                name="discountType"
                value={draft.discountType}
                onChange={(value) => setField("discountType", value)}
                options={[
                  { value: "", label: t("common.none") },
                  { value: "manual", label: t("finance.discount.manual") },
                  { value: "sibling", label: t("finance.discount.sibling") },
                  { value: "scholarship", label: t("finance.discount.scholarship") },
                  { value: "staff", label: t("finance.discount.staff") }
                ]}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-discount-value">
                {t("finance.form.discountAmount")}
              </label>
              <div className="relative flex items-center group/input">
                <Tag className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-discount-value"
                  name="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.discountValue}
                  onChange={(event) => setField("discountValue", event.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card accentColor="primary" className="p-5 px-6 shadow-sm">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase text-muted-foreground">{t("finance.columns.baseFee")}</p>
              <p className="m-0 mt-0.5 font-bold text-foreground text-sm">{formatCurrency(baseFee)}</p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase text-muted-foreground">{t("finance.columns.discount")}</p>
              <p className="m-0 mt-0.5 font-bold text-warning text-sm">-{formatCurrency(discountAmt)}</p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase text-muted-foreground">{t("finance.form.finalAmount")}</p>
              <p className="m-0 mt-0.5 font-extrabold text-primary text-sm">{formatCurrency(finalAmt)}</p>
            </div>
          </div>
        </Card>
      </div>
    </FormModal>
  );
}
