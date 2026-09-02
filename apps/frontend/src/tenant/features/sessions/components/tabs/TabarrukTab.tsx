import React from "react";
import { Plus, Gift } from "lucide-react";
import { type Session } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WarningCallout } from "@/components/ui/WarningCallout";
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
      <WarningCallout
        icon={Gift}
        description={t("sessions.tabarruk.description")}
        className="items-start"
      />

      <SectionHeader
        noMargin
        title={t("sessions.tabarruk.count", { count: tabarrukItems.length })}
        actions={
          canWrite && (
            <Button
              onClick={openCreateModal}
              className="flex h-auto w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.tabarruk.add")}
            </Button>
          )
        }
      />

      {tabarrukItems.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={Gift}
          title={t("sessions.tabarruk.emptyTitle")}
        />
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
