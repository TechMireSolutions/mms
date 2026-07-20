import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, MapPin, Trash2 } from "lucide-react";
import { DAYS, ACTIVITY_TYPES, Session, TimetableItem } from '@/lib/data/sessionsData';
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { toTitleCase } from "@mms/shared";


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
}

function ActivityChip({ entry, onDelete }: ActivityChipProps) {
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
        <h5 className="font-semibold text-[12px] truncate m-0">{entry.activity}</h5>
        <div className="flex items-center gap-2 mt-0.5 opacity-80">
          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" aria-hidden="true" />{entry.startTime}–{entry.endTime}</span>
          {entry.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" aria-hidden="true" />{entry.location}</span>}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${entry.activity}`}
        onClick={() => onDelete(entry.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-current hover:text-destructive ml-1 flex-shrink-0 w-6 h-6 p-0"
      >
        <Trash2 className="w-3 h-3" aria-hidden="true" />
      </Button>
    </motion.article>
  );
}

interface AddActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: TimetableItem) => void;
}

function AddActivityModal({ open, onClose, onSave }: AddActivityModalProps) {
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
      title="Add Activity"
      icon={Clock}
      cancelLabel="Cancel"
      saveLabel="Add"
      onSave={() => onSave({ ...activityDraft, id: `tt${Date.now()}` } as TimetableItem)}
      saveDisabled={!activityDraft.activity}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="activity-name">Activity Name *</label>
          <Input id="activity-name" value={activityDraft.activity || ""} onChange={(event) => updateActivityDraft("activity", event.target.value)} placeholder="e.g. Hifz Revision" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="activity-day">Day</label>
            <FormSelect
              id="activity-day"
              value={activityDraft.day || "Mon"}
              onChange={(value) => updateActivityDraft("day", value as TimetableItem["day"])}
              options={DAYS}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="activity-type">Type</label>
            <FormSelect
              id="activity-type"
              value={activityDraft.type || "class"}
              onChange={(value) => updateActivityDraft("type", value as TimetableItem["type"])}
              options={ACTIVITY_TYPES.map((activityType) => ({ value: activityType, label: toTitleCase(activityType) }))}

              className="w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="activity-start">Start Time</label>
            <Input id="activity-start" type="time" value={activityDraft.startTime || ""} onChange={(event) => updateActivityDraft("startTime", event.target.value)} required />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="activity-end">End Time</label>
            <Input id="activity-end" type="time" value={activityDraft.endTime || ""} onChange={(event) => updateActivityDraft("endTime", event.target.value)} required />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="activity-location">Location</label>
          <Input id="activity-location" value={activityDraft.location || ""} onChange={(event) => updateActivityDraft("location", event.target.value)} placeholder="e.g. Room A" />
        </div>
      </div>
    </FormModal>
  );
}

interface TimetableTabProps {
  session: Session;
  onUpdate: (session: Session) => void;
}

/**
 * TimetableTab Component
 *
 * Renders the timetable view for a session, grouping activities by day.
 *
 * @param {TimetableTabProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function TimetableTab({ session, onUpdate }: TimetableTabProps) {
  const [showModal, setShowModal] = useState(false);
  const timetable = session.timetable || [];

  const handleAdd = (entry: TimetableItem) => {
    onUpdate({ ...session, timetable: [...timetable, entry] });
    setShowModal(false);
  };

  const handleDelete = (id: string) => onUpdate({ ...session, timetable: timetable.filter((entry) => entry.id !== id) });

  // Group by day
  const timetableByDay = DAYS.reduce((entriesByDay, day) => {
    entriesByDay[day] = timetable.filter((entry) => entry.day === day).sort((firstEntry, secondEntry) => firstEntry.startTime.localeCompare(secondEntry.startTime));
    return entriesByDay;
  }, {} as Record<string, TimetableItem[]>);

  const activeDays = DAYS.filter((day) => timetableByDay[day].length > 0);

  return (
    <section aria-label="Session Timetable" className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{timetable.length} activit{timetable.length !== 1 ? "ies" : "y"} scheduled</p>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors h-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Activity
        </Button>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-2" aria-label="Timetable Legend">
        {Object.entries(TYPE_CONFIG).map(([type, typeConfig]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${typeConfig.dot}`} aria-hidden="true" />
            <span className="text-[11px] text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {timetable.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No activities yet</p>
          <p className="text-xs text-muted-foreground mt-0.5 m-0">Add activities to build the timetable</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day) => {
            const entries = timetableByDay[day];
            if (entries.length === 0) return null;
            return (
              <section key={day} aria-label={`${day} Schedule`} className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="px-3 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
                  <h4 className="text-[12px] font-bold text-foreground m-0">{day}</h4>
                  <span className="text-[10px] text-muted-foreground">{entries.length} activit{entries.length !== 1 ? "ies" : "y"}</span>
                </header>
                <div className="p-2.5 space-y-2">
                  <AnimatePresence>
                    {entries.map((entry) => <ActivityChip key={entry.id} entry={entry} onDelete={handleDelete} />)}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* All days placeholder for empty days */}
      {timetable.length > 0 && activeDays.length < DAYS.length && (
        <p className="text-xs text-muted-foreground text-center m-0">
          {DAYS.filter((day) => timetableByDay[day].length === 0).join(", ")} — no activities scheduled
        </p>
      )}

      <AddActivityModal open={showModal} onClose={() => setShowModal(false)} onSave={handleAdd} />
    </section>
  );
}
