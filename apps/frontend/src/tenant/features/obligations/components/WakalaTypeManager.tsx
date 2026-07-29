import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { DISTRIBUTION_TYPES, WakalaType, ObligationDistribution, ObligationType, MujtahidRep, Mujtahid } from '@/lib/data/obligationsData';
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

export type DistributionType = "Income" | "Liability";

export interface WakalaTypeManagerProps {
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  onChangeWakala: (wt: WakalaType[]) => void | Promise<void>;
  onChangeDistributions: (dists: ObligationDistribution[]) => void | Promise<void>;
}

interface ModalState {
  mode: "add" | "edit" | "add-dist" | "edit-dist";
  distMode?: "add" | "edit";
  data: Partial<WakalaType> | Partial<ObligationDistribution>;
}

/**
 * WakalaTypeManager component.
 *
 * @param {WakalaTypeManagerProps} props
 * @returns {React.ReactElement}
 */
export function WakalaTypeManager({ wakalaTypes, distributions, obligationTypes, reps, mujtahids, onChangeWakala, onChangeDistributions }: WakalaTypeManagerProps) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<ModalState | null>(null);
  const emDash = t("obligations.wakala.emDash");

  const distributionTypeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    Income: { label: t("obligations.distribution.income"), cls: SEMANTIC_BADGE.success },
    Liability: { label: t("obligations.distribution.liability"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const getRep = (repId: string) => reps.find((rep) => rep.id === repId);
  const getMujtahid = (mujtahidId: string) => mujtahids.find((mujtahid) => mujtahid.id === mujtahidId);
  const getObType = (obligationTypeId: string) => obligationTypes.find((obligationType) => obligationType.id === obligationTypeId);

  const getDistributions = (wakalaTypeId: string) => distributions.filter((distribution) => distribution.wakala_type_id === wakalaTypeId);

  const totalPct = (wakalaTypeId: string) =>
    getDistributions(wakalaTypeId).reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0);

  const handleSaveWakala = async (form: Partial<WakalaType>) => {
    if (modal?.mode === "add") {
      await onChangeWakala([...wakalaTypes, { ...form, id: `wt${Date.now()}` } as WakalaType]);
    } else if (modal?.mode === "edit") {
      await onChangeWakala(wakalaTypes.map((wakalaType) => wakalaType.id === form.id ? (form as WakalaType) : wakalaType));
    }
    setModal(null);
  };

  const handleDeleteWakala = async (wakalaTypeId: string) => {
    if (!confirm(t("obligations.wakala.deleteConfirm"))) return;
    await onChangeWakala(wakalaTypes.filter((wakalaType) => wakalaType.id !== wakalaTypeId));
    await onChangeDistributions(distributions.filter((distribution) => distribution.wakala_type_id !== wakalaTypeId));
  };

  const handleSaveDist = async (form: Partial<ObligationDistribution>) => {
    const existing = getDistributions(form.wakala_type_id!);
    const otherDistributions = existing.filter((distribution) => distribution.id !== form.id);
    const newTotal = otherDistributions.reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0) + parseFloat(String(form.percentage ?? 0));
    if (newTotal > 100) {
      alert(t("obligations.wakala.pctExceed", { pct: newTotal }));
      return;
    }
    if (modal?.distMode === "add") {
      await onChangeDistributions([...distributions, { ...form, id: `od${Date.now()}` } as ObligationDistribution]);
    } else if (modal?.distMode === "edit") {
      await onChangeDistributions(distributions.map((distribution) => distribution.id === form.id ? (form as ObligationDistribution) : distribution));
    }
    setModal(null);
  };

  const handleDeleteDist = async (distributionId: string) => {
    if (!confirm(t("obligations.wakala.distDeleteConfirm"))) return;
    await onChangeDistributions(distributions.filter((distribution) => distribution.id !== distributionId));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{t("obligations.wakala.count", { count: wakalaTypes.length })}</p>
        <Button type="button" onClick={() => setModal({ mode: "add", data: { mujtahid_representative_id: reps[0]?.id || "", obligation_type_id: obligationTypes[0]?.id || "" } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.wakala.add")}
        </Button>
      </header>

      <section aria-label={t("obligations.wakala.listAria")} className="space-y-3">
        {wakalaTypes.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-xl border border-border">{t("obligations.wakala.empty")}</div>
        )}
        {wakalaTypes.map((wakalaType) => {
          const rep = getRep(wakalaType.mujtahid_representative_id);
          const mujtahid = rep ? getMujtahid(rep.mujtahid_id) : null;
          const obligationType = getObType(wakalaType.obligation_type_id);
          const wakalaDistributions = getDistributions(wakalaType.id);
          const total = totalPct(wakalaType.id);
          const isComplete = Math.abs(total - 100) < 0.01;
          const typeName = obligationType?.name || emDash;

          return (
            <Card key={wakalaType.id} accentColor="primary" className="group/wakala">
              <header className="flex items-start justify-between px-5 py-3 border-b border-border/40 pl-5.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground m-0">{typeName}</h3>
                    <span className="text-[10px] text-muted-foreground">{t("obligations.wakala.via")}</span>
                    <span className="text-sm font-semibold text-foreground">{rep?.name || emDash}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 m-0">{t("obligations.wakala.mujtahidLabel", { name: mujtahid?.name || emDash })}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span aria-label={t("obligations.wakala.totalPctAria", { pct: total.toFixed(0) })}>
                    <StatusBadge
                      status={isComplete ? "complete" : "incomplete"}
                      size="sm"
                      config={{
                        complete: { label: `${total.toFixed(0)}%`, cls: SEMANTIC_BADGE.success },
                        incomplete: { label: `${total.toFixed(0)}%`, cls: SEMANTIC_BADGE.warning },
                      }}
                    />
                  </span>
                  <Button type="button" aria-label={t("obligations.wakala.editAria", { name: typeName })} onClick={() => setModal({ mode: "edit", data: { ...wakalaType } })}
                    variant="ghost"
                    size="icon"
                    className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                  <Button type="button" aria-label={t("obligations.wakala.deleteAria", { name: typeName })} onClick={() => handleDeleteWakala(wakalaType.id)}
                    variant="ghost"
                    size="icon"
                    className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </header>

              <div className="bg-muted/20">
                {!isComplete && total > 0 && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-warning/10 border-b border-warning/20 text-xs text-warning" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.wakala.incompleteAlert", { pct: total.toFixed(1) })}
                  </div>
                )}
                {wakalaDistributions.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground m-0">{t("obligations.wakala.noDistributions")}</p>
                ) : (
                  <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-xs">
                    <caption className="sr-only">{t("obligations.wakala.distTableCaption")}</caption>
                    <thead className="border-b border-border">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left font-semibold text-muted-foreground">{t("obligations.wakala.colName")}</th>
                        <th scope="col" className="px-4 py-2 text-left font-semibold text-muted-foreground">{t("obligations.wakala.colType")}</th>
                        <th scope="col" className="px-4 py-2 text-left font-semibold text-muted-foreground">{t("obligations.wakala.colPct")}</th>
                        <th scope="col" className="px-4 py-2 text-right font-semibold text-muted-foreground"><span className="sr-only">{t("obligations.wakala.colActions")}</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {wakalaDistributions.map((distribution) => (
                        <tr key={distribution.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium text-foreground">{distribution.name}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                          </td>
                          <td className="px-4 py-2 font-mono font-semibold text-foreground">{distribution.percentage}%</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button type="button" aria-label={t("obligations.wakala.distEditAria", { name: distribution.name })} onClick={() => setModal({ mode: "edit-dist", distMode: "edit", data: { ...distribution } })}
                                variant="ghost"
                                size="icon"
                                className="rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                                <Pencil className="w-3 h-3" aria-hidden="true" />
                              </Button>
                              <Button type="button" aria-label={t("obligations.wakala.distDeleteAria", { name: distribution.name })} onClick={() => handleDeleteDist(distribution.id)}
                                variant="ghost"
                                size="icon"
                                className="rounded hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
                <div className="px-4 py-2 border-t border-border">
                  <Button type="button" onClick={() => setModal({ mode: "add-dist", distMode: "add", data: { name: "", percentage: 0, wakala_type_id: wakalaType.id, type: "Liability" } })}
                    variant="ghost"
                    className="flex items-center gap-1 h-auto p-0 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-transparent shadow-none transition-colors">
                    <Plus className="w-3 h-3" aria-hidden="true" /> {t("obligations.wakala.addDistribution")}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {modal && (modal.mode === "add" || modal.mode === "edit") ? (
        <WakalaFormModal
          title={modal.mode === "add" ? t("obligations.wakala.addTitle") : t("obligations.wakala.editTitle")}
          initial={modal.data}
          reps={reps}
          mujtahids={mujtahids}
          obligationTypes={obligationTypes}
          onSave={handleSaveWakala}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal && (modal.mode === "add-dist" || modal.mode === "edit-dist") ? (
        <DistributionFormModal
          title={modal.distMode === "add" ? t("obligations.wakala.distAddTitle") : t("obligations.wakala.distEditTitle")}
          initial={modal.data}
          onSave={handleSaveDist}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

interface WakalaFormModalProps {
  title: string;
  initial: Partial<WakalaType>;
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  obligationTypes: ObligationType[];
  onSave: (form: Partial<WakalaType>) => void;
  onClose: () => void;
}

function WakalaFormModal({ initial, reps, mujtahids, obligationTypes, onSave, onClose, title }: WakalaFormModalProps) {
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

interface DistributionFormModalProps {
  title: string;
  initial: Partial<ObligationDistribution>;
  onSave: (form: Partial<ObligationDistribution>) => void;
  onClose: () => void;
}

function DistributionFormModal({ initial, onSave, onClose, title }: DistributionFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!form.name?.trim()) nextErrors.name = t("obligations.mujtahids.nameRequired");
    if (!form.percentage || isNaN(Number(form.percentage)) || Number(form.percentage) <= 0 || Number(form.percentage) > 100) {
      nextErrors.pct = t("obligations.wakala.pctInvalid");
    }
    return nextErrors;
  };

  const handleSave = (): void => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    onSave({ ...form, percentage: Number(form.percentage) });
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
          <label htmlFor="dist-name" className={FORM_LABEL}>{t("obligations.wakala.distName")} *</label>
          <Input
            id="dist-name"
            value={form.name || ""}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={FORM_INPUT}
            aria-invalid={!!errors.name}
          />
        </div>
        <div>
          <label htmlFor="dist-type" className={FORM_LABEL}>{t("obligations.wakala.distType")} *</label>
          <FormSelect
            id="dist-type"
            value={form.type || ""}
            onChange={(val) => setForm({ ...form, type: val as DistributionType })}
            options={DISTRIBUTION_TYPES.map((type) => ({
              value: type,
              label: type === "Income" ? t("obligations.distribution.income") : t("obligations.distribution.liability"),
            }))}
          />
        </div>
        <div>
          <label htmlFor="dist-pct" className={FORM_LABEL}>{t("obligations.wakala.distPct")} *</label>
          <Input
            id="dist-pct"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={form.percentage || ""}
            onChange={(event) => setForm({ ...form, percentage: parseFloat(event.target.value) })}
            className={FORM_INPUT}
            aria-invalid={!!errors.pct}
          />
        </div>
      </div>
    </FormModal>
  );
}
