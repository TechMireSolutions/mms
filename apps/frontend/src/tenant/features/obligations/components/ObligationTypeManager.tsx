import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DESIGNATED_FOR_OPTIONS, ObligationType } from '@/lib/data/obligationsData';
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { OBLIGATION_TYPE_BADGE, SEMANTIC_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";

export type DesignatedFor = "Syed" | "Non-Syed" | "Both" | "None";

interface TypeBadgeProps {
  designatedFor: DesignatedFor;
}

/**
 * TypeBadge component.
 * @param {TypeBadgeProps} props
 */
function TypeBadge({ designatedFor }: TypeBadgeProps) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", OBLIGATION_TYPE_BADGE[designatedFor] || OBLIGATION_TYPE_BADGE.None)}>
      {designatedFor}
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
export function ObligationTypeManager({ types, onChange }: ObligationTypeManagerProps) {
  const [modal, setModal] = useState<ModalState | null>(null);

  const handleSave = (form: Partial<ObligationType>) => {
    if (modal?.mode === "add") {
      onChange([...types, { ...form, id: `ot${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ObligationType]);
    } else if (modal?.mode === "edit") {
      onChange(types.map((obligationType) => obligationType.id === form.id ? { ...obligationType, ...form, updated_at: new Date().toISOString() } : obligationType));
    }
    setModal(null);
  };

  const handleDelete = (obligationTypeId: string) => {
    if (confirm("Delete this obligation type?")) onChange(types.filter((obligationType) => obligationType.id !== obligationTypeId));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{types.length} obligation type{types.length !== 1 ? "s" : ""} configured</p>
        <Button type="button" onClick={() => setModal({ mode: "add", data: { ...EMPTY } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Type
        </Button>
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
            {types.map((obligationType) => (
              <tr key={obligationType.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">{obligationType.name}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", obligationType.quantity_based ? SEMANTIC_BADGE.successStrong : SEMANTIC_BADGE.muted)}>
                    {obligationType.quantity_based ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3"><TypeBadge designatedFor={obligationType.designated_for} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" aria-label={`Edit ${obligationType.name}`} onClick={() => setModal({ mode: "edit", data: { ...obligationType } })}
                      variant="ghost"
                      className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button type="button" aria-label={`Delete ${obligationType.name}`} onClick={() => handleDelete(obligationType.id)}
                      variant="ghost"
                      className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {modal ? (
        <ObligationTypeFormModal
          title={modal.mode === "add" ? "Add Obligation Type" : "Edit Obligation Type"}
          initial={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

interface ObligationTypeFormModalProps {
  title: string;
  initial: Partial<ObligationType>;
  onSave: (form: Partial<ObligationType>) => void;
  onClose: () => void;
}

function ObligationTypeFormModal({ initial, onSave, onClose, title }: ObligationTypeFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!form.name?.trim()) nextErrors.name = "Name is required";
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
          <label htmlFor="type-name" className={FORM_LABEL}>Name *</label>
          <Input
            id="type-name"
            value={form.name || ""}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={FORM_INPUT}
            aria-invalid={!!errors.name}
          />
        </div>
        <div>
          <label htmlFor="type-designated" className={FORM_LABEL}>Designated For *</label>
          <FormSelect
            id="type-designated"
            value={form.designated_for || ""}
            onChange={(val) => setForm({ ...form, designated_for: val as DesignatedFor })}
            options={DESIGNATED_FOR_OPTIONS}
          />
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="qty"
            checked={form.quantity_based}
            onCheckedChange={(checked) => setForm({ ...form, quantity_based: !!checked })}
          />
          <label htmlFor="qty" className="text-sm font-medium text-foreground cursor-pointer select-none">Quantity Based</label>
        </div>
      </div>
    </FormModal>
  );
}
