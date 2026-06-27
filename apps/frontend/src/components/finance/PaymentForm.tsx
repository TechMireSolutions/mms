import React, { useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { ReceiptText } from "lucide-react";
import { PAYMENT_METHODS, Invoice, Payment } from '@/lib/data/financeData';
import { MmsDynamicForm } from "@/components/ui/MmsDynamicForm";
import { useMmsForm } from "@/hooks/useMmsForm";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useFinanceConfig } from "@/hooks/useFinanceConfig";
import { DatePicker } from "../ui/DatePicker";
import { Input } from "../ui/input";
import { FORM_INPUT, FORM_SELECT } from "../ui/formStyles";
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
import { UserActorSelect } from "../ui/UserActorSelect";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type FieldDefinition,
  buildCustomFieldSchema,
  getDefaultFieldValue,
} from '@mms/shared';

const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

interface PaymentFormProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

interface PaymentFormData {
  amount: number;
  method: string;
  date: string;
  receivedByUserId: string;
  note: string;
  [key: string]: unknown;
}

export function PaymentForm({ open, invoice, onClose, onSave }: PaymentFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const balance = invoice ? invoice.finalAmt - (invoice.paidAmt || 0) : 0;
  const { fields, customFields, orderedFields } = useFinanceConfig();
  const [saving, setSaving] = useState(false);

  // Map configuration fields into FieldDefinitions
  const fieldsList = useMemo<FieldDefinition[]>(() => {
    return orderedFields.map((field, index) => {
      const isEnabled = fields[field.id]?.enabled !== false;
      return {
        key: field.id === "receivedBy" ? "receivedByUserId" : field.id,
        label: field.label,
        type: (field.type || "text") as any,
        required: !!field.required,
        enabled: isEnabled,
        order: index,
        placeholder: field.placeholder,
        options: field.options,
      };
    });
  }, [orderedFields, fields]);

  const fieldsByTab = useMemo<Record<string, FieldDefinition[]>>(() => {
    return {
      basic: fieldsList,
    };
  }, [fieldsList]);

  const initialValues = useMemo<PaymentFormData>(() => {
    const initial: any = {
      amount: balance,
      method: "Cash",
      date: new Date().toISOString().split("T")[0],
      receivedByUserId: authUser?.id || "",
      note: "",
    };

    fieldsList.forEach((field) => {
      if (!["amount", "method", "date", "receivedByUserId", "note"].includes(field.key)) {
        initial[field.key] = getDefaultFieldValue(field) ?? "";
      }
    });

    return initial as PaymentFormData;
  }, [balance, authUser, fieldsList]);

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {
      amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
      method: z.string().min(1, "Method is required."),
      date: z.string().min(1, "Date is required."),
      receivedByUserId: z.string().min(1, "Received By is required."),
      note: z.string().optional().nullable(),
    };

    // Override field required checks from config
    fieldsList.forEach((field) => {
      if (field.required && shape[field.key]) {
        shape[field.key] = (shape[field.key] as any).refine((val: any) => val !== undefined && val !== null && val !== "", {
          message: `${field.label} is required.`,
        });
      }

      // Dynamic custom fields validation
      if (!["amount", "method", "date", "receivedByUserId", "note"].includes(field.key)) {
        shape[field.key] = buildCustomFieldSchema(field);
      }
    });

    return z.object(shape).passthrough();
  }, [fieldsList]);

  const {
    form,
    tab,
    errors,
    handleSave,
  } = useMmsForm<PaymentFormData>({
    schema,
    fields: fieldsByTab,
    initialData: initialValues,
    t,
  });

  const data = form.watch();
  const setValue = form.setValue;

  const completeness = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    fieldsList.forEach((field) => {
      if (!field.enabled) return;
      
      // Skip booleans and ai_summary fields from completeness score
      if (field.type === "boolean" || field.type === "ai_summary") {
        return;
      }

      const isRequired = !!field.required;
      const val = data[field.key];
      const isFilled = val !== undefined && val !== null && val !== "";

      if (isRequired) {
        totalRequired++;
        if (isFilled) filledRequired++;
      } else {
        totalOptional++;
        if (isFilled) filledOptional++;
      }
    });

    const reqRatio = totalRequired === 0 ? 0 : filledRequired / totalRequired;
    const optRatio = totalOptional === 0 ? 0 : filledOptional / totalOptional;
    const progress = (reqRatio * 0.7) + (optRatio * 0.3);

    return Math.round(progress * 100);
  }, [data, fieldsList]);

  const onSubmit = useCallback(async (formData: PaymentFormData) => {
    if (!invoice) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave({
      ...formData,
      amount: Number(formData.amount),
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      receivedByUserId: formData.receivedByUserId || authUser?.id || '',
      id: `pay${Date.now()}`,
    } as unknown as Payment);
    setSaving(false);
    onClose();
  }, [invoice, authUser, onSave, onClose]);

  const renderFieldByKey = (field: FieldDefinition): React.ReactNode => {
    if (!field.enabled) return null;

    const fieldError = errors.find((e) => e.fieldId === field.key);

    if (field.key === "amount") {
      return (
        <div key="amount" className="sm:col-span-2">
          <Field label="Amount (PKR) *" required={field.required} error={fieldError?.message}>
            <input
              type="number"
              className={FORM_INPUT}
              value={data.amount || ""}
              onChange={(e) => setValue("amount", e.target.value === "" ? 0 : +e.target.value, { shouldValidate: true, shouldDirty: true })}
              max={balance}
              min={1}
              required
            />
            {Number(data.amount) < balance && Number(data.amount) > 0 && (
              <p className="m-0 mt-1 text-[10px] text-warning">
                Partial payment — balance remaining: {fmt(balance - Number(data.amount))}
              </p>
            )}
          </Field>
        </div>
      );
    }

    if (field.key === "method") {
      return (
        <div key="method">
          <Field label="Method *" required={field.required} error={fieldError?.message}>
            <select
              className={`${FORM_SELECT} cursor-pointer`}
              value={data.method || "Cash"}
              onChange={(e) => setValue("method", e.target.value, { shouldValidate: true, shouldDirty: true })}
              required={field.required}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
      );
    }

    if (field.key === "date") {
      return (
        <div key="date">
          <Field label="Date *" required={field.required} error={fieldError?.message}>
            <DatePicker
              value={data.date || ""}
              onChange={(val) => setValue("date", val, { shouldValidate: true, shouldDirty: true })}
              required={field.required}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "receivedByUserId") {
      return (
        <div key="receivedByUserId" className="sm:col-span-2">
          <UserActorSelect
            id="payment-receivedBy"
            label="Received By"
            required={field.required}
            value={data.receivedByUserId || ""}
            onChange={(id) => setValue("receivedByUserId", id, { shouldValidate: true, shouldDirty: true })}
          />
        </div>
      );
    }

    if (field.key === "note") {
      return (
        <div key="note" className="sm:col-span-2">
          <Field label="Note" required={field.required} error={fieldError?.message}>
            <Input
              className={FORM_INPUT}
              value={data.note || ""}
              onChange={(e) => setValue("note", e.target.value, { shouldValidate: true, shouldDirty: true })}
              placeholder="e.g. Cash received, receipt #123"
              required={field.required}
            />
          </Field>
        </div>
      );
    }

    // Default custom field rendering
    const value = data[field.key] ?? getDefaultFieldValue(field);
    return (
      <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
        <Field label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(next) => setValue(field.key as any, next, { shouldValidate: true, shouldDirty: true })}
            error={!!fieldError}
          />
        </Field>
      </div>
    );
  };

  const renderBasicContent = () => {
    return (
      <div className="space-y-5 text-left">
        {invoice && (
          <article className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-[14px] font-bold text-foreground m-0">{invoice.studentName}</h4>
            <p className="text-[11px] text-muted-foreground m-0 mt-0.5">{invoice.id} · {invoice.class}</p>
            <p className="text-[12px] font-semibold text-primary m-0 mt-2">Balance due: {fmt(balance)}</p>
          </article>
        )}

        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldsList.map((field) => renderFieldByKey(field))}
          </div>
        </section>
      </div>
    );
  };

  const footerStart = invoice ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground truncate max-w-[200px]">{invoice.studentName}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>Balance: {fmt(balance - Number(data.amount || 0))}</span>
      </div>
    </div>
  ) : null;

  return (
    <MmsDynamicForm
      open={open}
      onClose={onClose}
      title="Record Payment"
      icon={ReceiptText}
      progress={completeness}
      progressLabel="Progress"
      showBuilderToggle={false}
      isBuilderMode={false}
      builderPanel={null}
      tabs={[]}
      activeTab={tab}
      error={errors.map(e => e.message)}
      cancelLabel="Cancel"
      saveLabel="Record Payment"
      onSave={() => void handleSave(onSubmit)()}
      saving={saving}
      saveDisabled={!data.amount || Number(data.amount) <= 0}
      footerStart={footerStart || undefined}
      fields={fieldsList}
      data={data}
      setValue={(key, val, opts) => setValue(key as any, val, opts)}
      errors={errors}
      renderField={renderFieldByKey}
      renderBasicContent={renderBasicContent}
    />
  );
}
