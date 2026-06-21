import React, { useMemo, useState } from 'react';
import {
  STUDENTS_MODULE_CONTRACT,
  TEACHERS_MODULE_CONTRACT,
} from '@mms/shared';
import { useStudentsPaginated } from '@/hooks/useStudents';
import { useTeachersPaginated } from '@/hooks/useTeachers';
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
  const [search, setSearch] = useState('');

  const studentsEnabled = kind === 'student';
  const teachersEnabled = kind === 'teacher';

  const { data: studentPage } = useStudentsPaginated({
    page: 1,
    limit: STUDENTS_MODULE_CONTRACT.maxPageSize,
    search,
    enabled: studentsEnabled,
  });

  const { data: teacherPage } = useTeachersPaginated({
    page: 1,
    limit: TEACHERS_MODULE_CONTRACT.maxPageSize,
    search,
    enabled: teachersEnabled,
  });

  const options = useMemo(() => {
    const rows = kind === 'student'
      ? (studentPage?.students ?? [])
      : (teacherPage?.teachers ?? []);
    const excluded = new Set(excludeIds.map(String));
    return rows
      .filter((row) => !excluded.has(String(row.id)))
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [kind, studentPage, teacherPage, excludeIds]);

  const hasMore = kind === 'student'
    ? Boolean(studentPage?.hasMore)
    : Boolean(teacherPage?.hasMore);

  const valueInOptions = options.some((row) => String(row.id) === value);

  const placeholder = kind === 'student'
    ? t('registryPerson.selectStudent')
    : t('registryPerson.selectTeacher');

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={FORM_LABEL}>
        {label}{required ? ' *' : ''}
      </label>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('registryPerson.searchPlaceholder')}
        className={`${FORM_INPUT} text-xs`}
        aria-label={t('registryPerson.searchPlaceholder')}
      />
      <select
        id={id}
        className={`${FORM_INPUT} cursor-pointer`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {value && !valueInOptions && (
          <option value={value}>{value}</option>
        )}
        {options.map((row) => (
          <option key={String(row.id)} value={String(row.id)}>
            {row.name}
          </option>
        ))}
      </select>
      {hasMore && (
        <p className="text-[10px] text-muted-foreground">{t('registryPerson.refineSearch')}</p>
      )}
    </div>
  );
}
