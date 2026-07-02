import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
export function MujtahidManager({ mujtahids, reps, onChangeMujtahids, onChangeReps }: MujtahidManagerProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleSaveMujtahid = (form: Partial<Mujtahid>) => {
    if (modal?.mode === "add") {
      onChangeMujtahids([...mujtahids, { ...form, id: `m${Date.now()}` } as Mujtahid]);
    } else if (modal?.mode === "edit") {
      onChangeMujtahids(mujtahids.map((mujtahid) => mujtahid.id === form.id ? (form as Mujtahid) : mujtahid));
    }
    setModal(null);
  };

  const handleDeleteMujtahid = (mujtahidId: string) => {
    if (confirm("Delete this Mujtahid? Associated representatives will also be removed.")) {
      onChangeMujtahids(mujtahids.filter((mujtahid) => mujtahid.id !== mujtahidId));
      onChangeReps(reps.filter((representative) => representative.mujtahid_id !== mujtahidId));
    }
  };

  const handleSaveRep = (form: Partial<MujtahidRep>) => {
    if (modal?.mode === "add-rep") {
      onChangeReps([...reps, { ...form, id: `mr${Date.now()}` } as MujtahidRep]);
    } else if (modal?.mode === "edit-rep") {
      onChangeReps(reps.map((representative) => representative.id === form.id ? (form as MujtahidRep) : representative));
    }
    setModal(null);
  };

  const handleDeleteRep = (representativeId: string) => {
    if (confirm("Delete this representative?")) onChangeReps(reps.filter((representative) => representative.id !== representativeId));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{mujtahids.length} Mujtahid{mujtahids.length !== 1 ? "s" : ""}</p>
        <Button type="button" onClick={() => setModal({ mode: "add", data: { name: "" } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Mujtahid
        </Button>
      </header>

      <section aria-label="Mujtahids List" className="space-y-2">
        {mujtahids.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-xl border border-border">No Mujtahids configured.</div>
        )}
        {mujtahids.map((mujtahid) => {
          const mujtahidReps = reps.filter((representative) => representative.mujtahid_id === mujtahid.id);
          const isOpen = expanded[mujtahid.id];
          return (
            <article key={mujtahid.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <header className="flex items-center justify-between px-4 py-3">
                <Button type="button" onClick={() => setExpanded((expandedById) => ({ ...expandedById, [mujtahid.id]: !expandedById[mujtahid.id] }))}
                  aria-expanded={isOpen}
                  variant="ghost"
                  className="flex items-center gap-2 h-auto p-0 text-sm font-semibold text-foreground hover:text-primary hover:bg-transparent shadow-none transition-colors">
                  {isOpen ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                  {mujtahid.name}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">{mujtahidReps.length} rep{mujtahidReps.length !== 1 ? "s" : ""}</span>
                </Button>
                <div className="flex items-center gap-1">
                  <Button type="button" aria-label={`Add representative for ${mujtahid.name}`} onClick={() => setModal({ mode: "add-rep", data: { name: "", mujtahid_id: mujtahid.id } })}
                    variant="ghost"
                    className="flex items-center gap-1 h-auto px-2 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 shadow-none transition-colors">
                    <Plus className="w-3 h-3" aria-hidden="true" /> Rep
                  </Button>
                  <Button type="button" aria-label={`Edit ${mujtahid.name}`} onClick={() => setModal({ mode: "edit", data: { ...mujtahid } })}
                    variant="ghost"
                    className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                  <Button type="button" aria-label={`Delete ${mujtahid.name}`} onClick={() => handleDeleteMujtahid(mujtahid.id)}
                    variant="ghost"
                    className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </header>
              {isOpen && (
                <div className="border-t border-border bg-muted/30">
                  {mujtahidReps.length === 0 ? (
                    <p className="px-6 py-3 text-xs text-muted-foreground m-0">No representatives yet.</p>
                  ) : (
                    mujtahidReps.map((representative) => (
                      <div key={representative.id} className="flex items-center justify-between px-6 py-2.5 border-b border-border last:border-0">
                        <span className="text-sm text-foreground">{representative.name}</span>
                        <div className="flex items-center gap-1">
                          <Button type="button" aria-label={`Edit representative ${representative.name}`} onClick={() => setModal({ mode: "edit-rep", data: { ...representative } })}
                            variant="ghost"
                            className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                            <Pencil className="w-3 h-3" aria-hidden="true" />
                          </Button>
                          <Button type="button" aria-label={`Delete representative ${representative.name}`} onClick={() => handleDeleteRep(representative.id)}
                            variant="ghost"
                            className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </Button>
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

      {modal && (modal.mode === "add" || modal.mode === "edit") ? (
        <NameFormModal
          title={modal.mode === "add" ? "Add Mujtahid" : "Edit Mujtahid"}
          label="Mujtahid Name"
          initial={modal.data}
          onSave={handleSaveMujtahid}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal && (modal.mode === "add-rep" || modal.mode === "edit-rep") ? (
        <NameFormModal
          title={modal.mode === "add-rep" ? "Add Representative" : "Edit Representative"}
          label="Representative Name"
          initial={modal.data}
          onSave={handleSaveRep}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

interface NameFormModalProps {
  title: string;
  initial: Partial<Mujtahid> | Partial<MujtahidRep>;
  onSave: (form: Partial<Mujtahid> | Partial<MujtahidRep>) => void;
  onClose: () => void;
  label: string;
}

function NameFormModal({ initial, onSave, onClose, label, title }: NameFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [error, setError] = useState("");

  const handleSave = (): void => {
    if (!form.name || !form.name.trim()) {
      setError("Name is required");
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
      error={error || undefined}
    >
      <div>
        <label htmlFor="name-form-input" className={FORM_LABEL}>{label} *</label>
        <Input
          id="name-form-input"
          value={form.name || ""}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className={FORM_INPUT}
          aria-invalid={!!error}
        />
      </div>
    </FormModal>
  );
}
