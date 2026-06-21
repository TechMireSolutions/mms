import React, { useState, useEffect, useMemo } from "react";
import { Receipt } from "lucide-react";
import {
  MOCK_CURRENCIES, PAYMENT_MODES, generateReceiptNo,
  ObligationCollection, ObligationType, WakalaType, MujtahidRep, Mujtahid
} from '@/lib/data/obligationsData';
import ContactPicker from '@/components/contactLink/ContactPicker';
import { useMergedObligationUsers } from "../../hooks/useObligationLookups";
import FormModal from "@/components/ui/FormModal";
import useTranslation from "@/hooks/useTranslation";
import { DatePicker } from "../ui/DatePicker";
import { FORM_INPUT, FORM_LABEL, FORM_SELECT, FORM_ERROR } from "@/components/ui/formStyles";
import { calculateKeyedUnitsCompleteness } from "@/lib/formCompleteness";

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
export default function ObligationCollectionForm({ onClose, onSave, obligationTypes, wakalaTypes, reps, mujtahids, existingCollections }: ObligationCollectionFormProps) {
  const { t } = useTranslation();
  const users = useMergedObligationUsers();

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
    .filter((w) => w.obligation_type_id === form.obligation_type_id)
    .map((w) => w.mujtahid_representative_id);

  const eligibleReps = form.obligation_type_id
    ? reps.filter((r) => eligibleRepIds.includes(r.id))
    : reps;

  // Reset rep when obligation type changes
  useEffect(() => {
    if (form.obligation_type_id) {
      setForm((f) => ({ ...f, mujtahid_representative_id: "" }));
    }
  }, [form.obligation_type_id]);

  const getMujtahid = (repId: string) => {
    const rep = reps.find((r) => r.id === repId);
    return rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null;
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.sender_id) e.sender_id = "Sender is required";
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = "Amount must be greater than 0";
    if (!form.received_date) e.received_date = "Date is required";
    if (!form.obligation_type_id) e.obligation_type_id = "Obligation type is required";
    if (!form.mujtahid_representative_id) e.mujtahid_representative_id = "Representative is required";
    if (!form.received_by) e.received_by = "Received by is required";
    if (!form.currency_id) e.currency_id = "Currency is required";
    return e;
  };

  const handleSave = (): void => {
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSave({
      ...form,
      id: `oc${Date.now()}`,
      amount: parseFloat(form.amount),
      reference_id: form.reference_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ObligationCollection);
  };

  const field = (key: keyof FormState, label: string, required: boolean, children: React.ReactNode) => (
    <div>
      <label htmlFor={`form-${key}`} className={FORM_LABEL}>
        {label}{required ? " *" : ""}
      </label>
      {React.cloneElement(children as React.ReactElement<{ id?: string; "aria-invalid"?: boolean }>, { id: `form-${key}`, "aria-invalid": !!errors[key] })}
      {errors[key] && <p className={FORM_ERROR} role="alert">{errors[key]}</p>}
    </div>
  );

  
  const selectedRep = reps.find((r) => r.id === form.mujtahid_representative_id);
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
      <div className="space-y-4">
        {/* Receipt No (read-only) */}
        <header className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide m-0">Auto-Generated Receipt No.</h3>
            <p className="text-lg font-bold text-primary font-mono m-0">{form.receipt_no}</p>
          </div>
        </header>

        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0 m-0">
          {field("received_date", "Received Date", true,
            <DatePicker
              value={form.received_date}
              onChange={(val) => setForm({ ...form, received_date: val })}
              required
            />
          )}
          {field("payment_mode", "Payment Mode", true,
            <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} className={FORM_SELECT}>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </fieldset>

        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0 m-0">
          {field("sender_id", "Sender (Contact)", true,
            <ContactPicker
              label="Sender (Contact)"
              value={form.sender_id || null}
              onChange={(id) => setForm({ ...form, sender_id: id != null ? String(id) : "" })}
              searchPlaceholder="Search contacts…"
            />
          )}
          {field("reference_id", "Reference Contact", false,
            <ContactPicker
              label="Reference Contact"
              value={form.reference_id || null}
              onChange={(id) => setForm({ ...form, reference_id: id != null ? String(id) : "" })}
              allowCreate={false}
              searchPlaceholder="Search contacts…"
            />
          )}
        </fieldset>

        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0 m-0">
          {field("amount", "Amount", true,
            <input type="number" min="0.01" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={FORM_INPUT} />
          )}
          {field("currency_id", "Currency", true,
            <select value={form.currency_id} onChange={(e) => setForm({ ...form, currency_id: e.target.value })} className={FORM_SELECT}>
              {MOCK_CURRENCIES.map((c) => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          )}
        </fieldset>

        <fieldset className="border-0 p-0 m-0 space-y-4">
          {field("obligation_type_id", "Obligation Type", true,
            <select value={form.obligation_type_id} onChange={(e) => setForm({ ...form, obligation_type_id: e.target.value })} className={FORM_SELECT}>
              <option value="">Select obligation type…</option>
              {obligationTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.designated_for})</option>)}
            </select>
          )}

          {field("mujtahid_representative_id", "Mujtahid Representative", true,
            <div>
              <select value={form.mujtahid_representative_id}
                onChange={(e) => setForm({ ...form, mujtahid_representative_id: e.target.value })}
                disabled={!form.obligation_type_id}
                className={`${FORM_SELECT} ${!form.obligation_type_id ? "opacity-50 cursor-not-allowed" : ""}`}>
                <option value="">{form.obligation_type_id ? "Select representative…" : "Select obligation type first"}</option>
                {eligibleReps.map((r) => {
                  const m = getMujtahid(r.id);
                  return <option key={r.id} value={r.id}>{r.name}{m ? ` (${m.name})` : ""}</option>;
                })}
              </select>
              {selectedMujtahid && (
                <p className="text-xs text-muted-foreground mt-1">Mujtahid: <span className="font-semibold text-foreground">{selectedMujtahid.name}</span></p>
              )}
            </div>
          )}

          {field("received_by", "Received By (User)", true,
            <select value={form.received_by} onChange={(e) => setForm({ ...form, received_by: e.target.value })} className={FORM_SELECT}>
              <option value="">Select user…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </fieldset>
      </div>
    </FormModal>
  );
}
