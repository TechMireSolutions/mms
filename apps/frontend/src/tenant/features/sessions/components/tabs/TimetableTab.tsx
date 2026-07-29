import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, MapPin, Trash2 } from "lucide-react";
import { DAYS, ACTIVITY_TYPES, Session, TimetableItem } from '@/lib/data/sessionsData';
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import type { AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";

const TYPE_CONFIG: Record<string, { color: string, dot: string }> = {
  class:      { color: "bg-success/15 text-success border-success/30", dot: "bg-success" },
  lecture:    { color: "bg-info/15 text-info border-info/30",          dot: "bg-info" },
  assessment: { color: "bg-destructive/15 text-destructive border-destructive/30",             dot: "bg-destructive" },
  activity:   { color: "bg-primary/15 text-primary border-primary/30",    dot: "bg-primary" },
  spiritual:  { color: "bg-warning/15 text-warning border-warning/30",       dot: "bg-warning" },
  break:      { color: "bg-muted text-muted-foreground border-border",       dot: "bg-border" },
};

const EMPTY: Partial<TimetableItem> = { day: "Mon", activity: "", startTime: "08:00", endTime: "09:00", location: "", type: "class" };

interface ActivityChipProps {
  entry: TimetableItem;
  onDelete: (id: string) => void;
  canWrite: boolean;
}

function ActivityChip({ entry, onDelete, canWrite }: ActivityChipProps) {
  const { t } = useTranslation();
  const typeConfig = TYPE_CONFIG[entry.type] || TYPE_CONFIG.class;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${typeConfig.color}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot} mt-1 flex-shrink-0`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-sm truncate m-0">{entry.activity}</h5>
        <div className="flex items-center gap-2 mt-0.5 opacity-80">
          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" aria-hidden="true" />{entry.startTime}–{entry.endTime}</span>
          {entry.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" aria-hidden="true" />{entry.location}</span>}
        </div>
      </div>
      {canWrite && <Button
        variant="ghost"
        size="icon"
        aria-label={t("sessions.timetable.deleteNamed", { name: entry.activity })}
        onClick={() => onDelete(entry.id)}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity text-current hover:text-destructive ms-1 flex-shrink-0"
      >
        <Trash2 className="w-3 h-3" aria-hidden="true" />
      </Button>}
    </motion.article>
  );
}

interface AddActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: TimetableItem) => void | Promise<void>;
  saving: boolean;
}

function AddActivityModal({ open, onClose, onSave, saving }: AddActivityModalProps) {
  const { t } = useTranslation();
  const [activityDraft, setActivityDraft] = useState<Partial<TimetableItem>>({ ...EMPTY });
  const updateActivityDraft = <K extends keyof TimetableItem>(field: K, value: TimetableItem[K]) => setActivityDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setActivityDraft({ ...EMPTY });
    }
  }, [open]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("sessions.timetable.add")}
      icon={Clock}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.add")}
      onSave={() => onSave({ ...activityDraft, id: `tt${Date.now()}` } as TimetableItem)}
      saving={saving}
      saveDisabled={!activityDraft.activity}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="activity-name">{t("sessions.timetable.form.name")} *</label>
          <Input id="activity-name" value={activityDraft.activity || ""} onChange={(event) => updateActivityDraft("activity", event.target.value)} placeholder={t("sessions.timetable.form.namePlaceholder")} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="activity-day">{t("sessions.timetable.form.day")}</label>
            <FormSelect
              id="activity-day"
              value={activityDraft.day || "Mon"}
              onChange={(value) => updateActivityDraft("day", value as TimetableItem["day"])}
              options={DAYS.map((day) => ({ value: day, label: t(`sessions.timetable.day.${day}` as AppTranslationKey) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="activity-type">{t("sessions.timetable.form.type")}</label>
            <FormSelect
              id="activity-type"
              value={activityDraft.type || "class"}
              onChange={(value) => updateActivityDraft("type", value as TimetableItem["type"])}
              options={ACTIVITY_TYPES.map((activityType) => ({ value: activityType, label: t(`sessions.timetable.type.${activityType}` as AppTranslationKey) }))}

              className="w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="activity-start">{t("sessions.timetable.form.startTime")}</label>
            <Input id="activity-start" type="time" value={activityDraft.startTime || ""} onChange={(event) => updateActivityDraft("startTime", event.target.value)} required />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="activity-end">{t("sessions.timetable.form.endTime")}</label>
            <Input id="activity-end" type="time" value={activityDraft.endTime || ""} onChange={(event) => updateActivityDraft("endTime", event.target.value)} required />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="activity-location">{t("sessions.timetable.form.location")}</label>
          <Input id="activity-location" value={activityDraft.location || ""} onChange={(event) => updateActivityDraft("location", event.target.value)} placeholder={t("sessions.timetable.form.locationPlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}

interface TimetableTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

/**
 * TimetableTab Component
 *
 * Renders the timetable view for a session, grouping activities by day.
 *
 * @param {TimetableTabProps} props - The component props.
 * @returns {React.ReactElement}
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

  // Group by day
  const timetableByDay = DAYS.reduce((entriesByDay, day) => {
    entriesByDay[day] = timetable.filter((entry) => entry.day === day).sort((firstEntry, secondEntry) => firstEntry.startTime.localeCompare(secondEntry.startTime));
    return entriesByDay;
  }, {} as Record<string, TimetableItem[]>);

  const activeDays = DAYS.filter((day) => timetableByDay[day].length > 0);

  return (
    <section aria-label={t("sessions.timetable.ariaLabel")} className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 min-w-0 text-sm font-semibold text-foreground">{t("sessions.timetable.count", { count: timetable.length })}</p>
        {canWrite && <Button
          onClick={() => setShowModal(true)}
          className="flex h-auto w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.timetable.add")}
        </Button>}
      </header>

      <div className="flex flex-wrap gap-2" aria-label={t("sessions.timetable.legend")}>
        {Object.entries(TYPE_CONFIG).map(([type, typeConfig]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${typeConfig.dot}`} aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{t(`sessions.timetable.type.${type}` as AppTranslationKey)}</span>
          </div>
        ))}
      </div>

      {timetable.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">{t("sessions.timetable.emptyTitle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5 m-0">{t("sessions.timetable.emptySubtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day) => {
            const entries = timetableByDay[day];
            if (entries.length === 0) return null;
            return (
              <section key={day} aria-label={t("sessions.timetable.daySchedule", { day: t(`sessions.timetable.day.${day}` as AppTranslationKey) })} className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex min-w-0 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
                  <h4 className="m-0 min-w-0 truncate text-sm font-bold text-foreground">{t(`sessions.timetable.day.${day}` as AppTranslationKey)}</h4>
                  <span className="shrink-0 text-xs text-muted-foreground">{t("sessions.timetable.activityCount", { count: entries.length })}</span>
                </header>
                <div className="p-2.5 space-y-2">
                  <AnimatePresence>
                    {entries.map((entry) => <ActivityChip key={entry.id} entry={entry} onDelete={() => setDeleteTarget(entry)} canWrite={canWrite} />)}
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

      <AddActivityModal open={showModal} onClose={() => { if (!saving) setShowModal(false); }} onSave={handleAdd} saving={saving} />
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
