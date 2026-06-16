import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DESIGNATED_FOR_OPTIONS, ObligationType } from '@/lib/data/obligationsData';
import ObligationModal from "./ObligationModal";

export type DesignatedFor = "Syed" | "Non-Syed" | "Both" | "None";

interface TypeBadgeProps {
  val: DesignatedFor;
}

/**
 * TypeBadge component.
 * @param {TypeBadgeProps} props
 */
function TypeBadge({ val }: TypeBadgeProps) {
  const colors: Record<string, string> = {
    Syed: "bg-purple-100 text-purple-700 border-purple-200",
    "Non-Syed": "bg-blue-100 text-blue-700 border-blue-200",
    Both: "bg-emerald-100 text-emerald-700 border-emerald-200",
    None: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[val] || colors.None}`}>
      {val}
    </span>
  );
}

const EMPTY: Partial<ObligationType> = { name: "", quantity_based: false, designated_for: "Both" };

export interface ObligationTypeManagerProps {
  types: ObligationType[];
  onChange: (types: ObligationType[]) => void;
}

interface ModalState {
  mode: "add" | "edit";
  data: Partial<ObligationType>;
}

/**
 * ObligationTypeManager component.
 *
 * @param {ObligationTypeManagerProps} props
 * @returns {React.ReactElement}
 */
export default function ObligationTypeManager({ types, onChange }: ObligationTypeManagerProps) {
  const [modal, setModal] = useState<ModalState | null>(null);

  const handleSave = (form: Partial<ObligationType>) => {
    if (modal?.mode === "add") {
      onChange([...types, { ...form, id: `ot${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ObligationType]);
    } else if (modal?.mode === "edit") {
      onChange(types.map((t) => t.id === form.id ? { ...t, ...form, updated_at: new Date().toISOString() } : t));
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this obligation type?")) onChange(types.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{types.length} obligation type{types.length !== 1 ? "s" : ""} configured</p>
        <button type="button" onClick={() => setModal({ mode: "add", data: { ...EMPTY } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Type
        </button>
      </header>

      <section aria-label="Obligation Types List" className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">List of obligation types</caption>
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Name</th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Quantity Based</th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Designated For</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">No obligation types yet.</td></tr>
            )}
            {types.map((t) => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">{t.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.quantity_based ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"}`}>
                    {t.quantity_based ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3"><TypeBadge val={t.designated_for} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" aria-label={`Edit ${t.name}`} onClick={() => setModal({ mode: "edit", data: { ...t } })}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`Delete ${t.name}`} onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {modal && (
        <ObligationModal title={modal.mode === "add" ? "Add Obligation Type" : "Edit Obligation Type"} onClose={() => setModal(null)}>
          <ObligationTypeForm initial={modal.data} onSave={handleSave} onCancel={() => setModal(null)} />
        </ObligationModal>
      )}
    </div>
  );
}

interface ObligationTypeFormProps {
  initial: Partial<ObligationType>;
  onSave: (form: Partial<ObligationType>) => void;
  onCancel: () => void;
}

/**
 * ObligationTypeForm component.
 * @param {ObligationTypeFormProps} props
 */
function ObligationTypeForm({ initial, onSave, onCancel }: ObligationTypeFormProps) {
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Name is required";
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
        <label htmlFor="type-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</label>
        <input id="type-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
          aria-invalid={!!errors.name} />
        {errors.name && <p className="text-xs text-destructive mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="type-designated" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Designated For *</label>
        <select id="type-designated" value={form.designated_for} onChange={(e) => setForm({ ...form, designated_for: e.target.value as DesignatedFor })}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
          {DESIGNATED_FOR_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="qty" checked={form.quantity_based} onChange={(e) => setForm({ ...form, quantity_based: e.target.checked })}
          className="rounded border-border text-primary focus:ring-primary/20" />
        <label htmlFor="qty" className="text-sm font-medium text-foreground cursor-pointer">Quantity Based</label>
      </div>
      <footer className="flex justify-end gap-2 pt-2 border-t border-border mt-4">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          Save
        </button>
      </footer>
    </form>
  );
}
