import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Card } from "@/components/ui/card";
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
  onChangeMujtahids: (mujtahids: Mujtahid[]) => void | Promise<void>;
  onChangeReps: (reps: MujtahidRep[]) => void | Promise<void>;
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
  const { t } = useTranslation();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleSaveMujtahid = async (form: Partial<Mujtahid>) => {
    if (modal?.mode === "add") {
      await onChangeMujtahids([...mujtahids, { ...form, id: `m${Date.now()}` } as Mujtahid]);
    } else if (modal?.mode === "edit") {
      await onChangeMujtahids(mujtahids.map((mujtahid) => mujtahid.id === form.id ? (form as Mujtahid) : mujtahid));
    }
    setModal(null);
  };

  const handleDeleteMujtahid = async (mujtahidId: string) => {
    if (!confirm(t("obligations.mujtahids.deleteConfirm"))) return;
    await onChangeMujtahids(mujtahids.filter((mujtahid) => mujtahid.id !== mujtahidId));
    await onChangeReps(reps.filter((representative) => representative.mujtahid_id !== mujtahidId));
  };

  const handleSaveRep = async (form: Partial<MujtahidRep>) => {
    if (modal?.mode === "add-rep") {
      await onChangeReps([...reps, { ...form, id: `mr${Date.now()}` } as MujtahidRep]);
    } else if (modal?.mode === "edit-rep") {
      await onChangeReps(reps.map((representative) => representative.id === form.id ? (form as MujtahidRep) : representative));
    }
    setModal(null);
  };

  const handleDeleteRep = async (representativeId: string) => {
    if (!confirm(t("obligations.mujtahids.repDeleteConfirm"))) return;
    await onChangeReps(reps.filter((representative) => representative.id !== representativeId));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{t("obligations.mujtahids.count", { count: mujtahids.length })}</p>
        <Button type="button" onClick={() => setModal({ mode: "add", data: { name: "" } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.mujtahids.add")}
        </Button>
      </header>

      <section aria-label={t("obligations.mujtahids.listAria")} className="space-y-2">
        {mujtahids.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-xl border border-border">{t("obligations.mujtahids.empty")}</div>
        )}
        {mujtahids.map((mujtahid) => {
          const mujtahidReps = reps.filter((representative) => representative.mujtahid_id === mujtahid.id);
          const isOpen = expanded[mujtahid.id];
          return (
            <Card key={mujtahid.id} accentColor="primary" className="group/mujtahid">
              <header className="flex items-center justify-between px-5 py-3 pl-5.5">
                <Button type="button" onClick={() => setExpanded((expandedById) => ({ ...expandedById, [mujtahid.id]: !expandedById[mujtahid.id] }))}
                  aria-expanded={isOpen}
                  variant="ghost"
                  className="flex items-center gap-2 min-h-11 h-auto px-1 text-sm font-semibold text-foreground hover:text-primary hover:bg-transparent shadow-none transition-colors">
                  {isOpen ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                  {mujtahid.name}
                  <span className="text-xs font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">{t("obligations.mujtahids.repsCount", { count: mujtahidReps.length })}</span>
                </Button>
                <div className="flex items-center gap-1">
                  <Button type="button" aria-label={t("obligations.mujtahids.addRepAria", { name: mujtahid.name })} onClick={() => setModal({ mode: "add-rep", data: { name: "", mujtahid_id: mujtahid.id } })}
                    variant="ghost"
                    className="flex min-h-11 items-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 shadow-none transition-colors">
                    <Plus className="w-3 h-3" aria-hidden="true" /> {t("obligations.mujtahids.addRep")}
                  </Button>
                  <Button type="button" aria-label={t("obligations.mujtahids.editAria", { name: mujtahid.name })} onClick={() => setModal({ mode: "edit", data: { ...mujtahid } })}
                    variant="ghost"
                    size="icon"
                    className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                  <Button type="button" aria-label={t("obligations.mujtahids.deleteAria", { name: mujtahid.name })} onClick={() => handleDeleteMujtahid(mujtahid.id)}
                    variant="ghost"
                    size="icon"
                    className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </header>
              {isOpen && (
                <div className="border-t border-border bg-muted/30">
                  {mujtahidReps.length === 0 ? (
                    <p className="px-6 py-3 text-xs text-muted-foreground m-0">{t("obligations.mujtahids.noReps")}</p>
                  ) : (
                    mujtahidReps.map((representative) => (
                      <div key={representative.id} className="flex items-center justify-between px-6 py-2.5 border-b border-border last:border-0">
                        <span className="text-sm text-foreground">{representative.name}</span>
                        <div className="flex items-center gap-1">
                          <Button type="button" aria-label={t("obligations.mujtahids.repEditAria", { name: representative.name })} onClick={() => setModal({ mode: "edit-rep", data: { ...representative } })}
                            variant="ghost"
                            size="icon"
                            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                            <Pencil className="w-3 h-3" aria-hidden="true" />
                          </Button>
                          <Button type="button" aria-label={t("obligations.mujtahids.repDeleteAria", { name: representative.name })} onClick={() => handleDeleteRep(representative.id)}
                            variant="ghost"
                            size="icon"
                            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </section>

      {modal && (modal.mode === "add" || modal.mode === "edit") ? (
        <NameFormModal
          title={modal.mode === "add" ? t("obligations.mujtahids.addTitle") : t("obligations.mujtahids.editTitle")}
          label={t("obligations.mujtahids.nameLabel")}
          initial={modal.data}
          onSave={handleSaveMujtahid}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal && (modal.mode === "add-rep" || modal.mode === "edit-rep") ? (
        <NameFormModal
          title={modal.mode === "add-rep" ? t("obligations.mujtahids.repAddTitle") : t("obligations.mujtahids.repEditTitle")}
          label={t("obligations.mujtahids.repNameLabel")}
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
      setError(t("obligations.mujtahids.nameRequired"));
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
