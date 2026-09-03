import React from "react";
import { ReceiptText, User, Hash, School, Calendar, DollarSign, Tag } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { InvoiceDraft } from "@/tenant/features/finance/components/invoiceFormDraft";

export interface InvoiceFormFieldsSectionProps {
  t: TranslationFunction;
  draft: InvoiceDraft;
  onFieldChange: (key: keyof InvoiceDraft, value: string) => void;
}

export const InvoiceFormFieldsSection = (function InvoiceFormFieldsSection({
  t,
  draft,
  onFieldChange,
}: InvoiceFormFieldsSectionProps): React.JSX.Element {

      return (
        <div className="space-y-4">
          <SectionCard
            accentColor="primary"
            icon={ReceiptText}
            title={t("finance.form.information")}
            className="shadow-sm"
          >

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={FORM_LABEL} htmlFor="invoice-student-name">
                  {t("finance.form.studentName")}
                </label>
                <div className="relative flex items-center group/input">
                  <User className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="invoice-student-name"
                    name="studentName"
                    className={`${FORM_INPUT} ps-10`}
                    value={draft.studentName}
                    onChange={(event) => onFieldChange("studentName", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor="invoice-student-id">
                  {t("finance.form.studentId")}
                </label>
                <div className="relative flex items-center group/input">
                  <Hash className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="invoice-student-id"
                    name="studentId"
                    className={`${FORM_INPUT} ps-10`}
                    value={draft.studentId}
                    onChange={(event) => onFieldChange("studentId", event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor="invoice-class">
                  {t("finance.form.class")}
                </label>
                <div className="relative flex items-center group/input">
                  <School className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="invoice-class"
                    name="class"
                    className={`${FORM_INPUT} ps-10`}
                    value={draft.class}
                    onChange={(event) => onFieldChange("class", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor="invoice-session">
                  {t("finance.form.session")}
                </label>
                <div className="relative flex items-center group/input">
                  <Calendar className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="invoice-session"
                    name="session"
                    className={`${FORM_INPUT} ps-10`}
                    value={draft.session}
                    onChange={(event) => onFieldChange("session", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor="invoice-base-fee">
                  {t("finance.columns.baseFee")}
                </label>
                <div className="relative flex items-center group/input">
                  <DollarSign className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="invoice-base-fee"
                    name="baseFee"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`${FORM_INPUT} ps-10`}
                    value={draft.baseFee}
                    onChange={(event) => onFieldChange("baseFee", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor="invoice-due-date">
                  {t("finance.columns.dueDate")}
                </label>
                <DatePicker
                  id="invoice-due-date"
                  name="dueDate"
                  value={draft.dueDate}
                  onChange={(value) => onFieldChange("dueDate", value)}
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
                  onChange={(value) => onFieldChange("discountType", value)}
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
                  <Tag className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="invoice-discount-value"
                    name="discountValue"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`${FORM_INPUT} ps-10`}
                    value={draft.discountValue}
                    onChange={(event) => onFieldChange("discountValue", event.target.value)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      );
    });
