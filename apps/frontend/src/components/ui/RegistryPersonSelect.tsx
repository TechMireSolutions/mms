import React, { useMemo } from 'react';
import { useStudentsCollection } from '@/hooks/useStudents';
import { useTeachersCollection } from '@/hooks/useTeachers';
import useTranslation from '@/hooks/useTranslation';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';

export interface RegistryPersonSelectProps {
  kind: 'student' | 'teacher';
  value: string;
  onChange: (id: string) => void;
  label: string;
  required?: boolean;
  excludeIds?: string[];
  id?: string;
}

export default function RegistryPersonSelect({
  kind,
  value,
  onChange,
  label,
  required = false,
  excludeIds = [],
  id,
}: RegistryPersonSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const students = useStudentsCollection();
  const teachers = useTeachersCollection();

  const options = useMemo(() => {
    const rows = kind === 'student' ? students : teachers;
    const excluded = new Set(excludeIds.map(String));
    return rows
      .filter((row) => !excluded.has(String(row.id)))
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [kind, students, teachers, excludeIds]);

  const placeholder = kind === 'student'
    ? t('registryPerson.selectStudent')
    : t('registryPerson.selectTeacher');

  return (
    <div>
      <label htmlFor={id} className={FORM_LABEL}>
        {label}{required ? ' *' : ''}
      </label>
      <select
        id={id}
        className={`${FORM_INPUT} cursor-pointer`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((row) => (
          <option key={String(row.id)} value={String(row.id)}>
            {row.name}
          </option>
        ))}
      </select>
    </div>
  );
}
