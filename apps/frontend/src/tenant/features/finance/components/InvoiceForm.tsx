import React, { useEffect, useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { type InvoiceCreateInput, validateDfsCustomFields, type ValidationError } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useFinanceConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleTabs } from "@/hooks/useDynamicFormConfig";
import { NotifiedFinanceMutationError } from "@/tenant/features/finance/hooks/useFinanceApi";
import { InvoiceFormFieldsSection } from "@/tenant/features/finance/components/InvoiceFormFieldsSection";
import { InvoiceFormSummarySection } from "@/tenant/features/finance/components/InvoiceFormSummarySection";
import {
  canSaveInvoiceDraft,
  computeInvoiceAmounts,
  createInitialDraft,
  nextInvoiceId,
  type InvoiceDraft,
} from "@/tenant/features/finance/components/invoiceFormDraft";

interface InvoiceFormProps {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (invoice: InvoiceCreateInput) => void | Promise<void>;
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
  const { data: dfsTabs } = useModuleTabs("finance");

  const [draft, setDraft] = useState<InvoiceDraft>(() => createInitialDraft(settings.dueDays, dfsTabs));
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(createInitialDraft(settings.dueDays, dfsTabs));
      setValidationErrors([]);
    }
  }, [open, settings.dueDays, dfsTabs]);

  const { baseFee, discountValue, discountAmt, finalAmt } = computeInvoiceAmounts(draft.baseFee, draft.discountValue);
  const canSave = useMemo(() => canSaveInvoiceDraft(draft, baseFee), [baseFee, draft]);

  const setField = (key: keyof InvoiceDraft, value: string): void => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  };

  const handleCustomDataPatch = (patch: Partial<InvoiceDraft>): void => {
    setDraft((currentDraft) => ({ ...currentDraft, ...patch }));
  };

  const getFieldError = (fieldId: string): string | undefined => {
    return validationErrors.find((err) => err.fieldId === fieldId)?.message;
  };

  const resetAndClose = (): void => {
    setDraft(createInitialDraft(settings.dueDays, dfsTabs));
    setValidationErrors([]);
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!canSave) return;

    if (dfsTabs && dfsTabs.length > 0) {
      const dfsErrors = validateDfsCustomFields(dfsTabs, draft.customData, draft as unknown as Record<string, unknown>);
      if (dfsErrors.length > 0) {
        setValidationErrors(dfsErrors);
        notify.error(dfsErrors[0]?.message ?? t("finance.fixErrors"));
        return;
      }
    }

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
        customData: draft.customData ?? {},
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
      <div className="space-y-5 text-start">
        <InvoiceFormFieldsSection
          t={t}
          draft={draft}
          onFieldChange={setField}
          onCustomDataChange={handleCustomDataPatch}
          dfsTabs={dfsTabs}
          getFieldError={getFieldError}
        />
        <InvoiceFormSummarySection
          t={t}
          baseFee={baseFee}
          discountAmt={discountAmt}
          finalAmt={finalAmt}
          formatCurrency={formatCurrency}
        />
      </div>
    </FormModal>
  );
}
