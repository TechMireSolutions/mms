import React, { useState, useEffect } from "react";
import { Receipt } from "lucide-react";
import {
  generateReceiptNo,
  ObligationCollection, ObligationType, WakalaType, MujtahidRep, Mujtahid
} from "@/lib/data/obligationsData";
import { todayISO, type AppTranslationKey } from "@mms/shared";
import { useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { calculateKeyedUnitsCompleteness } from "@/lib/formCompleteness";
import {
  ObligationCollectionFormFields,
  type ObligationCollectionFormState,
} from "@/tenant/features/obligations/components/ObligationCollectionFormFields";

const EMPTY: ObligationCollectionFormState = {
  receipt_no: "",
  received_date: todayISO(),
  sender_id: "",
  reference_id: "",
  amount: "",
  currency_id: "cur1",
  payment_mode: "Cash",
  obligation_type_id: "",
  mujtahid_representative_id: "",
  received_by: "",
};

export interface ObligationCollectionFormProps {
  onClose: () => void;
  onSave: (collection: ObligationCollection) => void | Promise<void>;
  obligationTypes: ObligationType[];
  wakalaTypes: WakalaType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  existingCollections: ObligationCollection[];
}

export function ObligationCollectionForm({ onClose, onSave, obligationTypes, wakalaTypes, reps, mujtahids, existingCollections }: ObligationCollectionFormProps) {
  const { t } = useTranslation();
  const users = useMergedObligationUsers();

  const [form, setForm] = useState<ObligationCollectionFormState>({ ...EMPTY, receipt_no: generateReceiptNo(existingCollections) });
  const [errors, setErrors] = useState<Partial<Record<keyof ObligationCollectionFormState, AppTranslationKey>>>({});
  const [submitting, setSubmitting] = useState(false);

  const completeness = (() =>
      calculateKeyedUnitsCompleteness(form as unknown as Record<string, unknown>, [
        { key: "received_date" },
        { key: "sender_id" },
        { key: "amount" },
        { key: "payment_mode" },
        { key: "obligation_type_id" },
        { key: "mujtahid_representative_id" },
        { key: "received_by" },
      ]))();

  const eligibleRepIds = wakalaTypes
    .filter((wakalaType) => wakalaType.obligation_type_id === form.obligation_type_id)
    .map((wakalaType) => wakalaType.mujtahid_representative_id);

  const eligibleReps = form.obligation_type_id
    ? reps.filter((rep) => eligibleRepIds.includes(rep.id))
    : reps;

  useEffect(() => {
    if (form.obligation_type_id) {
      setForm((currentForm) => ({ ...currentForm, mujtahid_representative_id: "" }));
    }
  }, [form.obligation_type_id]);

  const getMujtahid = (repId: string) => {
    const rep = reps.find((candidateRep) => candidateRep.id === repId);
    return rep ? mujtahids.find((mujtahid) => mujtahid.id === rep.mujtahid_id) : null;
  };

  const validate = (): Partial<Record<keyof ObligationCollectionFormState, AppTranslationKey>> => {
    const nextErrors: Partial<Record<keyof ObligationCollectionFormState, AppTranslationKey>> = {};
    if (!form.sender_id) nextErrors.sender_id = "obligations.form.errors.senderRequired";
    if (!form.amount || parseFloat(form.amount) <= 0) nextErrors.amount = "obligations.form.errors.amountRequired";
    if (!form.received_date) nextErrors.received_date = "obligations.form.errors.dateRequired";
    if (!form.obligation_type_id) nextErrors.obligation_type_id = "obligations.form.errors.typeRequired";
    if (!form.mujtahid_representative_id) nextErrors.mujtahid_representative_id = "obligations.form.errors.repRequired";
    if (!form.received_by) nextErrors.received_by = "obligations.form.errors.receivedByRequired";
    if (!form.currency_id) nextErrors.currency_id = "obligations.form.errors.currencyRequired";
    return nextErrors;
  };

  const handleSave = async (): Promise<void> => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        id: `oc${crypto.randomUUID()}`,
        amount: parseFloat(form.amount),
        reference_id: form.reference_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ObligationCollection);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRep = reps.find((rep) => rep.id === form.mujtahid_representative_id);
  const selectedMujtahid = selectedRep ? getMujtahid(selectedRep.id) : null;
  const errorMessages = Object.values(errors).map((key) => t(key));

  return (
    <FormModal
      open
      onClose={onClose}
      title={t("obligations.newCollection")}
      icon={Receipt}
      progress={completeness}
      progressLabel={t("common.formProgress")}
      cancelLabel={t("common.cancel")}
      saveLabel={t("obligations.form.save")}
      onSave={() => { void handleSave(); }}
      saving={submitting}
      error={errorMessages}
    >
      <ObligationCollectionFormFields
        form={form}
        setForm={setForm}
        errors={errors}
        obligationTypes={obligationTypes}
        eligibleReps={eligibleReps}
        getMujtahid={getMujtahid}
        selectedMujtahid={selectedMujtahid}
        users={users}
      />
    </FormModal>
  );
}
