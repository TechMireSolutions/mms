import { type Dispatch, type SetStateAction } from "react";
import { User, Users2 } from "lucide-react";

import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { RegistryPersonSelect } from "@/components/ui/RegistryPersonSelect";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { Button } from "@/components/ui/button";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { type Denomination, type Distribution } from "@/lib/data/hasanatData";
import { cn } from "@/lib/utils";

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
            <div key="denominationId" className="sm:col-span-2">
              <label htmlFor="denom" className={FORM_LABEL}>{t("hasanat.form.denomination")}<RequiredMark /></label>
              <FormSelect
                id="denom"
                name="denominationId"
                value={data.denominationId || ""}
                onChange={(value) => updateField("denominationId", value)}
                aria-invalid={Boolean(errors?.denominationId)}
                aria-describedby={errors?.denominationId ? "denom-error" : undefined}
                className={errors?.denominationId ? FORM_INPUT_ERROR : undefined}
                options={denoms.filter((denomination) => denomination.active).map((denomination) => ({
                  value: denomination.id,
                  label: `${denomination.icon} ${denomination.name} (${t("hasanat.form.pointsShort", { points: denomination.points })})`,
                }))}
              />
              <FieldErrorMessage id="denom-error" message={errors?.denominationId} />
              {selectedDenomination && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-8 flex-1 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white" style={{ background: selectedDenomination.color }}>
                    <span>{selectedDenomination.icon}</span><span>{selectedDenomination.name}</span>
                  </div>
                  <span className={`text-xs font-semibold ${totalAvailable === 0 ? "text-destructive" : "text-success"}`}>
                    {t("hasanat.form.availableCount", { count: totalAvailable })}
                  </span>
                </div>
              )}
            </div>
          );
        }

        if (field.id === "recipientType") {
          return (
            <div key="recipientType" className="sm:col-span-2">
              <span id="recipient-type-label" className={FORM_LABEL}>{t("hasanat.form.recipientType")}<RequiredMark /></span>
              <div
                role="radiogroup"
                aria-labelledby="recipient-type-label"
                className="flex gap-2"
              >
                {([
                  { id: "student" as const, label: t("hasanat.form.recipientType.student"), icon: User },
                  { id: "faculty" as const, label: t("hasanat.form.recipientType.faculty"), icon: Users2 },
                ]).map((recipientTypeOption) => {
                  const Icon = recipientTypeOption.icon;
                  const isSelected = data.recipientType === recipientTypeOption.id;
                  return (
                    <Button
                      key={recipientTypeOption.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-pressed={isSelected}
                      onClick={() => setData((previousData) => ({
                        ...previousData,
                        recipientType: recipientTypeOption.id,
                        recipientStudentId: recipientTypeOption.id === "student" ? previousData.recipientStudentId : undefined,
                        recipientTeacherId: recipientTypeOption.id === "faculty" ? previousData.recipientTeacherId : undefined,
                      }))}
                      className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {recipientTypeOption.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (field.id === "recipientName") {
          const recipientId = data.recipientType === "faculty"
            ? (data.recipientTeacherId || "")
            : (data.recipientStudentId || "");
          return (
            <div key="recipientName">
              <RegistryPersonSelect
                id="hasanat-recipient"
                kind={data.recipientType === "faculty" ? "teacher" : "student"}
                label={t("hasanat.fieldRecipient")}
                required
                value={recipientId}
                onChange={(id) => {
                  if (data.recipientType === "faculty") {
                    updateField("recipientTeacherId", id);
                    setData((previousData) => ({
                      ...previousData,
                      recipientTeacherId: id,
                      recipientStudentId: undefined,
                    }));
                  } else {
                    updateField("recipientStudentId", id);
                    setData((previousData) => ({
                      ...previousData,
                      recipientStudentId: id,
                      recipientTeacherId: undefined,
                    }));
                  }
                }}
              />
              <FieldErrorMessage id="recipient-error" message={errors?.recipientName} />
            </div>
          );
        }

        if (field.id === "recipientClass") {
          const isRequired = !!fields[field.id]?.required;
          return (
            <div key="recipientClass">
              <label htmlFor="recp-class" className={FORM_LABEL}>
                {data.recipientType === "student" ? t("hasanat.form.classLabel") : t("hasanat.form.departmentLabel")}
                {isRequired ? <RequiredMark /> : null}
              </label>
              <Input
                id="recp-class"
                name="recipientClass"
                className={cn(FORM_INPUT, errors?.recipientClass && FORM_INPUT_ERROR)}
                value={data.recipientClass || ""}
                onChange={(event) => updateField("recipientClass", event.target.value)}
                placeholder={t("hasanat.form.recipientClassPlaceholder")}
                required={isRequired}
                aria-invalid={Boolean(errors?.recipientClass)}
                aria-describedby={errors?.recipientClass ? "recp-class-error" : undefined}
              />
              <FieldErrorMessage id="recp-class-error" message={errors?.recipientClass} />
            </div>
          );
        }

        if (field.id === "quantity") {
          return (
            <div key="quantity">
              <label htmlFor="qty" className={FORM_LABEL}>{t("hasanat.form.quantity")}<RequiredMark /></label>
              <Input
                id="qty"
                name="quantity"
                type="number"
                inputMode="numeric"
                className={cn(FORM_INPUT, errors?.quantity && FORM_INPUT_ERROR)}
                value={data.quantity ?? ""}
                onChange={(event) => updateField("quantity", event.target.value === "" ? "" : Math.min(+event.target.value, totalAvailable))}
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
              <label htmlFor="issue-date" className={FORM_LABEL}>{t("hasanat.form.issuedDate")}<RequiredMark /></label>
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
              <label htmlFor="reason" className={FORM_LABEL}>{t("hasanat.form.reason")}<RequiredMark /></label>
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
