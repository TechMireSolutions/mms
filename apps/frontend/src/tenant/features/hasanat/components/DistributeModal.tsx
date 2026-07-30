import { useEffect, useMemo, useState } from "react";
import { Star, User, Users2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { RegistryPersonSelect } from "@/components/ui/RegistryPersonSelect";
import { Textarea } from "@/components/ui/textarea";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { Button } from "@/components/ui/button";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Denomination, Distribution, StockBatch } from "@/lib/data/hasanatData";
import { DEFAULT_HASANAT_FIELD_DEFS, todayISO } from "@mms/shared";

const EMPTY_DIST: Partial<Distribution> = {
  denominationId: "",
  recipientType: "student",
  recipientStudentId: "",
  recipientTeacherId: "",
  recipientClass: "",
  quantity: 1,
  reason: "",
  issuedDate: todayISO(),
  issuedByUserId: "",
};

export interface DistributeModalProps {
  open: boolean;
  denoms: Denomination[];
  batches: StockBatch[];
  onClose: () => void;
  onSave: (dist: Distribution) => void | Promise<void>;
}

export function DistributeModal({ open, denoms, batches, onClose, onSave }: DistributeModalProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<Partial<Distribution>>({
    ...EMPTY_DIST,
    denominationId: denoms[0]?.id || "",
  });

  const updateField = (field: string, value: unknown) =>
    setData((previousData: Partial<Distribution>) => ({ ...previousData, [field]: value } as Partial<Distribution>));

  useEffect(() => {
    if (open) {
      setData({
        ...EMPTY_DIST,
        denominationId: denoms[0]?.id || "",
        issuedDate: todayISO(),
        issuedByUserId: authUser?.id || "",
      });
    }
  }, [open, denoms, authUser?.id]);

  const selectedDenomination = denoms.find((denomination) => denomination.id === data.denominationId);
  const availableBatches = batches.filter((batch) => batch.denominationId === data.denominationId && batch.remaining > 0);
  const totalAvailable = availableBatches.reduce((sum: number, batch: StockBatch) => sum + batch.remaining, 0);

  const { fields, orderedFields, isFieldEnabled, isFieldRequired } = useHasanatConfig();

  const isValid = useMemo(() => {
    if (totalAvailable === 0) return false;
    for (const field of orderedFields) {
      const isEnabled = isFieldEnabled(field.id);
      const isRequired = isFieldRequired(field.id);
      if (!isEnabled || !isRequired) continue;
      if (field.id === "recipientName") {
        const recipientId = data.recipientType === "faculty"
          ? data.recipientTeacherId
          : data.recipientStudentId;
        if (!recipientId) return false;
        continue;
      }
      if (field.id === "issuedBy") {
        const actorId = data.issuedByUserId || "";
        if (!actorId) return false;
        continue;
      }
      const fieldValue = (data as Record<string, unknown>)[field.id];
      if (fieldValue === undefined || fieldValue === null || fieldValue === "") return false;
    }
    return true;
  }, [orderedFields, data, totalAvailable, isFieldEnabled, isFieldRequired]);

  const getCustomFieldPlaceholder = (fieldLabel: string): string => t("hasanat.form.enterField", { field: fieldLabel.toLowerCase() });

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("hasanat.distributeCards")}
      icon={Star}
      cancelLabel={t("common.cancel")}
      saveLabel={t("hasanat.form.distributeAction")}
      saving={submitting}
      onSave={() => {
        void (async () => {
        const denomination = denoms.find((candidate) => candidate.id === data.denominationId);
        const batch = batches.find((candidate) => candidate.denominationId === data.denominationId && candidate.remaining > 0);
        const payload: Distribution = {
          ...data,
          id: `dist${Date.now()}`,
          denominationName: denomination?.name || "",
          batchId: batch?.id || "",
          status: "active",
          recipientName: "",
          issuedByUserId: data.issuedByUserId || authUser?.id || "",
        } as Distribution;
        if (data.recipientType === "faculty") {
          delete payload.recipientStudentId;
        } else {
          delete payload.recipientTeacherId;
        }
        setSubmitting(true);
        try {
          await onSave(payload);
        } finally {
          setSubmitting(false);
        }
        })();
      }}
      saveDisabled={!isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderedFields.map((field) => {
              const isEnabled = isFieldEnabled(field.id);
              if (!isEnabled) return null;

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
                        label: `${denomination.icon} ${denomination.name} (${t("hasanat.form.pointsShort", { points: denomination.points })})`
                      }))}
                    />
                    {selectedDenomination && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-8 flex-1 rounded-lg flex items-center gap-2 px-3 text-white text-xs font-semibold" style={{ background: selectedDenomination.color }}>
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
                        { id: "faculty" as const, label: t("hasanat.form.recipientType.faculty"), icon: Users2 }
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
                            className={`flex-1 min-h-11 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${data.recipientType === recipientTypeOption.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                          >
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {recipientTypeOption.label}
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
                    <DatePicker
                      id="issue-date"
                      value={data.issuedDate || ""}
                      onChange={(value) => updateField("issuedDate", value)}
                      required
                    />
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

              // Custom Field
              const isCustom = !DEFAULT_HASANAT_FIELD_DEFS.some((defaultField) => defaultField.id === field.id);
              if (isCustom) {
                const fieldValue = (data as unknown as Record<string, unknown>)[field.id] ?? "";
                return (
                  <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className={FORM_LABEL}>
                      {field.label} {field.required ? "*" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={`custom-${field.id}`}
                        name={field.id}
                        value={fieldValue as string}
                        onChange={(event) => updateField(field.id, event.target.value)}
                        placeholder={field.placeholder || getCustomFieldPlaceholder(field.label)}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      <FormSelect
                        value={fieldValue as string}
                        onChange={(value) => updateField(field.id, value)}
                        placeholder={t("hasanat.form.selectOption")}
                        options={field.options || []}
                      />
                    ) : field.type === "boolean" ? (
                      <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                        <Checkbox
                          checked={!!fieldValue}
                          onCheckedChange={(checked) => updateField(field.id, !!checked)}
                        />
                        <span className="text-xs font-medium text-foreground">{field.label}</span>
                      </label>
                    ) : field.type === "number" ? (
                      <Input
                        type="number"
                        className={FORM_INPUT}
                        value={fieldValue as string | number}
                        onChange={(event) => updateField(field.id, event.target.value)}
                        placeholder={field.placeholder || t("hasanat.form.enterNumber")}
                        required={field.required}
                      />
                    ) : field.type === "date" ? (
                      <DatePicker
                        value={fieldValue as string}
                        onChange={(value) => updateField(field.id, value)}
                        required={field.required}
                      />
                    ) : (
                      <Input
                        type="text"
                        className={FORM_INPUT}
                        value={fieldValue as string}
                        onChange={(event) => updateField(field.id, event.target.value)}
                        placeholder={field.placeholder || getCustomFieldPlaceholder(field.label)}
                        required={field.required}
                      />
                    )}
                  </div>
                );
              }

              return null;
            })}
      </div>
    </FormModal>
  );
}
