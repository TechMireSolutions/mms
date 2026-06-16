import React, { useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { DISTRIBUTION_TYPES, WakalaType, ObligationDistribution, ObligationType, MujtahidRep, Mujtahid } from '@/lib/data/obligationsData';
import ObligationModal from "./ObligationModal";

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
export default function WakalaTypeManager({ wakalaTypes, distributions, obligationTypes, reps, mujtahids, onChangeWakala, onChangeDistributions }: WakalaTypeManagerProps) {
  const [modal, setModal] = useState<ModalState | null>(null);

  const getRep = (id: string) => reps.find((r) => r.id === id);
  const getMujtahid = (id: string) => mujtahids.find((m) => m.id === id);
  const getObType = (id: string) => obligationTypes.find((t) => t.id === id);

  const getDistributions = (wtId: string) => distributions.filter((d) => d.wakala_type_id === wtId);

  const totalPct = (wtId: string) =>
    getDistributions(wtId).reduce((sum, d) => sum + parseFloat(String(d.percentage ?? 0)), 0);

  const handleSaveWakala = (form: Partial<WakalaType>) => {
    if (modal?.mode === "add") {
      onChangeWakala([...wakalaTypes, { ...form, id: `wt${Date.now()}` } as WakalaType]);
    } else if (modal?.mode === "edit") {
      onChangeWakala(wakalaTypes.map((w) => w.id === form.id ? (form as WakalaType) : w));
    }
    setModal(null);
  };

  const handleDeleteWakala = (id: string) => {
    if (confirm("Delete this Wakala Type? Associated distributions will also be removed.")) {
      onChangeWakala(wakalaTypes.filter((w) => w.id !== id));
      onChangeDistributions(distributions.filter((d) => d.wakala_type_id !== id));
    }
  };

  const handleSaveDist = (form: Partial<ObligationDistribution>) => {
    const existing = getDistributions(form.wakala_type_id!);
    const others = existing.filter((d) => d.id !== form.id);
    const newTotal = others.reduce((s, d) => s + parseFloat(String(d.percentage ?? 0)), 0) + parseFloat(String(form.percentage ?? 0));
    if (newTotal > 100) {
      alert(`Total distribution percentage cannot exceed 100%. Current total would be ${newTotal}%.`);
      return;
    }
    if (modal?.distMode === "add") {
      onChangeDistributions([...distributions, { ...form, id: `od${Date.now()}` } as ObligationDistribution]);
    } else if (modal?.distMode === "edit") {
      onChangeDistributions(distributions.map((d) => d.id === form.id ? (form as ObligationDistribution) : d));
    }
    setModal(null);
  };

  const handleDeleteDist = (id: string) => {
    if (confirm("Delete this distribution?")) onChangeDistributions(distributions.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{wakalaTypes.length} Wakala Type{wakalaTypes.length !== 1 ? "s" : ""}</p>
        <button type="button" onClick={() => setModal({ mode: "add", data: { mujtahid_representative_id: reps[0]?.id || "", obligation_type_id: obligationTypes[0]?.id || "" } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Wakala Type
        </button>
      </header>

      <section aria-label="Wakala Types List" className="space-y-3">
        {wakalaTypes.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-xl border border-border">No Wakala Types configured.</div>
        )}
        {wakalaTypes.map((w) => {
          const rep = getRep(w.mujtahid_representative_id);
          const mujtahid = rep ? getMujtahid(rep.mujtahid_id) : null;
          const obType = getObType(w.obligation_type_id);
          const dists = getDistributions(w.id);
          const total = totalPct(w.id);
          const isComplete = Math.abs(total - 100) < 0.01;

          return (
            <article key={w.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <header className="flex items-start justify-between px-4 py-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground m-0">{obType?.name || "—"}</h3>
                    <span className="text-[10px] text-muted-foreground">via</span>
                    <span className="text-sm font-semibold text-foreground">{rep?.name || "—"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 m-0">Mujtahid: {mujtahid?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`} aria-label={`Total distribution is ${total.toFixed(0)} percent`}>
                    {total.toFixed(0)}%
                  </span>
                  <button type="button" aria-label={`Edit Wakala Type for ${obType?.name}`} onClick={() => setModal({ mode: "edit", data: { ...w } })}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Delete Wakala Type for ${obType?.name}`} onClick={() => handleDeleteWakala(w.id)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </header>

              {/* Distributions */}
              <div className="bg-muted/20">
                {!isComplete && total > 0 && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> Distributions total {total.toFixed(1)}% — must equal 100%
                  </div>
                )}
                {dists.length === 0 ? (
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
                      {dists.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium text-foreground">{d.name}</td>
                          <td className="px-4 py-2">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${d.type === "Income" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                              {d.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono font-semibold text-foreground">{d.percentage}%</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" aria-label={`Edit distribution ${d.name}`} onClick={() => setModal({ mode: "edit-dist", distMode: "edit", data: { ...d } })}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <button type="button" aria-label={`Delete distribution ${d.name}`} onClick={() => handleDeleteDist(d.id)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="px-4 py-2 border-t border-border">
                  <button type="button" onClick={() => setModal({ mode: "add-dist", distMode: "add", data: { name: "", percentage: 0, wakala_type_id: w.id, type: "Liability" } })}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    <Plus className="w-3 h-3" aria-hidden="true" /> Add Distribution
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Wakala modal */}
      {modal && (modal.mode === "add" || modal.mode === "edit") && (
        <ObligationModal title={modal.mode === "add" ? "Add Wakala Type" : "Edit Wakala Type"} onClose={() => setModal(null)}>
          <WakalaForm initial={modal.data} reps={reps} mujtahids={mujtahids} obligationTypes={obligationTypes}
            onSave={handleSaveWakala} onCancel={() => setModal(null)} />
        </ObligationModal>
      )}

      {/* Distribution modal */}
      {modal && (modal.mode === "add-dist" || modal.mode === "edit-dist") && (
        <ObligationModal title={modal.distMode === "add" ? "Add Distribution" : "Edit Distribution"} onClose={() => setModal(null)}>
          <DistributionForm initial={modal.data} onSave={handleSaveDist} onCancel={() => setModal(null)} />
        </ObligationModal>
      )}
    </div>
  );
}

interface WakalaFormProps {
  initial: Partial<WakalaType>;
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  obligationTypes: ObligationType[];
  onSave: (form: Partial<WakalaType>) => void;
  onCancel: () => void;
}

/**
 * WakalaForm component.
 * @param {WakalaFormProps} props
 */
function WakalaForm({ initial, reps, mujtahids, obligationTypes, onSave, onCancel }: WakalaFormProps) {
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getMujtahidForRep = (repId: string) => {
    const rep = reps.find((r) => r.id === repId);
    return rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null;
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.mujtahid_representative_id) e.rep = "Representative is required";
    if (!form.obligation_type_id) e.obType = "Obligation type is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="wakala-rep" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mujtahid Representative *</label>
        <select id="wakala-rep" value={form.mujtahid_representative_id} onChange={(e) => setForm({ ...form, mujtahid_representative_id: e.target.value })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-invalid={!!errors.rep}>
          <option value="">Select representative…</option>
          {reps.map((r) => {
            const m = getMujtahidForRep(r.id);
            return <option key={r.id} value={r.id}>{r.name} ({m?.name || "?"})</option>;
          })}
        </select>
        {errors.rep && <p className="text-xs text-destructive mt-1" role="alert">{errors.rep}</p>}
      </div>
      <div>
        <label htmlFor="wakala-type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Obligation Type *</label>
        <select id="wakala-type" value={form.obligation_type_id} onChange={(e) => setForm({ ...form, obligation_type_id: e.target.value })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-invalid={!!errors.obType}>
          <option value="">Select type…</option>
          {obligationTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {errors.obType && <p className="text-xs text-destructive mt-1" role="alert">{errors.obType}</p>}
      </div>
      <footer className="flex justify-end gap-2 pt-2 border-t border-border mt-4">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
      </footer>
    </form>
  );
}

interface DistributionFormProps {
  initial: Partial<ObligationDistribution>;
  onSave: (form: Partial<ObligationDistribution>) => void;
  onCancel: () => void;
}

/**
 * DistributionForm component.
 * @param {DistributionFormProps} props
 */
function DistributionForm({ initial, onSave, onCancel }: DistributionFormProps) {
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.percentage || isNaN(Number(form.percentage)) || Number(form.percentage) <= 0 || Number(form.percentage) > 100)
      e.pct = "Enter a valid percentage (1–100)";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSave({ ...form, percentage: Number(form.percentage) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="dist-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</label>
        <input id="dist-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
          aria-invalid={!!errors.name} />
        {errors.name && <p className="text-xs text-destructive mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="dist-type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type *</label>
        <select id="dist-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DistributionType })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
          {DISTRIBUTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="dist-pct" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Percentage (%) *</label>
        <input id="dist-pct" type="number" min="0.01" max="100" step="0.01" value={form.percentage || ""}
          onChange={(e) => setForm({ ...form, percentage: parseFloat(e.target.value) })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
          aria-invalid={!!errors.pct} />
        {errors.pct && <p className="text-xs text-destructive mt-1" role="alert">{errors.pct}</p>}
      </div>
      <footer className="flex justify-end gap-2 pt-2 border-t border-border mt-4">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
      </footer>
    </form>
  );
}
