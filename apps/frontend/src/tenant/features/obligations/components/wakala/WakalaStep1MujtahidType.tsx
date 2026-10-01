import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import type { Mujtahid, ObligationType } from "@/lib/data/obligationsData";

interface WakalaStep1MujtahidTypeProps {
  selectedMujtahidId: string;
  selectedObTypeId: string;
  mujtahids: Mujtahid[];
  obligationTypes: ObligationType[];
  errors: Record<string, string>;
  onSelectMujtahid: (id: string) => void;
  onSelectObType: (id: string) => void;
  canAddMujtahid: boolean;
  canAddObType: boolean;
  onOpenAddMujtahid: () => void;
  onOpenAddObType: () => void;
}

export function WakalaStep1MujtahidType({
  selectedMujtahidId,
  selectedObTypeId,
  mujtahids,
  obligationTypes,
  errors,
  onSelectMujtahid,
  onSelectObType,
  canAddMujtahid,
  canAddObType,
  onOpenAddMujtahid,
  onOpenAddObType,
}: WakalaStep1MujtahidTypeProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      <Field id="wakala-mujtahid" label={t("obligations.form.mujtahidLabel")} required error={errors.mujtahid}>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormSelect
              id="wakala-mujtahid"
              name="mujtahid_id"
              value={selectedMujtahidId}
              onChange={onSelectMujtahid}
              placeholder={t("obligations.wakala.selectMujtahid")}
              options={mujtahids.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>
          {canAddMujtahid && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={onOpenAddMujtahid}
              aria-label={t("obligations.mujtahids.add")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Field>

      <Field id="wakala-type" label={t("obligations.wakala.obTypeLabel")} required error={errors.obType}>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormSelect
              id="wakala-type"
              name="obligation_type_id"
              value={selectedObTypeId}
              onChange={onSelectObType}
              placeholder={t("obligations.wakala.obTypePlaceholder")}
              options={obligationTypes.map((o) => ({ value: o.id, label: o.name }))}
            />
          </div>
          {canAddObType && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={onOpenAddObType}
              aria-label={t("obligations.types.add")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Field>
    </div>
  );
}
