import React from "react";
import { Plus, Gift } from "lucide-react";
import { Session } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { TabarrukList } from "@/tenant/features/sessions/components/tabs/TabarrukList";
import { TabarrukModal } from "@/tenant/features/sessions/components/tabs/TabarrukModal";
import { useTabarrukTabController } from "@/tenant/features/sessions/components/tabs/useTabarrukTabController";

interface TabarrukTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

export function TabarrukTab({ session, onUpdate, canWrite }: TabarrukTabProps) {
  const { t } = useTranslation();
  const {
    tabarrukItems,
    showModal,
    editEntry,
    deleteTarget,
    saving,
    deletePendingRef,
    handleSave,
    handleDelete,
    openCreateModal,
    openEditModal,
    closeModal,
    setDeleteTarget,
  } = useTabarrukTabController({ session, onUpdate });

  return (
    <section aria-label={t("sessions.tabarruk.ariaLabel")} className="space-y-4">
      <article className="flex items-start gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/20">
        <Gift className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-warning leading-relaxed m-0">
          {t("sessions.tabarruk.description")}
        </p>
      </article>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 min-w-0 text-sm font-semibold text-foreground">{t("sessions.tabarruk.count", { count: tabarrukItems.length })}</p>
        {canWrite && (
          <Button
            onClick={openCreateModal}
            className="flex h-auto w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.tabarruk.add")}
          </Button>
        )}
      </header>

      {tabarrukItems.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">{t("sessions.tabarruk.emptyTitle")}</p>
        </div>
      ) : (
        <TabarrukList
          items={tabarrukItems}
          canWrite={canWrite}
          t={t}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
        />
      )}

      <TabarrukModal
        open={showModal}
        entry={editEntry}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
      />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deletePendingRef.current) setDeleteTarget(null); }}
        title={t("sessions.tabarruk.confirmDeleteTitle")}
        description={t("sessions.tabarruk.confirmDeleteDescription", { name: deleteTarget?.item ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </section>
  );
}
