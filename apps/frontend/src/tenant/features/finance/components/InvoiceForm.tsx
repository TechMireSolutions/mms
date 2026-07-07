import React, { useMemo, useState } from "react";
import { ReceiptText, User, Hash, School, Calendar, DollarSign, Tag } from "lucide-react";
import type { Invoice } from "@/lib/data/financeData";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { formatMoney } from "@mms/shared";

interface InvoiceFormProps {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
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

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function nextInvoiceId(): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `INV-${stamp}`;
}

const INITIAL_DRAFT: InvoiceDraft = {
  studentId: "",
  studentName: "",
  class: "",
  session: "",
  baseFee: "",
  discountType: "",
  discountValue: "0",
  dueDate: todayIso(),
};

export function InvoiceForm({
  open,
  saving = false,
  onClose,
  onSave,
}: InvoiceFormProps): React.ReactElement {
  const [draft, setDraft] = useState<InvoiceDraft>(INITIAL_DRAFT);

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
    setDraft(INITIAL_DRAFT);
    onClose();
  };

  const handleSubmit = (): void => {
    if (!canSave) return;
    onSave({
      id: nextInvoiceId(),
      studentId: draft.studentId.trim() || draft.studentName.trim().toLowerCase().replace(/\s+/g, "-"),
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
    setDraft(INITIAL_DRAFT);
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="New Invoice"
      subtitle="Create a student fee invoice"
      icon={ReceiptText}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={resetAndClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSave || saving}>
            {saving ? "Saving..." : "Create Invoice"}
          </Button>
        </>
      }
    >
      <div className="space-y-5 text-left">
        <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
            <ReceiptText className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Invoice Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-student-name">
                Student name
              </label>
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-student-name"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.studentName}
                  onChange={(event) => setField("studentName", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-student-id">
                Student ID
              </label>
              <div className="relative flex items-center group/input">
                <Hash className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-student-id"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.studentId}
                  onChange={(event) => setField("studentId", event.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-class">
                Class
              </label>
              <div className="relative flex items-center group/input">
                <School className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-class"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.class}
                  onChange={(event) => setField("class", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-session">
                Session
              </label>
              <div className="relative flex items-center group/input">
                <Calendar className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-session"
                  className={`${FORM_INPUT} pl-10`}
                  value={draft.session}
                  onChange={(event) => setField("session", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-base-fee">
                Base fee
              </label>
              <div className="relative flex items-center group/input">
                <DollarSign className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-base-fee"
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
                Due date
              </label>
              <DatePicker
                value={draft.dueDate}
                onChange={(value) => setField("dueDate", value)}
                required
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-discount-type">
                Discount type
              </label>
              <FormSelect
                id="invoice-discount-type"
                name="discountType"
                value={draft.discountType}
                onChange={(value) => setField("discountType", value)}
                options={[
                  { value: "", label: "None" },
                  { value: "manual", label: "Manual" },
                  { value: "sibling", label: "Sibling" },
                  { value: "scholarship", label: "Scholarship" },
                  { value: "staff", label: "Staff" }
                ]}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="invoice-discount-value">
                Discount amount
              </label>
              <div className="relative flex items-center group/input">
                <Tag className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="invoice-discount-value"
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
        </section>

        <section className="relative overflow-hidden group rounded-2xl border border-border/85 bg-card/45 backdrop-blur-sm p-5 px-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase text-muted-foreground">Base Fee</p>
              <p className="m-0 mt-0.5 font-bold text-foreground text-sm">{formatMoney(baseFee)}</p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase text-muted-foreground">Discount</p>
              <p className="m-0 mt-0.5 font-bold text-warning text-sm">-{formatMoney(discountAmt)}</p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase text-muted-foreground">Final Amount</p>
              <p className="m-0 mt-0.5 font-extrabold text-primary text-sm">{formatMoney(finalAmt)}</p>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
