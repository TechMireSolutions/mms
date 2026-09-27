import React from "react";
import { FormSelect } from "@/components/ui/FormSelect";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import type { Denomination, Distribution } from "@/lib/data/hasanatData";

export interface DistributeDenominationFieldProps {
  denoms: Denomination[];
  data: Partial<Distribution>;
  selectedDenomination?: Denomination;
  totalAvailable: number;
  updateField: (field: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export function DistributeDenominationField({
  denoms,
  data,
  selectedDenomination,
  totalAvailable,
  updateField,
  errors,
}: DistributeDenominationFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="sm:col-span-2">
      <label htmlFor="denom" className={FORM_LABEL}>
        {t("hasanat.form.denomination")}
        <RequiredMark />
      </label>
      <FormSelect
        id="denom"
        name="denominationId"
        value={data.denominationId || ""}
        onChange={(value) => updateField("denominationId", value)}
        aria-invalid={Boolean(errors?.denominationId)}
        aria-describedby={errors?.denominationId ? "denom-error" : undefined}
        className={errors?.denominationId ? FORM_INPUT_ERROR : undefined}
        options={denoms
          .filter((denomination) => denomination.active)
          .map((denomination) => ({
            value: denomination.id,
            label: `${denomination.icon} ${denomination.name} (${t("hasanat.form.pointsShort", { points: denomination.points })})`,
          }))}
      />
      <FieldErrorMessage id="denom-error" message={errors?.denominationId} />
      {selectedDenomination && (
        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex h-8 flex-1 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white"
            style={{ background: selectedDenomination.color }}
          >
            <span>{selectedDenomination.icon}</span>
            <span>{selectedDenomination.name}</span>
          </div>
          <span
            className={`text-xs font-semibold ${
              totalAvailable === 0 ? "text-destructive" : "text-success"
            }`}
          >
            {t("hasanat.form.availableCount", { count: totalAvailable })}
          </span>
        </div>
      )}
    </div>
  );
}
