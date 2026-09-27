import React, { type Dispatch, type SetStateAction } from "react";
import { User, Users2 } from "lucide-react";
import { RegistryPersonSelect } from "@/tenant/components/selectors/RegistryPersonSelect";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { Distribution } from "@/lib/data/hasanatData";

export interface DistributeRecipientTypeFieldProps {
  data: Partial<Distribution>;
  setData: Dispatch<SetStateAction<Partial<Distribution>>>;
}

export function DistributeRecipientTypeField({
  data,
  setData,
}: DistributeRecipientTypeFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="sm:col-span-2">
      <span id="recipient-type-label" className={FORM_LABEL}>
        {t("hasanat.form.recipientType")}
        <RequiredMark />
      </span>
      <div
        role="radiogroup"
        aria-labelledby="recipient-type-label"
        className="flex gap-2"
      >
        {[
          {
            id: "student" as const,
            label: t("hasanat.form.recipientType.student"),
            icon: User,
          },
          {
            id: "faculty" as const,
            label: t("hasanat.form.recipientType.faculty"),
            icon: Users2,
          },
        ].map((recipientTypeOption) => {
          const Icon = recipientTypeOption.icon;
          const isSelected = data.recipientType === recipientTypeOption.id;
          return (
            <Button
              key={recipientTypeOption.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-pressed={isSelected}
              onClick={() =>
                setData((previousData) => ({
                  ...previousData,
                  recipientType: recipientTypeOption.id,
                  recipientStudentId:
                    recipientTypeOption.id === "student"
                      ? previousData.recipientStudentId
                      : undefined,
                  recipientTeacherId:
                    recipientTypeOption.id === "faculty"
                      ? previousData.recipientTeacherId
                      : undefined,
                }))
              }
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />{" "}
              {recipientTypeOption.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export interface DistributeRecipientSelectFieldProps {
  data: Partial<Distribution>;
  setData: Dispatch<SetStateAction<Partial<Distribution>>>;
  updateField: (field: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export function DistributeRecipientSelectField({
  data,
  setData,
  updateField,
  errors,
}: DistributeRecipientSelectFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const recipientId =
    data.recipientType === "faculty"
      ? data.recipientTeacherId || ""
      : data.recipientStudentId || "";

  return (
    <div>
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

export interface DistributeRecipientClassFieldProps {
  data: Partial<Distribution>;
  updateField: (field: string, value: unknown) => void;
  isRequired?: boolean;
  errors?: Record<string, string>;
}

export function DistributeRecipientClassField({
  data,
  updateField,
  isRequired = false,
  errors,
}: DistributeRecipientClassFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div>
      <label htmlFor="recp-class" className={FORM_LABEL}>
        {data.recipientType === "student"
          ? t("hasanat.form.classLabel")
          : t("hasanat.form.departmentLabel")}
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
