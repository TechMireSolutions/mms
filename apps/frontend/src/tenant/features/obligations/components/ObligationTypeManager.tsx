import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ObligationType } from '@/lib/data/obligationsData';
import { useTranslation } from "@/hooks/useTranslation";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ObligationTypeFormModal } from "@/tenant/features/obligations/components/ObligationTypeFormModal";
import { ObligationTypeManagerList } from "@/tenant/features/obligations/components/ObligationTypeManagerList";
import {
  DESIGNATED_LABEL_KEYS,
  OBLIGATION_TYPE_EMPTY,
  type ObligationTypeModalState,
} from "@/tenant/features/obligations/components/obligationTypeManagerShared";

export type { DesignatedFor } from "@/tenant/features/obligations/components/obligationTypeManagerShared";

export interface ObligationTypeManagerProps {
  types: ObligationType[];
  onChange: (types: ObligationType[]) => void | Promise<void>;
}

/**
 * Setup manager for obligation types.
 */
export function ObligationTypeManager({ types, onChange }: ObligationTypeManagerProps) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<ObligationTypeModalState | null>(null);

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

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleSave = async (form: Partial<ObligationType>) => {
    if (modal?.mode === "add") {
      await onChange([...types, { ...form, id: `ot${crypto.randomUUID()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ObligationType]);
    } else if (modal?.mode === "edit") {
      await onChange(types.map((obligationType) => obligationType.id === form.id ? { ...obligationType, ...form, updated_at: new Date().toISOString() } : obligationType));
    }
    setModal(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await onChange(types.filter((obligationType) => obligationType.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        noMargin
        title={<span className="m-0 min-w-0 text-sm text-muted-foreground">{t("obligations.types.count", { count: types.length })}</span>}
        actions={
          <Button type="button" onClick={() => setModal({ mode: "add", data: { ...OBLIGATION_TYPE_EMPTY } })}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.types.add")}
          </Button>
        }
      />

      <ObligationTypeManagerList
        types={types}
        designatedConfig={designatedConfig}
        quantityConfig={quantityConfig}
        onEdit={(obligationType) => setModal({ mode: "edit", data: { ...obligationType } })}
        onDelete={(obligationTypeId) => setDeleteTargetId(obligationTypeId)}
      />

      {modal ? (
        <ObligationTypeFormModal
          title={modal.mode === "add" ? t("obligations.types.addTitle") : t("obligations.types.editTitle")}
          initial={modal.data}
          onSave={(form) => { void handleSave(form); }}
          onClose={() => setModal(null)}
        />
      ) : null}

      <ConfirmAlertDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title={t("obligations.types.deleteConfirm")}
        description={t("obligations.types.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
