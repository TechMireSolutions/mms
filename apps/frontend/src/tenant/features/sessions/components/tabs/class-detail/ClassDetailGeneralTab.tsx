import React from 'react';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL, FORM_INPUT_ERROR } from '@/components/ui/formStyles';
import { FieldErrorMessage, RequiredMark } from '@/components/ui/FormPrimitives';
import type { Teacher } from '@mms/shared';
import type { Class } from '@/lib/data/sessionsData';
import { formatTeacherDisplayName } from './types';

interface ClassDetailGeneralTabProps {
  classDraft: Class;
  updateDraft: <K extends keyof Class>(field: K, value: Class[K]) => void;
  errors: Record<string, string>;
  allTeachers: Teacher[];
}

export function ClassDetailGeneralTab({
  classDraft,
  updateDraft,
  errors,
  allTeachers,
}: ClassDetailGeneralTabProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={FORM_LABEL} htmlFor="class-name">
            Class Name<RequiredMark />
          </label>
          <Input
            id="class-name"
            name="name"
            value={classDraft.name}
            onChange={(e) => updateDraft('name', e.target.value)}
            placeholder="e.g. Hifz Level 1, Nazra Boys"
            aria-invalid={Boolean(errors.name)}
            className={errors.name ? FORM_INPUT_ERROR : undefined}
          />
          <FieldErrorMessage message={errors.name} />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="class-gender">
            Gender Group
          </label>
          <FormSelect
            id="class-gender"
            name="gender"
            value={classDraft.gender}
            onChange={(val) => updateDraft('gender', val as 'male' | 'female' | 'mixed')}
            options={[
              { value: 'mixed', label: 'Mixed / Co-ed' },
              { value: 'male', label: 'Male Only' },
              { value: 'female', label: 'Female Only' },
            ]}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={FORM_LABEL} htmlFor="class-min-age">Minimum Age</label>
          <Input
            id="class-min-age"
            name="minAge"
            type="number"
            min={0}
            max={100}
            value={classDraft.minAge ?? 0}
            onChange={(e) => updateDraft('minAge', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="class-max-age">Maximum Age</label>
          <Input
            id="class-max-age"
            name="maxAge"
            type="number"
            min={0}
            max={100}
            value={classDraft.maxAge ?? 0}
            onChange={(e) => updateDraft('maxAge', parseInt(e.target.value, 10) || 0)}
            aria-invalid={Boolean(errors.maxAge)}
            className={errors.maxAge ? FORM_INPUT_ERROR : undefined}
          />
          <FieldErrorMessage message={errors.maxAge} />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="class-calc-date">Age Calculation Date</label>
          <Input
            id="class-calc-date"
            type="date"
            value={classDraft.ageCalculationDate}
            onChange={(e) => updateDraft('ageCalculationDate', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={FORM_LABEL} htmlFor="class-capacity">
            Maximum Students (Capacity)
          </label>
          <Input
            id="class-capacity"
            type="number"
            min={0}
            value={classDraft.maxStudents ?? 0}
            onChange={(e) => updateDraft('maxStudents', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="class-deadline">Enrollment Deadline</label>
          <Input
            id="class-deadline"
            type="date"
            value={classDraft.enrollmentDeadline}
            onChange={(e) => updateDraft('enrollmentDeadline', e.target.value)}
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="class-status">Status</label>
          <FormSelect
            id="class-status"
            name="status"
            value={classDraft.status}
            onChange={(val) => updateDraft('status', val as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={FORM_LABEL} htmlFor="class-teacher">Lead Instructor</label>
          <FormSelect
            id="class-teacher"
            name="teacherId"
            value={classDraft.teacherId || ''}
            onChange={(val) => updateDraft('teacherId', val)}
            options={[
              { value: '', label: 'Unassigned' },
              ...allTeachers.map((t) => ({
                value: String(t.id),
                label: formatTeacherDisplayName(t),
              })),
            ]}
            className="w-full"
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="class-room">Classroom / Hall</label>
          <Input
            id="class-room"
            value={classDraft.room || ''}
            onChange={(e) => updateDraft('room', e.target.value)}
            placeholder="e.g. Hall A, Room 102"
          />
        </div>
      </div>
    </div>
  );
}
