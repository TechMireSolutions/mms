import React from "react";
import { ReceiptText, User, Hash, School, Calendar, DollarSign, Tag } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/lib/utils";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { FeeStructure } from "@mms/shared";
import type { InvoiceDraft } from "@/tenant/features/finance/components/invoiceFormDraft";
import { InvoiceFormStudentPicker } from "@/tenant/features/finance/components/InvoiceFormStudentPicker";

export interface InvoiceFormFieldsSectionProps {
  t: TranslationFunction;
  draft: InvoiceDraft;
  onFieldChange: (key: keyof InvoiceDraft, value: string) => void;
  feeStructures?: FeeStructure[];
  onApplyFeeStructure?: (structureId: string) => void;
  errors?: Record<string, string>;
}

export const InvoiceFormFieldsSection = (function InvoiceFormFieldsSection({
  t,
  draft,
  onFieldChange,
  feeStructures = [],
  onApplyFeeStructure,
  errors = {},
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
          {feeStructures.length > 0 && (
            <div className="sm:col-span-2">
              <Field id="invoice-fee-structure" label={t("finance.form.feeStructure")}>
                <FormSelect
                  id="invoice-fee-structure"
                  name="feeStructureId"
                  value={draft.feeStructureId}
                  onChange={(value) => onApplyFeeStructure?.(value)}
                  options={[
                    { value: "", label: t("common.none") },
                    ...feeStructures.map((structure) => ({
                      value: structure.id,
                      label: structure.name,
                    })),
                  ]}
                />
              </Field>
            </div>
          )}

          <InvoiceFormStudentPicker
            t={t}
            studentId={draft.studentId}
            onPick={(id, name) => {
              onFieldChange("studentId", id);
              if (name) onFieldChange("studentName", name);
            }}
          />

          <Field
            id="invoice-student-name"
            label={t("finance.form.studentName")}
            required
            error={errors.studentName}
          >
            <div className="relative flex items-center group/input">
              <User className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="invoice-student-name"
                name="studentName"
                className={cn(`${FORM_INPUT} ps-10`, errors.studentName && FORM_INPUT_ERROR)}
                value={draft.studentName}
                onChange={(event) => onFieldChange("studentName", event.target.value)}
                required
                aria-invalid={Boolean(errors.studentName)}
              />
            </div>
          </Field>

          <Field
            id="invoice-student-id"
            label={t("finance.form.studentId")}
            required
            error={errors.studentId}
          >
            <div className="relative flex items-center group/input">
              <Hash className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="invoice-student-id"
                name="studentId"
                className={cn(`${FORM_INPUT} ps-10`, errors.studentId && FORM_INPUT_ERROR)}
                value={draft.studentId}
                onChange={(event) => onFieldChange("studentId", event.target.value)}
                required
                aria-invalid={Boolean(errors.studentId)}
              />
            </div>
          </Field>

          <Field
            id="invoice-class"
            label={t("finance.form.class")}
            required
            error={errors.class}
          >
            <div className="relative flex items-center group/input">
              <School className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="invoice-class"
                name="class"
                className={cn(`${FORM_INPUT} ps-10`, errors.class && FORM_INPUT_ERROR)}
                value={draft.class}
                onChange={(event) => onFieldChange("class", event.target.value)}
                required
                aria-invalid={Boolean(errors.class)}
              />
            </div>
          </Field>

          <Field
            id="invoice-session"
            label={t("finance.form.session")}
            required
            error={errors.session}
          >
            <div className="relative flex items-center group/input">
              <Calendar className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="invoice-session"
                name="session"
                className={cn(`${FORM_INPUT} ps-10`, errors.session && FORM_INPUT_ERROR)}
                value={draft.session}
                onChange={(event) => onFieldChange("session", event.target.value)}
                required
                aria-invalid={Boolean(errors.session)}
              />
            </div>
          </Field>

          <Field
            id="invoice-base-fee"
            label={t("finance.columns.baseFee")}
            required
            error={errors.baseFee}
          >
            <div className="relative flex items-center group/input">
              <DollarSign className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="invoice-base-fee"
                name="baseFee"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={cn(`${FORM_INPUT} ps-10`, errors.baseFee && FORM_INPUT_ERROR)}
                value={draft.baseFee}
                onChange={(event) => onFieldChange("baseFee", event.target.value)}
                required
                aria-invalid={Boolean(errors.baseFee)}
              />
            </div>
          </Field>

          <Field
            id="invoice-due-date"
            label={t("finance.columns.dueDate")}
            required
            error={errors.dueDate}
          >
            <DatePicker
              id="invoice-due-date"
              name="dueDate"
              value={draft.dueDate}
              onChange={(value) => onFieldChange("dueDate", value)}
              required
            />
          </Field>

          <Field
            id="invoice-discount-type"
            label={t("finance.form.discountType")}
          >
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
                { value: "staff", label: t("finance.discount.staff") },
              ]}
            />
          </Field>

          <Field
            id="invoice-discount-value"
            label={t("finance.form.discountAmount")}
            error={errors.discountValue}
          >
            <div className="relative flex items-center group/input">
              <Tag className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="invoice-discount-value"
                name="discountValue"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={cn(`${FORM_INPUT} ps-10`, errors.discountValue && FORM_INPUT_ERROR)}
                value={draft.discountValue}
                onChange={(event) => onFieldChange("discountValue", event.target.value)}
                aria-invalid={Boolean(errors.discountValue)}
              />
            </div>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
});
