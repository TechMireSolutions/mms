import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar, Clock, MapPin, Edit2 } from "lucide-react";
import { EVENT_TYPES, Session, SessionEvent } from '@/lib/data/sessionsData';
import { DatePicker } from "../../ui/DatePicker";
import FormModal from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";

const TYPE_COLORS: Record<string, string> = {
  ceremony:   "bg-warning/10 text-warning border-warning/20",
  assessment: "bg-destructive/10 text-destructive border-destructive/20",
  meeting:    "bg-info/10 text-info border-info/20",
  trip:       "bg-success/10 text-success border-success/20",
  other:      "bg-muted text-muted-foreground border-border",
};

const EMPTY: Partial<SessionEvent> = { title: "", date: "", time: "", location: "", description: "", type: "meeting" };

interface EventModalProps {
  open: boolean;
  event: SessionEvent | null;
  onClose: () => void;
  onSave: (event: SessionEvent) => void;
}

function EventModal({ open, event, onClose, onSave }: EventModalProps) {
  const [data, setData] = useState<Partial<SessionEvent>>(event ? { ...event } : { ...EMPTY });
  const upd = <K extends keyof SessionEvent>(f: K, v: SessionEvent[K]) => setData((d) => ({ ...d, [f]: v }));

  React.useEffect(() => {
    if (open) {
      setData(event ? { ...event } : { ...EMPTY });
    }
  }, [open, event]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={event ? "Edit Event" : "Add Event"}
      icon={Calendar}
      size="md"
      cancelLabel="Cancel"
      saveLabel="Save"
      onSave={() => onSave({ ...data, id: event?.id || `ev${Date.now()}` } as SessionEvent)}
      saveDisabled={!data.title || !data.date}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="event-title">Title *</label>
          <input id="event-title" className={FORM_INPUT} value={data.title || ""} onChange={(e) => upd("title", e.target.value)} placeholder="Event title" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="event-date">Date *</label>
            <DatePicker
              id="event-date"
              value={data.date || ""}
              onChange={(val) => upd("date", val)}
              required
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="event-time">Time</label>
            <input id="event-time" type="time" className={FORM_INPUT} value={data.time || ""} onChange={(e) => upd("time", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="event-type">Type</label>
            <select id="event-type" className={`${FORM_INPUT} cursor-pointer`} value={data.type || "meeting"} onChange={(e) => upd("type", e.target.value as SessionEvent["type"])}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="event-location">Location</label>
            <input id="event-location" className={FORM_INPUT} value={data.location || ""} onChange={(e) => upd("location", e.target.value)} placeholder="e.g. Main Hall" />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="event-description">Description</label>
          <textarea id="event-description" className={`${FORM_INPUT} min-h-[64px] resize-none`} value={data.description || ""} onChange={(e) => upd("description", e.target.value)} placeholder="Brief description…" />
        </div>
      </div>
    </FormModal>
  );
}

interface EventsTabProps {
  session: Session;
  onUpdate: (session: Session) => void;
}

/**
 * EventsTab Component
 *
 * Renders the events tab for a session, allowing managing individual events.
 *
 * @param {EventsTabProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function EventsTab({ session, onUpdate }: EventsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<SessionEvent | null>(null);
  const events = (session.events || []).sort((a, b) => a.date.localeCompare(b.date));

  const handleSave = (ev: SessionEvent) => {
    const existing = session.events?.find((e) => e.id === ev.id);
    onUpdate({ ...session, events: existing ? session.events.map((e) => e.id === ev.id ? ev : e) : [...(session.events || []), ev] });
    setShowModal(false); setEditEvent(null);
  };

  const handleDelete = (id: string) => onUpdate({ ...session, events: session.events.filter((e) => e.id !== id) });

  return (
    <section aria-label="Session Events" className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{events.length} event{events.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setEditEvent(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Event
        </button>
      </header>

      {events.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No events yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />
          <div className="space-y-4 pl-10">
            {events.map((ev, i) => (
              <motion.article
                key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute -left-10 top-4 w-4 h-4 rounded-full bg-card border-2 border-primary" aria-hidden="true" />
                <div className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all group">
                  <header className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13px] font-bold text-foreground m-0">{ev.title}</h4>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[ev.type] || TYPE_COLORS.other}`}>
                        {ev.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button aria-label={`Edit ${ev.title}`} onClick={() => { setEditEvent(ev); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button aria-label={`Delete ${ev.title}`} onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </header>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" />{ev.date}</span>
                    {ev.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{ev.time}</span>}
                    {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{ev.location}</span>}
                  </div>
                  {ev.description && <p className="text-[12px] text-muted-foreground leading-relaxed m-0">{ev.description}</p>}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      )}

      <EventModal
        open={showModal}
        event={editEvent}
        onClose={() => { setShowModal(false); setEditEvent(null); }}
        onSave={handleSave}
      />
    </section>
  );
}
