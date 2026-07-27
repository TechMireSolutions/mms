import React, { useMemo, useState } from 'react';
import {
  STUDENTS_MODULE_MANIFEST,
  TEACHERS_MODULE_MANIFEST,
} from '@mms/shared';
import { useStudentsPaginated } from '@/tenant/hooks/collections/students';
import { useTeachersPaginated } from '@/tenant/hooks/collections/teachers';
import { useTranslation } from '@/hooks/useTranslation';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { SearchBar } from '@/components/ui/SearchBar';
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
    limit: STUDENTS_MODULE_MANIFEST.maxPageSize,
    search,
    enabled: studentsEnabled,
  });

  const { data: teacherPage } = useTeachersPaginated({
    page: 1,
    limit: TEACHERS_MODULE_MANIFEST.maxPageSize,
    search,
    enabled: teachersEnabled,
  });

  const excludeIdsKey = excludeIds.join(',');

  const options = useMemo(() => {
    const rows = kind === 'student'
      ? (studentPage?.students ?? [])
      : (teacherPage?.teachers ?? []);
    const excluded = new Set(excludeIds.map(String));
    return rows
      .filter((row) => !excluded.has(String(row.id)))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [kind, studentPage, teacherPage, excludeIdsKey]);

  const hasMore = kind === 'student'
    ? Boolean(studentPage?.hasMore)
    : Boolean(teacherPage?.hasMore);

  const valueInOptions = options.some((row) => String(row.id) === value);

  const placeholder = kind === 'student'
    ? t('registryPerson.selectStudent')
    : t('registryPerson.selectTeacher');

  const fallbackId = React.useId();
  const sanitizedId = fallbackId.replace(/:/g, '');
  const selectId = id || `person-select-${sanitizedId}`;
  const searchInputId = `person-search-${sanitizedId}`;
  const searchInputName = `personSearchQuery-${sanitizedId}`;

  const selectOptions = useMemo(() => {
    const list = options.map((row) => ({
      value: String(row.id),
      label: row.name ?? String(row.id),
    }));
    if (value && !valueInOptions) {
      list.unshift({ value, label: value });
    }
    return list;
  }, [value, valueInOptions, options]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className={FORM_LABEL}>
        {label}{required ? ' *' : ''}
      </label>
      <SearchBar
        id={searchInputId}
        name={searchInputName}
        value={search}
        onChange={setSearch}
        placeholder={t('registryPerson.searchPlaceholder')}
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
