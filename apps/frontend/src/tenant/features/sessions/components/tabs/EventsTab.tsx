import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar, Clock, MapPin, Edit2 } from "lucide-react";
import { EVENT_TYPES, Session, SessionEvent } from '@/lib/data/sessionsData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/FormSelect";
import { formatDate, type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const EMPTY: Partial<SessionEvent> = { title: "", date: "", time: "", location: "", description: "", type: "meeting" };

interface EventModalProps {
  open: boolean;
  event: SessionEvent | null;
  onClose: () => void;
  onSave: (event: SessionEvent) => void | Promise<void>;
  saving: boolean;
}

function EventModal({ open, event, onClose, onSave, saving }: EventModalProps) {
  const { t } = useTranslation();
  const [eventDraft, setEventDraft] = useState<Partial<SessionEvent>>(event ? { ...event } : { ...EMPTY });
  const updateEventDraft = <K extends keyof SessionEvent>(field: K, value: SessionEvent[K]) => setEventDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setEventDraft(event ? { ...event } : { ...EMPTY });
    }
  }, [open, event]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={event ? t("sessions.events.edit") : t("sessions.events.add")}
      icon={Calendar}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => onSave({ ...eventDraft, id: event?.id || `ev${Date.now()}` } as SessionEvent)}
      saveDisabled={!eventDraft.title || !eventDraft.date}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="event-title">{t("sessions.events.form.title")} *</label>
          <Input id="event-title" value={eventDraft.title || ""} onChange={(inputEvent) => updateEventDraft("title", inputEvent.target.value)} placeholder={t("sessions.events.form.titlePlaceholder")} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="event-date">{t("sessions.events.form.date")} *</label>
            <DatePicker
              id="event-date"
              value={eventDraft.date || ""}
              onChange={(value) => updateEventDraft("date", value)}
              required
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="event-time">{t("sessions.events.form.time")}</label>
            <Input id="event-time" type="time" value={eventDraft.time || ""} onChange={(inputEvent) => updateEventDraft("time", inputEvent.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="event-type">{t("sessions.events.form.type")}</label>
            <FormSelect
              id="event-type"
              value={eventDraft.type || "meeting"}
              onChange={(value) => updateEventDraft("type", value as SessionEvent["type"])}
              options={EVENT_TYPES.map((eventType) => ({ value: eventType, label: t(`sessions.events.type.${eventType}` as AppTranslationKey) }))}

              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="event-location">{t("sessions.events.form.location")}</label>
            <Input id="event-location" value={eventDraft.location || ""} onChange={(inputEvent) => updateEventDraft("location", inputEvent.target.value)} placeholder={t("sessions.events.form.locationPlaceholder")} />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="event-description">{t("sessions.events.form.description")}</label>
          <Textarea id="event-description" className="min-h-[64px] resize-none" value={eventDraft.description || ""} onChange={(inputEvent) => updateEventDraft("description", inputEvent.target.value)} placeholder={t("sessions.events.form.descriptionPlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}

interface EventsTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

/**
 * EventsTab Component
 *
 * Renders the events tab for a session, allowing managing individual events.
 *
 * @param {EventsTabProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function EventsTab({ session, onUpdate, canWrite }: EventsTabProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<SessionEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = React.useRef(false);
  const events = [...(session.events ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  const eventTypeConfig = React.useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    ceremony: { label: t("sessions.events.type.ceremony"), cls: SEMANTIC_BADGE.warning },
    assessment: { label: t("sessions.events.type.assessment"), cls: SEMANTIC_BADGE.destructive },
    meeting: { label: t("sessions.events.type.meeting"), cls: SEMANTIC_BADGE.info },
    trip: { label: t("sessions.events.type.trip"), cls: SEMANTIC_BADGE.success },
    other: { label: t("sessions.events.type.other"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  const handleSave = async (eventToSave: SessionEvent) => {
    const existing = session.events?.find((sessionEvent) => sessionEvent.id === eventToSave.id);
    setSaving(true);
    try {
      await onUpdate({ ...session, events: existing ? session.events.map((sessionEvent) => sessionEvent.id === eventToSave.id ? eventToSave : sessionEvent) : [...(session.events || []), eventToSave] });
      setShowModal(false); setEditEvent(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deletePendingRef.current = true;
    try {
      await onUpdate({ ...session, events: session.events.filter((sessionEvent) => sessionEvent.id !== deleteTarget.id) });
      setDeleteTarget(null);
    } finally {
      deletePendingRef.current = false;
    }
  };

  return (
    <section aria-label={t("sessions.events.ariaLabel")} className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{t("sessions.events.count", { count: events.length })}</p>
        {canWrite && <Button
          onClick={() => { setEditEvent(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors h-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.events.add")}
        </Button>}
      </header>

      {events.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">{t("sessions.events.emptyTitle")}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />
          <div className="space-y-4 ps-10">
            {events.map((sessionEvent, index) => (
              <motion.article
                key={sessionEvent.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute -left-10 top-4 w-4 h-4 rounded-full bg-card border-2 border-primary" aria-hidden="true" />
                <div className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all group">
                  <header className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground m-0">{sessionEvent.title}</h4>
                      <StatusBadge status={sessionEvent.type || "other"} config={eventTypeConfig} size="sm" />
                    </div>
                    {canWrite && <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                      <Button aria-label={t("sessions.events.editNamed", { name: sessionEvent.title })} onClick={() => { setEditEvent(sessionEvent); setShowModal(true); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" variant="ghost" size="icon">
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                      <Button aria-label={t("sessions.events.deleteNamed", { name: sessionEvent.title })} onClick={() => setDeleteTarget(sessionEvent)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" variant="ghost" size="icon">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    </div>}
                  </header>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" aria-hidden="true" />{formatDate(sessionEvent.date, true)}</span>
                    {sessionEvent.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{sessionEvent.time}</span>}
                    {sessionEvent.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{sessionEvent.location}</span>}
                  </div>
                  {sessionEvent.description && <p className="text-sm text-muted-foreground leading-relaxed m-0">{sessionEvent.description}</p>}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      )}

      <EventModal
        open={showModal}
        event={editEvent}
        onClose={() => { if (!saving) { setShowModal(false); setEditEvent(null); } }}
        onSave={handleSave}
        saving={saving}
      />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deletePendingRef.current) setDeleteTarget(null); }}
        title={t("sessions.events.confirmDeleteTitle")}
        description={t("sessions.events.confirmDeleteDescription", { name: deleteTarget?.title ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </section>
  );
}
