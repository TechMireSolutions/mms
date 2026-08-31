import React, { useState } from 'react';
import { useStudentsContractList } from '@/tenant/features/students/hooks/useStudentsTsrHooks';
import { useTeachersContractList } from '@/tenant/features/teachers/hooks/useTeachersTsrHooks';
import { useTranslation } from '@/hooks/useTranslation';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { SearchBar } from '@/components/ui/SearchBar';
import { FormSelect } from '@/components/ui/FormSelect';

/** Dropdown page size — searchable select, not a full dump (refine via search when `hasMore`). */
const PERSON_SELECT_PAGE_SIZE = 50;

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

  const { data: studentPage } = useStudentsContractList({
    page: 1,
    limit: PERSON_SELECT_PAGE_SIZE,
    search,
  }, studentsEnabled);

  const { data: teacherPage } = useTeachersContractList({
    page: 1,
    limit: PERSON_SELECT_PAGE_SIZE,
    search,
  }, teachersEnabled);

  const excludeIdsKey = excludeIds.join(',');

  const options = (() => {
    const rows = (kind === 'student'
      ? (studentPage?.body?.students ?? [])
      : (teacherPage?.body?.teachers ?? [])) as Array<{ id: string | number; name?: string | null }>;
    const excluded = new Set(excludeIds.map(String));
    return rows
      .filter((row: { id: string | number; name?: string | null }) => !excluded.has(String(row.id)))
      .sort((a: { id: string | number; name?: string | null }, b: { id: string | number; name?: string | null }) => (a.name ?? '').localeCompare(b.name ?? ''));
  })() as Array<{ id: string | number; name?: string | null }>;

  const hasMore = kind === 'student'
    ? Boolean(studentPage?.body?.hasMore)
    : Boolean(teacherPage?.body?.hasMore);

  const valueInOptions = options.some((row) => String(row.id) === value);

  const placeholder = kind === 'student'
    ? t('registryPerson.selectStudent')
    : t('registryPerson.selectTeacher');

  const fallbackId = React.useId();
  const sanitizedId = fallbackId.replace(/:/g, '');
  const selectId = id || `person-select-${sanitizedId}`;
  const searchInputId = `person-search-${sanitizedId}`;
  const searchInputName = `personSearchQuery-${sanitizedId}`;

  const selectOptions = (() => {
    const list = options.map((row) => ({
      value: String(row.id),
      label: row.name ?? String(row.id),
    }));
    if (value && !valueInOptions) {
      list.unshift({ value, label: value });
    }
    return list;
  })();

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
        <p className="text-xs text-muted-foreground">{t('registryPerson.refineSearch')}</p>
      )}
    </div>
  );
}
