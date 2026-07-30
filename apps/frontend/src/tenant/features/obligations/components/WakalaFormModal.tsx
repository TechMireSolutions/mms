import React, { useState } from "react";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { type Mujtahid, type MujtahidRep, type ObligationType, type WakalaType } from "@/lib/data/obligationsData";

interface WakalaFormModalProps {
  title: string;
  initial: Partial<WakalaType>;
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  obligationTypes: ObligationType[];
  onSave: (form: Partial<WakalaType>) => void;
  onClose: () => void;
}

export function WakalaFormModal({ initial, reps, mujtahids, obligationTypes, onSave, onClose, title }: WakalaFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getMujtahidForRep = (repId: string) => {
    const rep = reps.find((candidateRep) => candidateRep.id === repId);
    return rep ? mujtahids.find((mujtahid) => mujtahid.id === rep.mujtahid_id) : null;
  };

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!form.mujtahid_representative_id) nextErrors.rep = t("obligations.wakala.repRequired");
    if (!form.obligation_type_id) nextErrors.obType = t("obligations.wakala.typeRequired");
    return nextErrors;
  };

  const handleSave = (): void => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    onSave(form);
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      error={Object.values(errors)}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="wakala-rep" className={FORM_LABEL}>{t("obligations.wakala.repLabel")} *</label>
          <FormSelect
            id="wakala-rep"
            value={form.mujtahid_representative_id || ""}
            onChange={(val) => setForm({ ...form, mujtahid_representative_id: val })}
            placeholder={t("obligations.wakala.repPlaceholder")}
            options={reps.map((rep) => {
              const mujtahid = getMujtahidForRep(rep.id);
              return { value: rep.id, label: `${rep.name} (${mujtahid?.name || "?"})` };
            })}
          />
        </div>
        <div>
          <label htmlFor="wakala-type" className={FORM_LABEL}>{t("obligations.wakala.obTypeLabel")} *</label>
          <FormSelect
            id="wakala-type"
            value={form.obligation_type_id || ""}
            onChange={(val) => setForm({ ...form, obligation_type_id: val })}
            placeholder={t("obligations.wakala.obTypePlaceholder")}
            options={obligationTypes.map((obligationType) => ({ value: obligationType.id, label: obligationType.name }))}
          />
        </div>
      </div>
    </FormModal>
  );
}
