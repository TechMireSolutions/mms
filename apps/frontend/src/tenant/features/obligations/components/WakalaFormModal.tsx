import React, { useState } from "react";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormModal } from "@/components/ui/FormModal";
import { RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check } from "lucide-react";
import { NameFormModal } from "@/tenant/features/obligations/components/MujtahidNameFormModal";
import { ObligationTypeFormModal } from "@/tenant/features/obligations/components/ObligationTypeFormModal";
import { type Mujtahid, type MujtahidRep, type ObligationType, type WakalaType, type ObligationDistribution } from "@/lib/data/obligationsData";
import { cn } from "@/lib/utils";

interface InitialDistRow {
  id: string;
  name: string;
  percentage: number;
  type: "Income" | "Liability";
}

interface WakalaFormModalProps {
  title: string;
  initial: Partial<WakalaType>;
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  obligationTypes: ObligationType[];
  onSave: (form: Partial<WakalaType>, initialDistributions?: Partial<ObligationDistribution>[]) => Promise<unknown> | void;
  onClose: () => void;
  onChangeMujtahids?: (mujtahids: Mujtahid[]) => Promise<void> | void;
  onChangeReps?: (reps: MujtahidRep[]) => Promise<void> | void;
  onChangeTypes?: (types: ObligationType[]) => Promise<void> | void;
}

