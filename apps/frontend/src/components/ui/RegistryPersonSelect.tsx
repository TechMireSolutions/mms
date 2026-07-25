import React, { useMemo, useState } from 'react';
import {
  STUDENTS_MODULE_CONTRACT,
  TEACHERS_MODULE_CONTRACT,
} from '@mms/shared';
import { useStudentsPaginated } from '@/tenant/features/students/hooks/useStudents';
import { useTeachersPaginated } from '@/tenant/features/teachers/hooks/useTeachers';
import { useTranslation } from '@/hooks/useTranslation';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';

export interface RegistryPersonSelectProps {
  kind: 'student' | 'teacher';
  value: string;
  onChange: (id: string) => void;
  label: string;
  required?: boolean;
  excludeIds?: string[];
  id?: string;
}

export function RegistryPersonSelect({
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

  const fallbackId = React.useId();
  const selectId = id || `person-select-${fallbackId.replace(/:/g, "")}`;
  const searchInputId = `person-search-${fallbackId.replace(/:/g, "")}`;
  const searchInputName = `personSearchQuery-${fallbackId.replace(/:/g, "")}`;

  const selectOptions = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    if (value && !valueInOptions) {
      list.push({ value, label: value });
    }
    options.forEach((row) => {
      list.push({ value: String(row.id), label: row.name ?? String(row.id) });
    });
    return list;
  }, [value, valueInOptions, options]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className={FORM_LABEL}>
        {label}{required ? ' *' : ''}
      </label>
      <Input
        type="search"
        id={searchInputId}
        name={searchInputName}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('registryPerson.searchPlaceholder')}
        className="text-xs"
        aria-label={t('registryPerson.searchPlaceholder')}
      />
      <FormSelect
        id={selectId}
        value={value}
        onChange={onChange}
        options={selectOptions}
        placeholder={placeholder}
      />
      {hasMore && (
        <p className="text-[10px] text-muted-foreground">{t('registryPerson.refineSearch')}</p>
      )}
    </div>
  );
}
