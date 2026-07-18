import React, { useState, useEffect, useMemo } from "react";
import { Receipt, Coins, DollarSign, User, Users } from "lucide-react";
import {
  PAYMENT_MODES, generateReceiptNo,
  ObligationCollection, ObligationType, WakalaType, MujtahidRep, Mujtahid
} from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES } from '@mms/shared';
import ContactPicker from '@/tenant/features/contacts/components/contactLink/ContactPicker';
import { useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_LABEL, FORM_ERROR } from "@/components/ui/formStyles";
import { calculateKeyedUnitsCompleteness } from "@/lib/formCompleteness";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";

interface FormState {
  receipt_no: string;
  received_date: string;
  sender_id: string;
  reference_id: string;
  amount: string;
  currency_id: string;
  payment_mode: string;
  obligation_type_id: string;
  mujtahid_representative_id: string;
  received_by: string;
}

const EMPTY: FormState = {
  receipt_no: "",
  received_date: new Date().toISOString().slice(0, 10),
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
  onSave: (collection: ObligationCollection) => void;
  obligationTypes: ObligationType[];
  wakalaTypes: WakalaType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  existingCollections: ObligationCollection[];
}

/**
 * ObligationCollectionForm component.
 * 
 * Form to create a new obligation collection.
 * 
 * @param {ObligationCollectionFormProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function ObligationCollectionForm({ onClose, onSave, obligationTypes, wakalaTypes, reps, mujtahids, existingCollections }: ObligationCollectionFormProps) {
  const { t } = useTranslation();
  const users = useMergedObligationUsers();
  const currencies = DEFAULT_CURRENCIES;

  const [form, setForm] = useState<FormState>({ ...EMPTY, receipt_no: generateReceiptNo(existingCollections) });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const completeness = useMemo(
    () =>
      calculateKeyedUnitsCompleteness(form as unknown as Record<string, unknown>, [
        { key: "received_date" },
        { key: "sender_id" },
        { key: "amount" },
        { key: "payment_mode" },
        { key: "obligation_type_id" },
        { key: "mujtahid_representative_id" },
        { key: "received_by" },
      ]),
    [form],
  );

  // Filter reps based on selected obligation type (via wakala types)
  const eligibleRepIds = wakalaTypes
    .filter((wakalaType) => wakalaType.obligation_type_id === form.obligation_type_id)
    .map((wakalaType) => wakalaType.mujtahid_representative_id);

  const eligibleReps = form.obligation_type_id
    ? reps.filter((rep) => eligibleRepIds.includes(rep.id))
    : reps;

  // Reset rep when obligation type changes
  useEffect(() => {
    if (form.obligation_type_id) {
      setForm((currentForm) => ({ ...currentForm, mujtahid_representative_id: "" }));
    }
  }, [form.obligation_type_id]);

  const getMujtahid = (repId: string) => {
    const rep = reps.find((candidateRep) => candidateRep.id === repId);
    return rep ? mujtahids.find((mujtahid) => mujtahid.id === rep.mujtahid_id) : null;
  };

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!form.sender_id) nextErrors.sender_id = "Sender is required";
    if (!form.amount || parseFloat(form.amount) <= 0) nextErrors.amount = "Amount must be greater than 0";
    if (!form.received_date) nextErrors.received_date = "Date is required";
    if (!form.obligation_type_id) nextErrors.obligation_type_id = "Obligation type is required";
    if (!form.mujtahid_representative_id) nextErrors.mujtahid_representative_id = "Representative is required";
    if (!form.received_by) nextErrors.received_by = "Received by is required";
    if (!form.currency_id) nextErrors.currency_id = "Currency is required";
    return nextErrors;
  };

  const handleSave = (): void => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    onSave({
      ...form,
      id: `oc${Date.now()}`,
      amount: parseFloat(form.amount),
      reference_id: form.reference_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ObligationCollection);
  };

  const formField = (key: keyof FormState, label: string, required: boolean, children: React.ReactNode) => (
    <div>
      <label htmlFor={`form-${key}`} className={FORM_LABEL}>
        {label}{required ? " *" : ""}
      </label>
      {React.cloneElement(children as React.ReactElement<{ id?: string; "aria-invalid"?: boolean }>, { id: `form-${key}`, "aria-invalid": !!errors[key] })}
      {errors[key] && <p className={FORM_ERROR} role="alert">{errors[key]}</p>}
    </div>
  );

  
  const selectedRep = reps.find((rep) => rep.id === form.mujtahid_representative_id);
  const selectedMujtahid = selectedRep ? getMujtahid(selectedRep.id) : null;

  return (
    <FormModal
      open
      onClose={onClose}
      title="New Obligation Collection"
      icon={Receipt}
      progress={completeness}
      progressLabel={t("common.formProgress")}
      cancelLabel={t("common.cancel")}
      saveLabel="Save Collection"
      onSave={handleSave}
      error={Object.values(errors)}
    >
      <div className="space-y-6">
        {/* Receipt No (read-only) */}
        <header className="relative overflow-hidden group rounded-2xl border border-primary/25 bg-primary/5 backdrop-blur-sm p-4 px-5.5 flex items-center gap-3.5 shadow-sm transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/70" />
          <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide m-0">Auto-Generated Receipt No.</h3>
            <p className="text-lg font-bold text-primary font-mono m-0">{form.receipt_no}</p>
          </div>
        </header>

        <fieldset className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-0 m-0">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <Receipt className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Collection Metadata</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formField("received_date", "Received Date", true,
              <DatePicker
                value={form.received_date}
                onChange={(val) => setForm({ ...form, received_date: val })}
                required
              />
            )}
            {formField("payment_mode", "Payment Mode", true,
              <FormSelect
                value={form.payment_mode}
                onChange={(val) => setForm({ ...form, payment_mode: val })}
                options={PAYMENT_MODES}
                className="w-full"
              />
            )}
          </div>
        </fieldset>

        <fieldset className="relative z-20 overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-0 m-0">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500/60 transition-colors group-hover:bg-purple-500" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <Users className="w-4 h-4 text-purple-500/70 group-hover:text-purple-500 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Sender Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formField("sender_id", "Sender (Contact)", true,
              <ContactPicker
                label="Sender (Contact)"
                value={form.sender_id || null}
                onChange={(contactId) => setForm({ ...form, sender_id: contactId != null ? String(contactId) : "" })}
                searchPlaceholder="Search contacts…"
              />
            )}
            {formField("reference_id", "Reference Contact", false,
              <ContactPicker
                label="Reference Contact"
                value={form.reference_id || null}
                onChange={(contactId) => setForm({ ...form, reference_id: contactId != null ? String(contactId) : "" })}
                allowCreate={false}
                searchPlaceholder="Search contacts…"
              />
            )}
          </div>
        </fieldset>

        <fieldset className="relative z-10 overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-0 m-0">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <Coins className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Financial Value</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formField("amount", "Amount", true,
              <div className="relative flex items-center group/input w-full">
                <DollarSign className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none z-10" />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  placeholder="0.00"
                  className="pl-10 w-full"
                />
              </div>
            )}
            {formField("currency_id", "Currency", true,
              <FormSelect
                value={form.currency_id}
                onChange={(val) => setForm({ ...form, currency_id: val })}
                options={currencies.map((currency) => ({ value: currency.id, label: `${currency.code} – ${currency.name}` }))}
                className="w-full"
              />
            )}
          </div>
        </fieldset>

        <fieldset className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-0 m-0">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <User className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Islamic Jurisprudence / Wakala</h3>
          </div>
          <div className="space-y-4">
            {formField("obligation_type_id", "Obligation Type", true,
              <FormSelect
                value={form.obligation_type_id}
                onChange={(val) => setForm({ ...form, obligation_type_id: val })}
                placeholder="Select obligation type…"
                options={obligationTypes.map((obligationType) => ({
                  value: obligationType.id,
                  label: `${obligationType.name} (${obligationType.designated_for})`
                }))}
                className="w-full"
              />
            )}

            {formField("mujtahid_representative_id", "Mujtahid Representative", true,
              <div className="space-y-1 w-full">
                <FormSelect
                  value={form.mujtahid_representative_id}
                  onChange={(val) => setForm({ ...form, mujtahid_representative_id: val })}
                  disabled={!form.obligation_type_id}
                  placeholder={form.obligation_type_id ? "Select representative…" : "Select obligation type first"}
                  options={eligibleReps.map((rep) => {
                    const mujtahid = getMujtahid(rep.id);
                    return {
                      value: rep.id,
                      label: `${rep.name}${mujtahid ? ` (${mujtahid.name})` : ""}`
                    };
                  })}
                  className="w-full"
                />
                {selectedMujtahid && (
                  <p className="text-xs text-muted-foreground mt-1">Mujtahid: <span className="font-semibold text-foreground">{selectedMujtahid.name}</span></p>
                )}
              </div>
            )}

            {formField("received_by", "Received By (User)", true,
              <FormSelect
                value={form.received_by}
                onChange={(val) => setForm({ ...form, received_by: val })}
                placeholder="Select user…"
                options={users.map((user) => ({ value: user.id, label: user.name }))}
                className="w-full"
              />
            )}
          </div>
        </fieldset>
      </div>
    </FormModal>
  );
}
