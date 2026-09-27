import { SearchableSelectField } from '@/components/ui/SearchableSelectField';
import React, { useState } from 'react';
import { useStudentsContractList } from '@/tenant/hooks/collections/students';
import { useFacultyContractList } from '@/tenant/hooks/collections/faculty';
import { useTranslation } from '@/hooks/useTranslation';

/** Dropdown page size — searchable select, not a full dump (refine via search when `hasMore`). */
const PERSON_SELECT_PAGE_SIZE = 50;

export interface RegistryPersonSelectProps {
  kind: 'student' | 'teacher' | 'faculty';
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
  const facultyEnabled = kind === 'teacher' || kind === 'faculty';

  const studentQuery = useStudentsContractList({
    page: 1,
    limit: PERSON_SELECT_PAGE_SIZE,
    search,
  }, studentsEnabled);

  const facultyQuery = useFacultyContractList({
    page: 1,
    limit: PERSON_SELECT_PAGE_SIZE,
    search,
  }, facultyEnabled);

  const studentPage = studentQuery.data;
  const facultyPage = facultyQuery.data;
  const activeQuery = studentsEnabled ? studentQuery : facultyQuery;

  const options = (() => {
    const rows: readonly { id: string | number; name?: string | null }[] = kind === 'student'
      ? (studentPage?.body?.students ?? [])
      : (facultyPage?.body?.faculty ?? facultyPage?.body?.teachers ?? []);
    const excluded = new Set(excludeIds.map(String));
    return rows
      .filter((row: { id: string | number; name?: string | null }) => !excluded.has(String(row.id)))
      .toSorted((a: { id: string | number; name?: string | null }, b: { id: string | number; name?: string | null }) => (a.name ?? '').localeCompare(b.name ?? ''));
  })();

  const hasMore = kind === 'student'
    ? Boolean(studentPage?.body?.hasMore)
    : Boolean(facultyPage?.body?.hasMore);

  const valueInOptions = options.some((row) => String(row.id) === value);

  const placeholder = kind === 'student'
    ? t('registryPerson.selectStudent')
    : t('registryPerson.selectTeacher');

  const fallbackId = React.useId();
  const sanitizedId = fallbackId.replace(/:/g, '');
  const selectId = id || `person-select-${sanitizedId}`;
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
    <SearchableSelectField
      id={selectId} label={label} required={required}
      search={search} onSearchChange={setSearch}
      searchLabel={t('registryPerson.searchPlaceholder')}
      searchPlaceholder={t('registryPerson.searchPlaceholder')}
      loadingLabel={t('common.loading')} isLoading={activeQuery.isFetching}
      error={activeQuery.isError ? t('errors.state.generic') : undefined}
      onRetry={() => { void activeQuery.refetch(); }} retryLabel={t('common.retry')}
      value={value} onChange={onChange} options={selectOptions} placeholder={placeholder}
      hint={hasMore ? t('registryPerson.refineSearch') : undefined}
    />
  );
}
