import React, { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { School } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  TEACHER_STATUS_VALUES,
  type Teacher,
  type TeachersSettings,
  DEFAULT_TEACHERS_SETTINGS,
} from '@mms/shared';
import { getObject } from '@/lib/db';
import useTranslation from '@/hooks/useTranslation';
import FormModal from '@/components/ui/FormModal';
import ContactPicker from '@/components/ui/ContactPicker';
import { Input } from '@/components/ui/input';
import { FORM_SELECT, FORM_TEXTAREA } from '@/components/ui/formStyles';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { DatePicker } from '@/components/ui/DatePicker';
import { firstZodFieldError } from '@/lib/forms/translateZodError';
import { TranslatedFormMessage } from '@/lib/forms/TranslatedFormMessage';
import {
  teacherFormSchema,
  type TeacherFormValues,
  TEACHER_SPECIALIZATION_OPTIONS,
} from '@/lib/forms/teacherSchemas';
import { useContactsCollection } from '@/hooks/useContacts';
import { calculateKeyedUnitsCompleteness } from '@/lib/formCompleteness';

export interface TeacherFormProps {
  teacher?: Teacher;
  teachers: Teacher[];
  onClose: () => void;
  onSave: (data: Teacher) => void;
}

function generateEmployeeId(teachersList: Teacher[], settings: TeachersSettings): string {
  const prefix = settings.idPrefix || 'TCH';
  const nextSeq = teachersList.length + 1;
  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

export default function TeacherForm({
  teacher,
  teachers,
  onClose,
  onSave,
}: TeacherFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const contacts = useContactsCollection();
  const settings = useMemo(
    () => getObject<TeachersSettings>('teachers_settings', DEFAULT_TEACHERS_SETTINGS),
    [],
  );

  const usedContactIds = useMemo(
    () => teachers
      .filter((row) => !teacher || String(row.id) !== String(teacher.id))
      .map((row) => row.contactId)
      .filter((id) => id != null && id !== ''),
    [teachers, teacher],
  );

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      contactId: teacher?.contactId as TeacherFormValues['contactId'],
      employeeId: teacher?.employeeId ?? (settings.autoGenerateId ? generateEmployeeId(teachers, settings) : ''),
      specialization: teacher?.specialization ?? settings.defaultSpecialization ?? 'General',
      status: teacher?.status ?? 'active',
      joinDate: teacher?.joinDate ?? new Date().toISOString().split('T')[0],
      qualification: teacher?.qualification ?? '',
      notes: teacher?.notes ?? '',
    },
  });

  const contactId = form.watch('contactId');
  const watched = form.watch();

  const completeness = useMemo(
    () =>
      calculateKeyedUnitsCompleteness(watched as Record<string, unknown>, [
        { key: 'contactId' },
        { key: 'employeeId' },
        { key: 'specialization' },
        { key: 'status' },
        { key: 'joinDate' },
        { key: 'qualification' },
        { key: 'notes' },
      ]),
    [watched],
  );

  const handleSave = form.handleSubmit((values) => {
    const id = teacher?.id ?? `tch${Date.now()}`;
    onSave({
      id,
      contactId: values.contactId,
      employeeId: values.employeeId || (settings.autoGenerateId ? generateEmployeeId(teachers, settings) : undefined),
      specialization: values.specialization,
      status: values.status,
      joinDate: values.joinDate,
      qualification: values.qualification || undefined,
      notes: values.notes || undefined,
    });
    onClose();
  });

  return (
    <FormModal
      open
      onClose={onClose}
      title={teacher ? t('teachers.form.editTitle') : t('teachers.form.addTitle')}
      subtitle={t('teachers.form.contactHint')}
      icon={School}
      progress={completeness}
      progressLabel={t('common.formProgress')}
      error={firstZodFieldError(form.formState.errors, t) || undefined}
      cancelLabel={t('common.cancel')}
      saveLabel={t('common.save')}
      saveDisabled={!contactId}
      onSave={handleSave}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={handleSave}>
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ContactPicker
                    label={t('teachers.field.contact')}
                    value={field.value ?? null}
                    onChange={(id) => field.onChange(id ?? '')}
                    contacts={contacts}
                    excludeIds={usedContactIds}
                    searchPlaceholder={t('teachers.form.searchContact')}
                    emptyTitle={t('teachers.form.noContacts')}
                    emptyHint={t('teachers.form.noContactsHint')}
                  />
                </FormControl>
                <TranslatedFormMessage messageKey={form.formState.errors.contactId?.message} />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teachers.field.employeeId')}</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={settings.autoGenerateId && !teacher} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teachers.field.specialization')}</FormLabel>
                  <FormControl>
                    <select {...field} className={FORM_SELECT}>
                      {TEACHER_SPECIALIZATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </FormControl>
                  <TranslatedFormMessage messageKey={form.formState.errors.specialization?.message} />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="joinDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teachers.field.joinDate')}</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <TranslatedFormMessage messageKey={form.formState.errors.joinDate?.message} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teachers.field.status')}</FormLabel>
                  <FormControl>
                    <select {...field} className={FORM_SELECT}>
                      {TEACHER_STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>{t(`teachers.status.${s}`)}</option>
                      ))}
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('teachers.field.qualification')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('teachers.field.notes')}</FormLabel>
                <FormControl>
                  <textarea {...field} rows={3} className={FORM_TEXTAREA} />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormModal>
  );
}
