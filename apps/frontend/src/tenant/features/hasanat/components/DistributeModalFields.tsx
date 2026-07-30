import { type Dispatch, type SetStateAction } from "react";
import { User, Users2 } from "lucide-react";

import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { RegistryPersonSelect } from "@/components/ui/RegistryPersonSelect";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { Button } from "@/components/ui/button";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { Denomination, Distribution } from "@/lib/data/hasanatData";
import { DEFAULT_HASANAT_FIELD_DEFS } from "@mms/shared";
import { DistributeModalCustomField } from "@/tenant/features/hasanat/components/DistributeModalCustomField";

interface DistributeModalFieldsProps {
  denoms: Denomination[];
  data: Partial<Distribution>;
  selectedDenomination?: Denomination;
  totalAvailable: number;
  setData: Dispatch<SetStateAction<Partial<Distribution>>>;
  updateField: (field: string, value: unknown) => void;
}

export function DistributeModalFields({
  denoms,
  data,
  selectedDenomination,
  totalAvailable,
  setData,
  updateField,
}: DistributeModalFieldsProps) {
  const { t } = useTranslation();
  const { fields, orderedFields, isFieldEnabled } = useHasanatConfig();
  const getCustomFieldPlaceholder = (fieldLabel: string): string => t("hasanat.form.enterField", { field: fieldLabel.toLowerCase() });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {orderedFields.map((field) => {
        if (!isFieldEnabled(field.id)) return null;

        if (field.id === "denominationId") {
          return (
            <div key="denominationId" className="sm:col-span-2">
              <label htmlFor="denom" className={FORM_LABEL}>{t("hasanat.form.denomination")} *</label>
              <FormSelect
                id="denom"
                value={data.denominationId || ""}
                onChange={(value) => updateField("denominationId", value)}
                options={denoms.filter((denomination) => denomination.active).map((denomination) => ({
                  value: denomination.id,
                  label: `${denomination.icon} ${denomination.name} (${t("hasanat.form.pointsShort", { points: denomination.points })})`,
                }))}
              />
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
              <label className={FORM_LABEL}>{t("hasanat.form.recipientType")} *</label>
              <div className="flex gap-2">
                {([
                  { id: "student" as const, label: t("hasanat.form.recipientType.student"), icon: User },
                  { id: "faculty" as const, label: t("hasanat.form.recipientType.faculty"), icon: Users2 },
                ]).map((recipientTypeOption) => {
                  const Icon = recipientTypeOption.icon;
                  return (
                    <Button
                      key={recipientTypeOption.id}
                      type="button"
                      aria-pressed={data.recipientType === recipientTypeOption.id}
                      onClick={() => setData((previousData) => ({
                        ...previousData,
                        recipientType: recipientTypeOption.id,
                        recipientStudentId: recipientTypeOption.id === "student" ? previousData.recipientStudentId : undefined,
                        recipientTeacherId: recipientTypeOption.id === "faculty" ? previousData.recipientTeacherId : undefined,
                      }))}
                      className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors ${data.recipientType === recipientTypeOption.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
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
                    setData((previousData) => ({
                      ...previousData,
                      recipientTeacherId: id,
                      recipientStudentId: undefined,
                    }));
                  } else {
                    setData((previousData) => ({
                      ...previousData,
                      recipientStudentId: id,
                      recipientTeacherId: undefined,
                    }));
                  }
                }}
              />
            </div>
          );
        }

        if (field.id === "recipientClass") {
          const isRequired = !!fields[field.id]?.required;
          return (
            <div key="recipientClass">
              <label htmlFor="recp-class" className={FORM_LABEL}>{data.recipientType === "student" ? t("hasanat.form.classLabel") : t("hasanat.form.departmentLabel")} {isRequired ? "*" : ""}</label>
              <Input id="recp-class" className={FORM_INPUT} value={data.recipientClass || ""} onChange={(event) => updateField("recipientClass", event.target.value)} placeholder={t("hasanat.form.recipientClassPlaceholder")} required={isRequired} />
            </div>
          );
        }

        if (field.id === "quantity") {
          return (
            <div key="quantity">
              <label htmlFor="qty" className={FORM_LABEL}>{t("hasanat.form.quantity")} *</label>
              <Input id="qty" type="number" className={FORM_INPUT} value={data.quantity || 1} onChange={(event) => updateField("quantity", Math.min(+event.target.value, totalAvailable))} min={1} max={totalAvailable} required />
            </div>
          );
        }

        if (field.id === "issuedDate") {
          return (
            <div key="issuedDate">
              <label htmlFor="issue-date" className={FORM_LABEL}>{t("hasanat.form.issuedDate")} *</label>
              <DatePicker id="issue-date" value={data.issuedDate || ""} onChange={(value) => updateField("issuedDate", value)} required />
            </div>
          );
        }

        if (field.id === "reason") {
          return (
            <div key="reason" className="sm:col-span-2">
              <label htmlFor="reason" className={FORM_LABEL}>{t("hasanat.form.reason")} *</label>
              <Input id="reason" className={FORM_INPUT} value={data.reason || ""} onChange={(event) => updateField("reason", event.target.value)} placeholder={t("hasanat.form.reasonPlaceholder")} required />
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
                onChange={(id) => setData((previousData) => ({ ...previousData, issuedByUserId: id }))}
              />
            </div>
          );
        }

        const isCustom = !DEFAULT_HASANAT_FIELD_DEFS.some((defaultField) => defaultField.id === field.id);
        if (!isCustom) return null;

        const fieldValue = (data as Record<string, unknown>)[field.id] ?? "";
        return (
          <DistributeModalCustomField
            key={field.id}
            field={field}
            fieldValue={fieldValue}
            updateField={updateField}
            getCustomFieldPlaceholder={getCustomFieldPlaceholder}
          />
        );
      })}
    </div>
  );
}