export function WakalaFormModal({
  initial,
  reps,
  mujtahids,
  obligationTypes,
  onSave,
  onClose,
  onChangeMujtahids,
  onChangeReps,
  onChangeTypes,
  title,
}: WakalaFormModalProps): React.JSX.Element {
  const { t } = useTranslation();

  // Find initial rep and mujtahid if editing
  const existingRep = reps.find((r) => r.id === initial.mujtahid_representative_id);
  const initialMujtahidId = existingRep ? existingRep.mujtahid_id : "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMujtahidId, setSelectedMujtahidId] = useState(initialMujtahidId);
  const [selectedRepId, setSelectedRepId] = useState(initial.mujtahid_representative_id || "");
  const [selectedObTypeId, setSelectedObTypeId] = useState(initial.obligation_type_id || "");

  const [initialDistributions, setInitialDistributions] = useState<InitialDistRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [isAddMujtahidOpen, setIsAddMujtahidOpen] = useState(false);
  const [isAddRepOpen, setIsAddRepOpen] = useState(false);
  const [isAddObTypeOpen, setIsAddObTypeOpen] = useState(false);

  const generateEntityId = (prefix: string): string => {
    const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11);
    return `${prefix}${uuid}`;
  };

  const handleSaveMujtahid = async (newMujtahid: Partial<Mujtahid>) => {
    if (onChangeMujtahids) {
      const id = generateEntityId("m");
      await onChangeMujtahids([...mujtahids, { ...newMujtahid, id } as Mujtahid]);
      setSelectedMujtahidId(id);
      setSelectedRepId(""); // Reset rep selection when mujtahid changes
    }
    setIsAddMujtahidOpen(false);
  };

  const handleSaveRep = async (newRep: Partial<MujtahidRep>) => {
    if (onChangeReps && selectedMujtahidId) {
      const id = generateEntityId("mr");
      await onChangeReps([...reps, { ...newRep, id, mujtahid_id: selectedMujtahidId } as MujtahidRep]);
      setSelectedRepId(id);
    }
    setIsAddRepOpen(false);
  };

  const handleSaveObType = async (newType: Partial<ObligationType>) => {
    if (onChangeTypes) {
      const id = generateEntityId("ot");
      const created: ObligationType = {
        ...newType,
        id,
        name: newType.name || "",
        designated_for: newType.designated_for || "Both",
        quantity_based: !!newType.quantity_based,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ObligationType;
      await onChangeTypes([...obligationTypes, created]);
      setSelectedObTypeId(id);
    }
    setIsAddObTypeOpen(false);
  };

  const selectedMujtahid = mujtahids.find((m) => m.id === selectedMujtahidId);
  const selectedRep = reps.find((r) => r.id === selectedRepId);
  const selectedObType = obligationTypes.find((o) => o.id === selectedObTypeId);

  const availableReps = reps.filter((r) => r.mujtahid_id === selectedMujtahidId);

  const validateStep1 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!selectedMujtahidId) nextErrors.mujtahid = "Please select or create a Mujtahid";
    if (!selectedObTypeId) nextErrors.obType = t("obligations.wakala.typeRequired");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!selectedRepId) nextErrors.rep = t("obligations.wakala.repRequired");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const totalPercentage = initialDistributions.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0);

  const validateStep3 = (): boolean => {
    if (totalPercentage > 100) {
      setErrors({ dist: t("obligations.wakala.pctExceed", { pct: totalPercentage }) });
      return false;
    }
    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateStep3()) return;

    setSubmitError("");
    setSaving(true);
    try {
      await onSave(
        {
          ...initial,
          mujtahid_representative_id: selectedRepId,
          obligation_type_id: selectedObTypeId,
        },
        initialDistributions.length > 0 ? initialDistributions : undefined,
      );
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : t("obligations.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const addDistributionRow = () => {
    setInitialDistributions([
      ...initialDistributions,
      {
        id: generateEntityId("dist"),
        name: "",
        percentage: 0,
        type: "Income",
      },
    ]);
  };

  const removeDistributionRow = (id: string) => {
    setInitialDistributions(initialDistributions.filter((d) => d.id !== id));
  };

  const updateDistributionRow = (id: string, updates: Partial<InitialDistRow>) => {
    setInitialDistributions(
      initialDistributions.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  };

  const isChildModalOpen = isAddMujtahidOpen || isAddRepOpen || isAddObTypeOpen;

  return (
    <>
      <FormModal
        open={!isChildModalOpen}
        onClose={onClose}
        title={title}
        cancelLabel={step === 1 ? t("common.cancel") : "Back"}
        saveLabel={step === 3 ? t("common.save") : "Next"}
        onSave={async () => {
          if (step === 1) {
            if (validateStep1()) setStep(2);
          } else if (step === 2) {
            if (validateStep2()) setStep(3);
          } else if (step === 3) {
            await handleSave();
          }
        }}
        saving={saving}
        saveDisabled={saving}
        error={
          Object.values(errors).filter(Boolean).concat(submitError ? [submitError] : []).length > 0
            ? Object.values(errors).filter(Boolean).concat(submitError ? [submitError] : [])
            : undefined
        }
      >
        <div className="space-y-5">
          {/* Step Progress Bar Header */}
          <div className="flex items-center justify-between gap-1 rounded-xl bg-muted/40 p-2 text-xs font-semibold text-muted-foreground border border-border/50">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-colors",
                step === 1 ? "bg-primary text-primary-foreground shadow-sm" : step > 1 ? "text-foreground hover:bg-muted" : "opacity-60"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                {step > 1 ? <Check className="h-3 w-3" /> : "1"}
              </span>
              <span>1. Mujtahid & Type</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              disabled={step < 2 && !validateStep1}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-colors",
                step === 2 ? "bg-primary text-primary-foreground shadow-sm" : step > 2 ? "text-foreground hover:bg-muted" : "opacity-60"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                {step > 2 ? <Check className="h-3 w-3" /> : "2"}
              </span>
              <span>2. Representative</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) setStep(3);
              }}
              disabled={step < 3}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-colors",
                step === 3 ? "bg-primary text-primary-foreground shadow-sm" : "opacity-60"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                3
              </span>
              <span>3. Distribution</span>
            </button>
          </div>

          {/* Step 1: Mujtahid & Obligation Type */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div>
                <label htmlFor="wakala-mujtahid" className={FORM_LABEL}>
                  {t("obligations.form.mujtahidLabel")}
                  <RequiredMark />
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormSelect
                      id="wakala-mujtahid"
                      name="mujtahid_id"
                      value={selectedMujtahidId}
                      onChange={(val) => {
                        setSelectedMujtahidId(val);
                        setSelectedRepId(""); // Reset rep selection
                        setErrors((prev) => ({ ...prev, mujtahid: "" }));
                      }}
                      placeholder="Select Mujtahid"
                      options={mujtahids.map((m) => ({ value: m.id, label: m.name }))}
                    />
                  </div>
                  {onChangeMujtahids && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mb-[0px] h-10 w-10 shrink-0"
                      onClick={() => setIsAddMujtahidOpen(true)}
                      aria-label={t("obligations.mujtahids.add")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errors.mujtahid && <p className="mt-1 text-sm font-medium text-destructive">{errors.mujtahid}</p>}
              </div>

              <div>
                <label htmlFor="wakala-type" className={FORM_LABEL}>
                  {t("obligations.wakala.obTypeLabel")}
                  <RequiredMark />
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormSelect
                      id="wakala-type"
                      name="obligation_type_id"
                      value={selectedObTypeId}
                      onChange={(val) => {
                        setSelectedObTypeId(val);
                        setErrors((prev) => ({ ...prev, obType: "" }));
                      }}
                      placeholder={t("obligations.wakala.obTypePlaceholder")}
                      options={obligationTypes.map((o) => ({ value: o.id, label: o.name }))}
                    />
                  </div>
                  {onChangeTypes && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mb-[0px] h-10 w-10 shrink-0"
                      onClick={() => setIsAddObTypeOpen(true)}
                      aria-label={t("obligations.types.add")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errors.obType && <p className="mt-1 text-sm font-medium text-destructive">{errors.obType}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Representative */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                <div className="font-semibold text-primary">Stage 1 Selection:</div>
                <div className="mt-1 flex flex-wrap gap-2 text-foreground">
                  <span className="rounded bg-background px-2 py-0.5 border font-medium">
                    Mujtahid: {selectedMujtahid?.name || "?"}
                  </span>
                  <span className="rounded bg-background px-2 py-0.5 border font-medium">
                    Type: {selectedObType?.name || "?"}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="wakala-rep" className={FORM_LABEL}>
                  {t("obligations.wakala.repLabel")}
                  <RequiredMark />
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormSelect
                      id="wakala-rep"
                      name="mujtahid_representative_id"
                      value={selectedRepId}
                      onChange={(val) => {
                        setSelectedRepId(val);
                        setErrors((prev) => ({ ...prev, rep: "" }));
                      }}
                      placeholder={t("obligations.wakala.repPlaceholder")}
                      options={availableReps.map((rep) => ({
                        value: rep.id,
                        label: rep.name,
                      }))}
                    />
                  </div>
                  {onChangeReps && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mb-[0px] h-10 w-10 shrink-0"
                      onClick={() => setIsAddRepOpen(true)}
                      aria-label={t("obligations.mujtahids.addRep")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {availableReps.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No representative for this Mujtahid yet. Click `+` to add one.
                  </p>
                )}
                {errors.rep && <p className="mt-1 text-sm font-medium text-destructive">{errors.rep}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Distribution Setup */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-1">
                <div className="font-semibold text-muted-foreground">Configuration Summary:</div>
                <div className="flex flex-wrap gap-2 text-foreground font-medium">
                  <span>{selectedObType?.name}</span>
                  <span>•</span>
                  <span>{selectedRep?.name}</span>
                  <span>({selectedMujtahid?.name})</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Initial Distribution Split (Optional)
                  </h4>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full border",
                      totalPercentage === 100
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : totalPercentage > 100
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    )}
                  >
                    Total: {totalPercentage}%
                  </span>
                </div>

                {initialDistributions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic border border-dashed rounded-lg p-3 text-center">
                    No distribution splits added yet. You can save now and add distribution rules later.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {initialDistributions.map((row) => (
                      <div key={row.id} className="flex items-center gap-2 rounded-lg border border-border p-2 bg-background">
                        <Input
                          placeholder="Name (e.g. Saham-e-Imam)"
                          value={row.name}
                          onChange={(e) => updateDistributionRow(row.id, { name: e.target.value })}
                          className="flex-1 text-xs h-9"
                        />
                        <div className="w-20">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="%"
                            value={row.percentage || ""}
                            onChange={(e) => updateDistributionRow(row.id, { percentage: Number(e.target.value) })}
                            className="text-xs h-9"
                          />
                        </div>
                        <FormSelect
                          value={row.type}
                          onChange={(val) => updateDistributionRow(row.id, { type: val as "Income" | "Liability" })}
                          options={[
                            { value: "Income", label: t("obligations.distribution.income") },
                            { value: "Liability", label: t("obligations.distribution.liability") },
                          ]}
                          className="w-28 text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDistributionRow(row.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDistributionRow}
                  className="w-full flex items-center justify-center gap-1.5 text-xs h-9 border-dashed"
                >
                  <Plus className="h-3.5 w-3.5" /> {t("obligations.wakala.addDistribution")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </FormModal>

      {/* Child Modal for creating Mujtahid on the go */}
      {isAddMujtahidOpen && (
        <NameFormModal
          title={t("obligations.mujtahids.addTitle")}
          label={t("obligations.mujtahids.nameLabel")}
          initial={{ name: "" }}
          onSave={handleSaveMujtahid}
          onClose={() => setIsAddMujtahidOpen(false)}
        />
      )}

      {/* Child Modal for creating Representative on the go */}
      {isAddRepOpen && (
        <NameFormModal
          title={t("obligations.mujtahids.repAddTitle")}
          label={t("obligations.mujtahids.repNameLabel")}
          initial={{ name: "" }}
          onSave={handleSaveRep}
          onClose={() => setIsAddRepOpen(false)}
        />
      )}

      {/* Child Modal for creating Obligation Type on the go */}
      {isAddObTypeOpen && (
        <ObligationTypeFormModal
          title={t("obligations.types.addTitle")}
          initial={{ name: "", designated_for: "Both", quantity_based: false }}
          onSave={handleSaveObType}
          onClose={() => setIsAddObTypeOpen(false)}
        />
      )}
    </>
  );
}
