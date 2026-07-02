import React, { useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { DISTRIBUTION_TYPES, WakalaType, ObligationDistribution, ObligationType, MujtahidRep, Mujtahid } from '@/lib/data/obligationsData';
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";

export type DistributionType = "Income" | "Liability";

export interface WakalaTypeManagerProps {
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  onChangeWakala: (wt: WakalaType[]) => void;
  onChangeDistributions: (dists: ObligationDistribution[]) => void;
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
  const [modal, setModal] = useState<ModalState | null>(null);

  const getRep = (repId: string) => reps.find((rep) => rep.id === repId);
  const getMujtahid = (mujtahidId: string) => mujtahids.find((mujtahid) => mujtahid.id === mujtahidId);
  const getObType = (obligationTypeId: string) => obligationTypes.find((obligationType) => obligationType.id === obligationTypeId);

  const getDistributions = (wakalaTypeId: string) => distributions.filter((distribution) => distribution.wakala_type_id === wakalaTypeId);

  const totalPct = (wakalaTypeId: string) =>
    getDistributions(wakalaTypeId).reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0);

  const handleSaveWakala = (form: Partial<WakalaType>) => {
    if (modal?.mode === "add") {
      onChangeWakala([...wakalaTypes, { ...form, id: `wt${Date.now()}` } as WakalaType]);
    } else if (modal?.mode === "edit") {
      onChangeWakala(wakalaTypes.map((wakalaType) => wakalaType.id === form.id ? (form as WakalaType) : wakalaType));
    }
    setModal(null);
  };

  const handleDeleteWakala = (wakalaTypeId: string) => {
    if (confirm("Delete this Wakala Type? Associated distributions will also be removed.")) {
      onChangeWakala(wakalaTypes.filter((wakalaType) => wakalaType.id !== wakalaTypeId));
      onChangeDistributions(distributions.filter((distribution) => distribution.wakala_type_id !== wakalaTypeId));
    }
  };

  const handleSaveDist = (form: Partial<ObligationDistribution>) => {
    const existing = getDistributions(form.wakala_type_id!);
    const otherDistributions = existing.filter((distribution) => distribution.id !== form.id);
    const newTotal = otherDistributions.reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0) + parseFloat(String(form.percentage ?? 0));
    if (newTotal > 100) {
      alert(`Total distribution percentage cannot exceed 100%. Current total would be ${newTotal}%.`);
      return;
    }
    if (modal?.distMode === "add") {
      onChangeDistributions([...distributions, { ...form, id: `od${Date.now()}` } as ObligationDistribution]);
    } else if (modal?.distMode === "edit") {
      onChangeDistributions(distributions.map((distribution) => distribution.id === form.id ? (form as ObligationDistribution) : distribution));
    }
    setModal(null);
  };

  const handleDeleteDist = (distributionId: string) => {
    if (confirm("Delete this distribution?")) onChangeDistributions(distributions.filter((distribution) => distribution.id !== distributionId));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{wakalaTypes.length} Wakala Type{wakalaTypes.length !== 1 ? "s" : ""}</p>
        <Button type="button" onClick={() => setModal({ mode: "add", data: { mujtahid_representative_id: reps[0]?.id || "", obligation_type_id: obligationTypes[0]?.id || "" } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Wakala Type
        </Button>
      </header>

      <section aria-label="Wakala Types List" className="space-y-3">
        {wakalaTypes.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-xl border border-border">No Wakala Types configured.</div>
        )}
        {wakalaTypes.map((wakalaType) => {
          const rep = getRep(wakalaType.mujtahid_representative_id);
          const mujtahid = rep ? getMujtahid(rep.mujtahid_id) : null;
          const obligationType = getObType(wakalaType.obligation_type_id);
          const wakalaDistributions = getDistributions(wakalaType.id);
          const total = totalPct(wakalaType.id);
          const isComplete = Math.abs(total - 100) < 0.01;

          return (
            <article key={wakalaType.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <header className="flex items-start justify-between px-4 py-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground m-0">{obligationType?.name || "—"}</h3>
                    <span className="text-[10px] text-muted-foreground">via</span>
                    <span className="text-sm font-semibold text-foreground">{rep?.name || "—"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 m-0">Mujtahid: {mujtahid?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isComplete ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`} aria-label={`Total distribution is ${total.toFixed(0)} percent`}>
                    {total.toFixed(0)}%
                  </span>
                  <Button type="button" aria-label={`Edit Wakala Type for ${obligationType?.name}`} onClick={() => setModal({ mode: "edit", data: { ...wakalaType } })}
                    variant="ghost"
                    className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                  <Button type="button" aria-label={`Delete Wakala Type for ${obligationType?.name}`} onClick={() => handleDeleteWakala(wakalaType.id)}
                    variant="ghost"
                    className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </header>

              {/* Distributions */}
              <div className="bg-muted/20">
                {!isComplete && total > 0 && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-warning/10 border-b border-warning/20 text-xs text-warning" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> Distributions total {total.toFixed(1)}% — must equal 100%
                  </div>
                )}
                {wakalaDistributions.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground m-0">No distributions. Add distribution entries to reach 100%.</p>
                ) : (
                  <table className="w-full text-xs">
                    <caption className="sr-only">Distributions for Wakala Type</caption>
                    <thead className="border-b border-border">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left font-semibold text-muted-foreground">Name</th>
                        <th scope="col" className="px-4 py-2 text-left font-semibold text-muted-foreground">Type</th>
                        <th scope="col" className="px-4 py-2 text-left font-semibold text-muted-foreground">%</th>
                        <th scope="col" className="px-4 py-2 text-right font-semibold text-muted-foreground"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {wakalaDistributions.map((distribution) => (
                        <tr key={distribution.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium text-foreground">{distribution.name}</td>
                          <td className="px-4 py-2">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${distribution.type === "Income" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}>
                              {distribution.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono font-semibold text-foreground">{distribution.percentage}%</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button type="button" aria-label={`Edit distribution ${distribution.name}`} onClick={() => setModal({ mode: "edit-dist", distMode: "edit", data: { ...distribution } })}
                                variant="ghost"
                                className="h-auto p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                                <Pencil className="w-3 h-3" aria-hidden="true" />
                              </Button>
                              <Button type="button" aria-label={`Delete distribution ${distribution.name}`} onClick={() => handleDeleteDist(distribution.id)}
                                variant="ghost"
                                className="h-auto p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="px-4 py-2 border-t border-border">
                  <Button type="button" onClick={() => setModal({ mode: "add-dist", distMode: "add", data: { name: "", percentage: 0, wakala_type_id: wakalaType.id, type: "Liability" } })}
                    variant="ghost"
                    className="flex items-center gap-1 h-auto p-0 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-transparent shadow-none transition-colors">
                    <Plus className="w-3 h-3" aria-hidden="true" /> Add Distribution
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {modal && (modal.mode === "add" || modal.mode === "edit") ? (
        <WakalaFormModal
          title={modal.mode === "add" ? "Add Wakala Type" : "Edit Wakala Type"}
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
          title={modal.distMode === "add" ? "Add Distribution" : "Edit Distribution"}
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
    if (!form.mujtahid_representative_id) nextErrors.rep = "Representative is required";
    if (!form.obligation_type_id) nextErrors.obType = "Obligation type is required";
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
          <label htmlFor="wakala-rep" className={FORM_LABEL}>Mujtahid Representative *</label>
          <FormSelect
            id="wakala-rep"
            value={form.mujtahid_representative_id || ""}
            onChange={(val) => setForm({ ...form, mujtahid_representative_id: val })}
            placeholder="Select representative…"
            options={reps.map((rep) => {
              const mujtahid = getMujtahidForRep(rep.id);
              return { value: rep.id, label: `${rep.name} (${mujtahid?.name || "?"})` };
            })}
          />
        </div>
        <div>
          <label htmlFor="wakala-type" className={FORM_LABEL}>Obligation Type *</label>
          <FormSelect
            id="wakala-type"
            value={form.obligation_type_id || ""}
            onChange={(val) => setForm({ ...form, obligation_type_id: val })}
            placeholder="Select type…"
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
    if (!form.name?.trim()) nextErrors.name = "Name is required";
    if (!form.percentage || isNaN(Number(form.percentage)) || Number(form.percentage) <= 0 || Number(form.percentage) > 100) {
      nextErrors.pct = "Enter a valid percentage (1–100)";
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
          <label htmlFor="dist-name" className={FORM_LABEL}>Name *</label>
          <Input
            id="dist-name"
            value={form.name || ""}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={FORM_INPUT}
            aria-invalid={!!errors.name}
          />
        </div>
        <div>
          <label htmlFor="dist-type" className={FORM_LABEL}>Type *</label>
          <FormSelect
            id="dist-type"
            value={form.type || ""}
            onChange={(val) => setForm({ ...form, type: val as DistributionType })}
            options={DISTRIBUTION_TYPES}
          />
        </div>
        <div>
          <label htmlFor="dist-pct" className={FORM_LABEL}>Percentage (%) *</label>
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
