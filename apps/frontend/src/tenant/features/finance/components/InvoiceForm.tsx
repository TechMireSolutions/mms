import React, { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { invoiceTotalsFromLines, type InvoiceCreateInput } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useFinanceConfig } from "@/hooks/useStandardModuleConfig";
import { NotifiedMutationError } from "@/lib/notifiedMutationError";
import { InvoiceFormFieldsSection } from "@/tenant/features/finance/components/InvoiceFormFieldsSection";
import { InvoiceFormSummarySection } from "@/tenant/features/finance/components/InvoiceFormSummarySection";
import {
  canSaveInvoiceDraft,
  computeInvoiceAmounts,
  createInitialDraft,
  nextInvoiceId,
  type InvoiceDraft,
} from "@/tenant/features/finance/components/invoiceFormDraft";
import { useFinanceFeeStructures } from "@/tenant/features/finance/hooks/useFinanceFeeStructures";

export interface InvoiceFormProps {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (invoice: InvoiceCreateInput) => void | Promise<void>;
}

export const InvoiceForm = (function InvoiceForm({
  open,
  saving = false,
  onClose,
  onSave,
}: InvoiceFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings } = useFinanceConfig();
  const { formatCurrency } = useFinanceCurrency();
  const { data: feeStructures = [] } = useFinanceFeeStructures(open);

      const [draft, setDraft] = useState<InvoiceDraft>(() => createInitialDraft(settings.dueDays));
      const [submitting, setSubmitting] = useState(false);

      useEffect(() => {
        if (open) {
          setDraft(createInitialDraft(settings.dueDays));
        }
      }, [open, settings.dueDays]);

      const { baseFee, discountValue, discountAmt, finalAmt } = computeInvoiceAmounts(draft.baseFee, draft.discountValue);
      const canSave = (() => canSaveInvoiceDraft(draft, baseFee))();

      const setField = (key: keyof InvoiceDraft, value: string): void => {
        setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
      };

      const applyFeeStructure = (structureId: string): void => {
        const structure = feeStructures.find((item) => item.id === structureId);
        const totals = structure
          ? invoiceTotalsFromLines(structure.items.map((item) => ({
              quantity: 1,
              amount: item.amount,
              discountAmt: 0,
            })))
          : null;
        setDraft((currentDraft) => ({
          ...currentDraft,
          feeStructureId: structureId,
          class: structure?.className || currentDraft.class,
          session: structure?.session || currentDraft.session,
          baseFee: totals ? String(totals.baseFee) : currentDraft.baseFee,
        }));
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
            feeStructureId: draft.feeStructureId || null,
            lines: (() => {
              const structure = feeStructures.find((item) => item.id === draft.feeStructureId);
              if (!structure || structure.items.length === 0) return undefined;
              return structure.items.map((item, index) => ({
                id: `il-${index + 1}`,
                feeItemId: item.id,
                description: item.name,
                quantity: 1,
                amount: item.amount,
                discountAmt: 0,
              }));
            })(),
          });
          notify.success(t("finance.invoiceSaved"));
          resetAndClose();
        } catch (error: unknown) {
          if (!(error instanceof NotifiedMutationError)) {
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
              feeStructures={feeStructures}
              onApplyFeeStructure={applyFeeStructure}
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
    });
