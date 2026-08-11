import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Clock } from "lucide-react";
import { DAYS, Session, TimetableItem } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import type { AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { TIMETABLE_TYPE_CONFIG } from "@/tenant/features/sessions/components/tabs/timetableTabConfig";
import { TimetableActivityChip } from "@/tenant/features/sessions/components/tabs/TimetableActivityChip";
import { TimetableAddActivityModal } from "@/tenant/features/sessions/components/tabs/TimetableAddActivityModal";

interface TimetableTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

/**
 * TimetableTab Component
 *
 * Renders the timetable view for a session, grouping activities by day.
 */
export function TimetableTab({ session, onUpdate, canWrite }: TimetableTabProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TimetableItem | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = React.useRef(false);
  const timetable = session.timetable || [];

  const handleAdd = async (entry: TimetableItem) => {
    setSaving(true);
    try {
      await onUpdate({ ...session, timetable: [...timetable, entry] });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deletePendingRef.current = true;
    try {
      await onUpdate({ ...session, timetable: timetable.filter((entry) => entry.id !== deleteTarget.id) });
      setDeleteTarget(null);
    } finally {
      deletePendingRef.current = false;
    }
  };

  const timetableByDay = DAYS.reduce((entriesByDay, day) => {
    entriesByDay[day] = timetable.filter((entry) => entry.day === day).sort((firstEntry, secondEntry) => firstEntry.startTime.localeCompare(secondEntry.startTime));
    return entriesByDay;
  }, {} as Record<string, TimetableItem[]>);

  const activeDays = DAYS.filter((day) => timetableByDay[day].length > 0);

  return (
    <section aria-label={t("sessions.timetable.ariaLabel")} className="space-y-4">
      <SectionHeader
        noMargin
        title={t("sessions.timetable.count", { count: timetable.length })}
        actions={
          canWrite && (
            <Button
              onClick={() => setShowModal(true)}
              className="flex h-auto w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.timetable.add")}
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-2" aria-label={t("sessions.timetable.legend")}>
        {Object.entries(TIMETABLE_TYPE_CONFIG).map(([type, typeConfig]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${typeConfig.dot}`} aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{t(`sessions.timetable.type.${type}` as AppTranslationKey)}</span>
          </div>
        ))}
      </div>

      {timetable.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={Clock}
          title={t("sessions.timetable.emptyTitle")}
          description={t("sessions.timetable.emptySubtitle")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day) => {
            const entries = timetableByDay[day];
            if (entries.length === 0) return null;
            return (
              <section key={day} aria-label={t("sessions.timetable.daySchedule", { day: t(`sessions.timetable.day.${day}` as AppTranslationKey) })} className={`${WORK_SURFACE} overflow-hidden`}>
                <header className="flex min-w-0 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
                  <h4 className="m-0 min-w-0 truncate text-sm font-bold text-foreground">{t(`sessions.timetable.day.${day}` as AppTranslationKey)}</h4>
                  <span className="shrink-0 text-xs text-muted-foreground">{t("sessions.timetable.activityCount", { count: entries.length })}</span>
                </header>
                <div className="p-2.5 space-y-2">
                  <AnimatePresence>
                    {entries.map((entry) => <TimetableActivityChip key={entry.id} entry={entry} onDelete={() => setDeleteTarget(entry)} canWrite={canWrite} />)}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {timetable.length > 0 && activeDays.length < DAYS.length && (
        <p className="text-xs text-muted-foreground text-center m-0">
          {t("sessions.timetable.emptyDays", { days: DAYS.filter((day) => timetableByDay[day].length === 0).map((day) => t(`sessions.timetable.day.${day}` as AppTranslationKey)).join(", ") })}
        </p>
      )}

      <TimetableAddActivityModal open={showModal} onClose={() => { if (!saving) setShowModal(false); }} onSave={handleAdd} saving={saving} />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deletePendingRef.current) setDeleteTarget(null); }}
        title={t("sessions.timetable.confirmDeleteTitle")}
        description={t("sessions.timetable.confirmDeleteDescription", { name: deleteTarget?.activity ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </section>
  );
}
