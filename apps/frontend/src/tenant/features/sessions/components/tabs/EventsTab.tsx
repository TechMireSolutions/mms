import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Calendar, Clock, MapPin, Edit2 } from 'lucide-react';
import { Session, SessionEvent } from '@/lib/data/sessionsData';
import { formatDate } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { WORK_SURFACE_INNER } from '@/components/ui/formStyles';
import { EventModal } from '@/tenant/features/sessions/components/tabs/EventModal';

interface EventsTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

export function EventsTab({ session, onUpdate, canWrite }: EventsTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<SessionEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = React.useRef(false);
  const events = [...(session.events ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  const eventTypeConfig = (() => ({
    ceremony: { label: t('sessions.events.type.ceremony'), cls: SEMANTIC_BADGE.warning },
    assessment: { label: t('sessions.events.type.assessment'), cls: SEMANTIC_BADGE.destructive },
    meeting: { label: t('sessions.events.type.meeting'), cls: SEMANTIC_BADGE.info },
    trip: { label: t('sessions.events.type.trip'), cls: SEMANTIC_BADGE.success },
    other: { label: t('sessions.events.type.other'), cls: SEMANTIC_BADGE.muted },
  }))() as Record<string, StatusBadgeConfigItem>;

  const handleSave = async (eventToSave: SessionEvent) => {
    const existing = session.events?.find((sessionEvent) => sessionEvent.id === eventToSave.id);
    setSaving(true);
    try {
      await onUpdate({
        ...session,
        events: existing
          ? session.events.map((sessionEvent) => sessionEvent.id === eventToSave.id ? eventToSave : sessionEvent)
          : [...(session.events || []), eventToSave],
      });
      setShowModal(false);
      setEditEvent(null);
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
    <section aria-label={t('sessions.events.ariaLabel')} className="space-y-4">
      <SectionHeader
        noMargin
        title={t('sessions.events.count', { count: events.length })}
        actions={
          canWrite && (
            <Button
              onClick={() => { setEditEvent(null); setShowModal(true); }}
              className="flex h-auto w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t('sessions.events.add')}
            </Button>
          )
        }
      />

      {events.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={Calendar}
          title={t('sessions.events.emptyTitle')}
        />
      ) : (
        <div className="relative ps-6">
          <div className="absolute start-6 top-0 bottom-0 w-0.5 -translate-x-1/2 rtl:translate-x-1/2 bg-border" aria-hidden="true" />
          <div className="space-y-4 ps-4">
            {events.map((sessionEvent, index) => (
              <motion.article
                key={sessionEvent.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="relative"
              >
                <div className="absolute -start-4 top-4 w-4 h-4 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-card border-2 border-primary" aria-hidden="true" />
                <div className={`${WORK_SURFACE_INNER} p-4 hover:shadow-sm transition-all group`}>
                  <header className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h4 className="m-0 min-w-0 truncate text-sm font-bold text-foreground">{sessionEvent.title}</h4>
                      <StatusBadge status={sessionEvent.type || 'other'} config={eventTypeConfig} size="sm" />
                    </div>
                    {canWrite && (
                      <div className="flex items-center gap-1 self-end opacity-100 transition-opacity sm:self-start md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                        <Button aria-label={t('sessions.events.editNamed', { name: sessionEvent.title })} onClick={() => { setEditEvent(sessionEvent); setShowModal(true); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" variant="ghost" size="icon">
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                        <Button aria-label={t('sessions.events.deleteNamed', { name: sessionEvent.title })} onClick={() => setDeleteTarget(sessionEvent)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" variant="ghost" size="icon">
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
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
        title={t('sessions.events.confirmDeleteTitle')}
        description={t('sessions.events.confirmDeleteDescription', { name: deleteTarget?.title ?? '' })}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </section>
  );
}
