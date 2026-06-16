import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import ObligationModal from "./ObligationModal";

export interface Mujtahid {
  id: string;
  name: string;
}

export interface MujtahidRep {
  id: string;
  mujtahid_id: string;
  name: string;
}

export interface MujtahidManagerProps {
  mujtahids: Mujtahid[];
  reps: MujtahidRep[];
  onChangeMujtahids: (mujtahids: Mujtahid[]) => void;
  onChangeReps: (reps: MujtahidRep[]) => void;
}

interface ModalState {
  mode: "add" | "edit" | "add-rep" | "edit-rep";
  data: Partial<Mujtahid> | Partial<MujtahidRep>;
}

/**
 * MujtahidManager component.
 *
 * @param {MujtahidManagerProps} props
 * @returns {React.ReactElement}
 */
export default function MujtahidManager({ mujtahids, reps, onChangeMujtahids, onChangeReps }: MujtahidManagerProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleSaveMujtahid = (form: Partial<Mujtahid>) => {
    if (modal?.mode === "add") {
      onChangeMujtahids([...mujtahids, { ...form, id: `m${Date.now()}` } as Mujtahid]);
    } else if (modal?.mode === "edit") {
      onChangeMujtahids(mujtahids.map((m) => m.id === form.id ? (form as Mujtahid) : m));
    }
    setModal(null);
  };

  const handleDeleteMujtahid = (id: string) => {
    if (confirm("Delete this Mujtahid? Associated representatives will also be removed.")) {
      onChangeMujtahids(mujtahids.filter((m) => m.id !== id));
      onChangeReps(reps.filter((r) => r.mujtahid_id !== id));
    }
  };

  const handleSaveRep = (form: Partial<MujtahidRep>) => {
    if (modal?.mode === "add-rep") {
      onChangeReps([...reps, { ...form, id: `mr${Date.now()}` } as MujtahidRep]);
    } else if (modal?.mode === "edit-rep") {
      onChangeReps(reps.map((r) => r.id === form.id ? (form as MujtahidRep) : r));
    }
    setModal(null);
  };

  const handleDeleteRep = (id: string) => {
    if (confirm("Delete this representative?")) onChangeReps(reps.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{mujtahids.length} Mujtahid{mujtahids.length !== 1 ? "s" : ""}</p>
        <button type="button" onClick={() => setModal({ mode: "add", data: { name: "" } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Mujtahid
        </button>
      </header>

      <section aria-label="Mujtahids List" className="space-y-2">
        {mujtahids.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-xl border border-border">No Mujtahids configured.</div>
        )}
        {mujtahids.map((m) => {
          const myReps = reps.filter((r) => r.mujtahid_id === m.id);
          const isOpen = expanded[m.id];
          return (
            <article key={m.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <header className="flex items-center justify-between px-4 py-3">
                <button type="button" onClick={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))}
                  aria-expanded={isOpen}
                  className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                  {isOpen ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                  {m.name}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">{myReps.length} rep{myReps.length !== 1 ? "s" : ""}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label={`Add representative for ${m.name}`} onClick={() => setModal({ mode: "add-rep", data: { name: "", mujtahid_id: m.id } })}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
                    <Plus className="w-3 h-3" aria-hidden="true" /> Rep
                  </button>
                  <button type="button" aria-label={`Edit ${m.name}`} onClick={() => setModal({ mode: "edit", data: { ...m } })}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Delete ${m.name}`} onClick={() => handleDeleteMujtahid(m.id)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </header>
              {isOpen && (
                <div className="border-t border-border bg-muted/30">
                  {myReps.length === 0 ? (
                    <p className="px-6 py-3 text-xs text-muted-foreground m-0">No representatives yet.</p>
                  ) : (
                    myReps.map((r) => (
                      <div key={r.id} className="flex items-center justify-between px-6 py-2.5 border-b border-border last:border-0">
                        <span className="text-sm text-foreground">{r.name}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" aria-label={`Edit representative ${r.name}`} onClick={() => setModal({ mode: "edit-rep", data: { ...r } })}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button type="button" aria-label={`Delete representative ${r.name}`} onClick={() => handleDeleteRep(r.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {modal && (modal.mode === "add" || modal.mode === "edit") && (
        <ObligationModal title={modal.mode === "add" ? "Add Mujtahid" : "Edit Mujtahid"} onClose={() => setModal(null)}>
          <NameForm initial={modal.data} onSave={handleSaveMujtahid} onCancel={() => setModal(null)} label="Mujtahid Name" />
        </ObligationModal>
      )}
      {modal && (modal.mode === "add-rep" || modal.mode === "edit-rep") && (
        <ObligationModal title={modal.mode === "add-rep" ? "Add Representative" : "Edit Representative"} onClose={() => setModal(null)}>
          <NameForm initial={modal.data} onSave={handleSaveRep} onCancel={() => setModal(null)} label="Representative Name" />
        </ObligationModal>
      )}
    </div>
  );
}

interface NameFormProps {
  initial: Partial<Mujtahid> | Partial<MujtahidRep>;
  onSave: (form: Partial<Mujtahid> | Partial<MujtahidRep>) => void;
  onCancel: () => void;
  label: string;
}

function NameForm({ initial, onSave, onCancel, label }: NameFormProps) {
  const [form, setForm] = useState({ ...initial });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.name.trim()) { setError("Name is required"); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name-form-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label} *</label>
        <input id="name-form-input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-invalid={!!error} />
        {error && <p className="text-xs text-destructive mt-1" role="alert">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
      </div>
    </form>
  );
}
