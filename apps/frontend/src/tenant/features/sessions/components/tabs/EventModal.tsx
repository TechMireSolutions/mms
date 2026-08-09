import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { EVENT_TYPES, type SessionEvent } from '@/lib/data/sessionsData';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormModal } from '@/components/ui/FormModal';
import { RequiredMark } from '@/components/ui/FormPrimitives';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/FormSelect';
import { TimePicker } from '@/components/ui/TimePicker';
import { type AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

const EMPTY: Partial<SessionEvent> = {
  title: '',
  date: '',
  time: '',
  location: '',
  description: '',
  type: 'meeting',
};

export interface EventModalProps {
  open: boolean;
  event: SessionEvent | null;
  onClose: () => void;
  onSave: (event: SessionEvent) => void | Promise<void>;
  saving: boolean;
}

export function EventModal({ open, event, onClose, onSave, saving }: EventModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [eventDraft, setEventDraft] = useState<Partial<SessionEvent>>(event ? { ...event } : { ...EMPTY });
  const updateEventDraft = <K extends keyof SessionEvent>(field: K, value: SessionEvent[K]) =>
    setEventDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setEventDraft(event ? { ...event } : { ...EMPTY });
    }
  }, [open, event]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={event ? t('sessions.events.edit') : t('sessions.events.add')}
      icon={Calendar}
      cancelLabel={t('common.cancel')}
      saveLabel={t('common.save')}
      onSave={() => onSave({ ...eventDraft, id: event?.id || `ev${crypto.randomUUID()}` } as SessionEvent)}
      saveDisabled={!eventDraft.title || !eventDraft.date}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="event-title">{t('sessions.events.form.title')}<RequiredMark /></label>
          <Input
            id="event-title"
            value={eventDraft.title || ''}
            onChange={(inputEvent) => updateEventDraft('title', inputEvent.target.value)}
            placeholder={t('sessions.events.form.titlePlaceholder')}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="event-date">{t('sessions.events.form.date')}<RequiredMark /></label>
            <DatePicker
              id="event-date"
              name="date"
              value={eventDraft.date || ''}
              onChange={(value) => updateEventDraft('date', value)}
              required
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="event-time">{t('sessions.events.form.time')}</label>
            <TimePicker
              id="event-time"
              name="time"
              value={eventDraft.time || ''}
              onChange={(nextValue) => updateEventDraft('time', nextValue)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="event-type">{t('sessions.events.form.type')}</label>
            <FormSelect
              id="event-type"
              value={eventDraft.type || 'meeting'}
              onChange={(value) => updateEventDraft('type', value as SessionEvent['type'])}
              options={EVENT_TYPES.map((eventType) => ({
                value: eventType,
                label: t(`sessions.events.type.${eventType}` as AppTranslationKey),
              }))}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="event-location">{t('sessions.events.form.location')}</label>
            <Input
              id="event-location"
              value={eventDraft.location || ''}
              onChange={(inputEvent) => updateEventDraft('location', inputEvent.target.value)}
              placeholder={t('sessions.events.form.locationPlaceholder')}
            />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="event-description">{t('sessions.events.form.description')}</label>
          <Textarea
            id="event-description"
            className="min-h-[4rem] resize-none"
            value={eventDraft.description || ''}
            onChange={(inputEvent) => updateEventDraft('description', inputEvent.target.value)}
            placeholder={t('sessions.events.form.descriptionPlaceholder')}
          />
        </div>
      </div>
    </FormModal>
  );
}
