import React from "react";
import { ReceiptText, User, Hash, School, Calendar, DollarSign, Tag } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ModuleCustomFieldsBlock } from "@/components/ui/ModuleCustomFieldsBlock";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { InvoiceDraft } from "@/tenant/features/finance/components/invoiceFormDraft";
import type { TabConfig } from "@mms/shared";

interface InvoiceFormFieldsSectionProps {
  t: TranslationFunction;
  draft: InvoiceDraft;
  onFieldChange: (key: keyof InvoiceDraft, value: string) => void;
  onCustomDataChange?: (patch: Partial<InvoiceDraft>) => void;
  dfsTabs?: TabConfig[];
  getFieldError?: (fieldId: string) => string | undefined;
}

export function InvoiceFormFieldsSection({
  t,
  draft,
  onFieldChange,
  onCustomDataChange,
  dfsTabs,
  getFieldError,
}: InvoiceFormFieldsSectionProps): React.ReactElement {
  const basicDfsTab = dfsTabs?.find((tab) => tab.key === "basic" || tab.id === "basic");
  const extraDfsTabs = dfsTabs?.filter((tab) => tab.enabled && tab.key !== "basic" && tab.id !== "basic");

  return (
    <div className="space-y-4">
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
                type="number"
                min="0"
                step="0.01"
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
                type="number"
                min="0"
                step="0.01"
                className={`${FORM_INPUT} ps-10`}
                value={draft.discountValue}
                onChange={(event) => onFieldChange("discountValue", event.target.value)}
              />
            </div>
          </div>
        </div>

        {basicDfsTab?.fields && basicDfsTab.fields.length > 0 && onCustomDataChange && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <ModuleCustomFieldsBlock<InvoiceDraft>
              draft={draft}
              formInstanceId="invoice-new"
              fields={{}}
              customFields={basicDfsTab.fields}
              tabId="basic"
              getFieldError={getFieldError ?? (() => undefined)}
              updateDraft={onCustomDataChange}
              hideWhenEmpty
              listCustomFields={() => []}
              idPrefix="inv-cf"
              emptyKey="common.none"
            />
          </div>
        )}
      </Card>

      {extraDfsTabs && extraDfsTabs.length > 0 && onCustomDataChange && (
        <>
          {extraDfsTabs.map((tab) => (
            <Card key={tab.id} accentColor="primary" className="p-5.5 px-6.5 pb-6 shadow-sm">
              <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
                <ReceiptText className="w-4 h-4 text-primary/70" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{tab.label}</h3>
              </div>
              <ModuleCustomFieldsBlock<InvoiceDraft>
                draft={draft}
                formInstanceId="invoice-new"
                fields={{}}
                customFields={tab.fields}
                tabId={tab.key || tab.id}
                getFieldError={getFieldError ?? (() => undefined)}
                updateDraft={onCustomDataChange}
                hideWhenEmpty
                listCustomFields={() => []}
                idPrefix="inv-cf"
                emptyKey="common.none"
              />
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
