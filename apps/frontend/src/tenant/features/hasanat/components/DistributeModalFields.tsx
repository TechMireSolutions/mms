import { type Dispatch, type SetStateAction } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { type Denomination, type Distribution } from "@/lib/data/hasanatData";
import { cn } from "@/lib/utils";
import { DistributeDenominationField } from "./DistributeDenominationField";
import {
  DistributeRecipientClassField,
  DistributeRecipientSelectField,
  DistributeRecipientTypeField,
} from "./DistributeRecipientFields";

interface DistributeModalFieldsProps {
  denoms: Denomination[];
  data: Partial<Distribution>;
  selectedDenomination?: Denomination;
  totalAvailable: number;
  setData: Dispatch<SetStateAction<Partial<Distribution>>>;
  updateField: (field: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export function DistributeModalFields({
  denoms,
  data,
  selectedDenomination,
  totalAvailable,
  setData,
  updateField,
  errors,
}: DistributeModalFieldsProps) {
  const { t } = useTranslation();
  const { fields, orderedFields, isFieldEnabled } = useHasanatConfig();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {orderedFields.map((field) => {
        if (!isFieldEnabled(field.id)) return null;

        if (field.id === "denominationId") {
          return (
            <DistributeDenominationField
              key="denominationId"
              denoms={denoms}
              data={data}
              selectedDenomination={selectedDenomination}
              totalAvailable={totalAvailable}
              updateField={updateField}
              errors={errors}
            />
          );
        }

        if (field.id === "recipientType") {
          return (
            <DistributeRecipientTypeField
              key="recipientType"
              data={data}
              setData={setData}
            />
          );
        }

        if (field.id === "recipientName") {
          return (
            <DistributeRecipientSelectField
              key="recipientName"
              data={data}
              setData={setData}
              updateField={updateField}
              errors={errors}
            />
          );
        }

        if (field.id === "recipientClass") {
          return (
            <DistributeRecipientClassField
              key="recipientClass"
              data={data}
              updateField={updateField}
              isRequired={!!fields[field.id]?.required}
              errors={errors}
            />
          );
        }

        if (field.id === "quantity") {
          return (
            <div key="quantity">
              <label htmlFor="qty" className={FORM_LABEL}>
                {t("hasanat.form.quantity")}
                <RequiredMark />
              </label>
              <Input
                id="qty"
                name="quantity"
                type="number"
                inputMode="numeric"
                className={cn(FORM_INPUT, errors?.quantity && FORM_INPUT_ERROR)}
                value={data.quantity ?? ""}
                onChange={(event) =>
                  updateField(
                    "quantity",
                    event.target.value === "" ? "" : Math.min(+event.target.value, totalAvailable),
                  )
                }
                min={1}
                max={totalAvailable}
                required
                aria-invalid={Boolean(errors?.quantity)}
                aria-describedby={errors?.quantity ? "qty-error" : undefined}
              />
              <FieldErrorMessage id="qty-error" message={errors?.quantity} />
            </div>
          );
        }

        if (field.id === "issuedDate") {
          return (
            <div key="issuedDate">
              <label htmlFor="issue-date" className={FORM_LABEL}>
                {t("hasanat.form.issuedDate")}
                <RequiredMark />
              </label>
              <DatePicker
                id="issue-date"
                name="issuedDate"
                value={data.issuedDate || ""}
                onChange={(value) => updateField("issuedDate", value)}
                required
              />
              <FieldErrorMessage id="issue-date-error" message={errors?.issuedDate} />
            </div>
          );
        }

        if (field.id === "reason") {
          return (
            <div key="reason" className="sm:col-span-2">
              <label htmlFor="reason" className={FORM_LABEL}>
                {t("hasanat.form.reason")}
                <RequiredMark />
              </label>
              <Input
                id="reason"
                name="reason"
                className={cn(FORM_INPUT, errors?.reason && FORM_INPUT_ERROR)}
                value={data.reason || ""}
                onChange={(event) => updateField("reason", event.target.value)}
                placeholder={t("hasanat.form.reasonPlaceholder")}
                required
                aria-invalid={Boolean(errors?.reason)}
                aria-describedby={errors?.reason ? "reason-error" : undefined}
              />
              <FieldErrorMessage id="reason-error" message={errors?.reason} />
            </div>
          );
        }

        if (field.id === "issuedBy") {
          const isRequired = !!fields[field.id]?.required;
          return (
            <div key="issuedBy" className="sm:col-span-2">
              <UserActorSelect
                id="issued-by"
                label={t("hasanat.fieldIssuedBy")}
                required={isRequired}
                value={data.issuedByUserId || ""}
                onChange={(id) => {
                  updateField("issuedByUserId", id);
                  setData((previousData) => ({ ...previousData, issuedByUserId: id }));
                }}
              />
              <FieldErrorMessage id="issued-by-error" message={errors?.issuedBy} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
