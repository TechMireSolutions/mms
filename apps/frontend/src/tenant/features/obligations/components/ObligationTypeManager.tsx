import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DESIGNATED_FOR_OPTIONS, ObligationType } from '@/lib/data/obligationsData';
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { AppTranslationKey } from "@mms/shared";

export type DesignatedFor = "Syed" | "Non-Syed" | "Both" | "None";

const DESIGNATED_LABEL_KEYS: Record<DesignatedFor, AppTranslationKey> = {
  Syed: "obligations.designated.syed",
  "Non-Syed": "obligations.designated.nonSyed",
  Both: "obligations.designated.both",
  None: "obligations.designated.none",
};

const EMPTY: Partial<ObligationType> = { name: "", quantity_based: false, designated_for: "Both" };

export interface ObligationTypeManagerProps {
  types: ObligationType[];
  onChange: (types: ObligationType[]) => void | Promise<void>;
}

interface ModalState {
  mode: "add" | "edit";
  data: Partial<ObligationType>;
}

/**
 * Setup manager for obligation types.
 */
export function ObligationTypeManager({ types, onChange }: ObligationTypeManagerProps) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<ModalState | null>(null);

  const designatedConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    Syed: { label: t(DESIGNATED_LABEL_KEYS.Syed), cls: SEMANTIC_BADGE.info },
    "Non-Syed": { label: t(DESIGNATED_LABEL_KEYS["Non-Syed"]), cls: SEMANTIC_BADGE.warning },
    Both: { label: t(DESIGNATED_LABEL_KEYS.Both), cls: SEMANTIC_BADGE.success },
    None: { label: t(DESIGNATED_LABEL_KEYS.None), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  const quantityConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    yes: { label: t("common.yes"), cls: SEMANTIC_BADGE.successStrong },
    no: { label: t("common.no"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  const handleSave = async (form: Partial<ObligationType>) => {
    if (modal?.mode === "add") {
      await onChange([...types, { ...form, id: `ot${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ObligationType]);
    } else if (modal?.mode === "edit") {
      await onChange(types.map((obligationType) => obligationType.id === form.id ? { ...obligationType, ...form, updated_at: new Date().toISOString() } : obligationType));
    }
    setModal(null);
  };

  const handleDelete = async (obligationTypeId: string) => {
    if (!confirm(t("obligations.types.deleteConfirm"))) return;
    await onChange(types.filter((obligationType) => obligationType.id !== obligationTypeId));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground m-0">{t("obligations.types.count", { count: types.length })}</p>
        <Button type="button" onClick={() => setModal({ mode: "add", data: { ...EMPTY } })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.types.add")}
        </Button>
      </header>

      <section aria-label={t("obligations.types")} className="rounded-xl border border-border overflow-hidden">
        {types.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground md:hidden">{t("obligations.types.empty")}</p>
        ) : (
          <div className="space-y-3 p-3 md:hidden">
            {types.map((obligationType) => (
              <article
                key={obligationType.id}
                className="space-y-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{obligationType.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" aria-label={t("obligations.types.editAria", { name: obligationType.name })} onClick={() => setModal({ mode: "edit", data: { ...obligationType } })}
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button type="button" aria-label={t("obligations.types.deleteAria", { name: obligationType.name })} onClick={() => void handleDelete(obligationType.id)}
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.types.colQuantity")}</dt>
                    <dd>
                      <StatusBadge status={obligationType.quantity_based ? "yes" : "no"} config={quantityConfig} size="sm" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.types.colDesignated")}</dt>
                    <dd>
                      <StatusBadge status={obligationType.designated_for} config={designatedConfig} size="sm" />
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("obligations.types")}</caption>
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.types.colName")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.types.colQuantity")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.types.colDesignated")}</th>
              <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase"><span className="sr-only">{t("common.actions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">{t("obligations.types.empty")}</td></tr>
            )}
            {types.map((obligationType) => (
              <tr key={obligationType.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">{obligationType.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={obligationType.quantity_based ? "yes" : "no"} config={quantityConfig} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={obligationType.designated_for} config={designatedConfig} size="sm" />
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" aria-label={t("obligations.types.editAria", { name: obligationType.name })} onClick={() => setModal({ mode: "edit", data: { ...obligationType } })}
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button type="button" aria-label={t("obligations.types.deleteAria", { name: obligationType.name })} onClick={() => void handleDelete(obligationType.id)}
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      {modal ? (
        <ObligationTypeFormModal
          title={modal.mode === "add" ? t("obligations.types.addTitle") : t("obligations.types.editTitle")}
          initial={modal.data}
          onSave={(form) => { void handleSave(form); }}
          onClose={() => setModal(null)}
          designatedConfig={designatedConfig}
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
  designatedConfig: Record<string, StatusBadgeConfigItem>;
}

function ObligationTypeFormModal({ initial, onSave, onClose, title }: ObligationTypeFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Partial<Record<"name", AppTranslationKey>>>({});

  const designatedOptions = useMemo(
    () => DESIGNATED_FOR_OPTIONS.map((option) => ({
      value: option,
      label: t(DESIGNATED_LABEL_KEYS[option as DesignatedFor]),
    })),
    [t],
  );

  const validate = (): Partial<Record<"name", AppTranslationKey>> => {
    const nextErrors: Partial<Record<"name", AppTranslationKey>> = {};
    if (!form.name?.trim()) nextErrors.name = "obligations.types.nameRequired";
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
      error={Object.values(errors).map((key) => t(key))}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="type-name" className={FORM_LABEL}>{t("obligations.types.colName")} *</label>
          <Input
            id="type-name"
            value={form.name || ""}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={FORM_INPUT}
            aria-invalid={!!errors.name}
          />
        </div>
        <div>
          <label htmlFor="type-designated" className={FORM_LABEL}>{t("obligations.types.colDesignated")} *</label>
          <FormSelect
            id="type-designated"
            value={form.designated_for || ""}
            onChange={(val) => setForm({ ...form, designated_for: val as DesignatedFor })}
            options={designatedOptions}
          />
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="qty"
            checked={form.quantity_based}
            onCheckedChange={(checked) => setForm({ ...form, quantity_based: !!checked })}
          />
          <label htmlFor="qty" className="text-sm font-medium text-foreground cursor-pointer select-none">{t("obligations.types.colQuantity")}</label>
        </div>
      </div>
    </FormModal>
  );
}
