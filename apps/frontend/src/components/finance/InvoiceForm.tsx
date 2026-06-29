import React, { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import type { Invoice } from "@/lib/data/financeData";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_LABEL, FORM_SELECT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";

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

function formatMoney(amount: number): string {
  return `PKR ${Number(amount).toLocaleString()}`;
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
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FORM_LABEL} htmlFor="invoice-student-name">
              Student name
            </label>
            <Input
              id="invoice-student-name"
              className={FORM_INPUT}
              value={draft.studentName}
              onChange={(event) => setField("studentName", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="invoice-student-id">
              Student ID
            </label>
            <Input
              id="invoice-student-id"
              className={FORM_INPUT}
              value={draft.studentId}
              onChange={(event) => setField("studentId", event.target.value)}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="invoice-class">
              Class
            </label>
            <Input
              id="invoice-class"
              className={FORM_INPUT}
              value={draft.class}
              onChange={(event) => setField("class", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="invoice-session">
              Session
            </label>
            <Input
              id="invoice-session"
              className={FORM_INPUT}
              value={draft.session}
              onChange={(event) => setField("session", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="invoice-base-fee">
              Base fee
            </label>
            <Input
              id="invoice-base-fee"
              type="number"
              min="0"
              step="0.01"
              className={FORM_INPUT}
              value={draft.baseFee}
              onChange={(event) => setField("baseFee", event.target.value)}
              required
            />
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
            <select
              id="invoice-discount-type"
              className={FORM_SELECT}
              value={draft.discountType}
              onChange={(event) => setField("discountType", event.target.value)}
            >
              <option value="">None</option>
              <option value="manual">Manual</option>
              <option value="sibling">Sibling</option>
              <option value="scholarship">Scholarship</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="invoice-discount-value">
              Discount amount
            </label>
            <Input
              id="invoice-discount-value"
              type="number"
              min="0"
              step="0.01"
              className={FORM_INPUT}
              value={draft.discountValue}
              onChange={(event) => setField("discountValue", event.target.value)}
            />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase text-muted-foreground">Base</p>
              <p className="m-0 font-bold text-foreground">{formatMoney(baseFee)}</p>
            </div>
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase text-muted-foreground">Discount</p>
              <p className="m-0 font-bold text-warning">-{formatMoney(discountAmt)}</p>
            </div>
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase text-muted-foreground">Final</p>
              <p className="m-0 font-bold text-primary">{formatMoney(finalAmt)}</p>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
