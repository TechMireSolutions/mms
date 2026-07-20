import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Edit2, Trash2, School, ChevronUp, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { formatDate } from '@/lib/db';
import { DEFAULT_TEACHERS_SETTINGS, type AppTranslationKey, toTitleCase } from '@mms/shared';
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';
import type { Teacher } from '@/lib/data/teachersData';
import { Button } from '@/components/ui/button';

import { UserAvatar } from '@/components/ui/UserAvatar';


export interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
  canWrite?: boolean;
  isColumnVisible?: (key: string) => boolean;
}

export function TeacherList({
  teachers,
  onEdit,
  onDelete,
  canWrite = true,
  isColumnVisible,
}: TeacherListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, statuses } = useTeacherConfig();
  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);
  const sortedCustomFields = useMemo(() => {
    const order = settings.fieldOrder ?? DEFAULT_TEACHERS_SETTINGS.fieldOrder ?? [];
    const orderByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));
    return [...customFields].sort((firstField, secondField) => {
      const firstFieldOrder = orderByFieldId[firstField.id] ?? 9999;
      const secondFieldOrder = orderByFieldId[secondField.id] ?? 9999;
      return firstFieldOrder - secondFieldOrder;
    });
  }, [customFields, settings.fieldOrder]);

  const showSpecialization = isColumnVisible ? isColumnVisible('specialization') : true;
  const showQualification = isColumnVisible ? isColumnVisible('qualification') : true;
  const showJoinDate = isColumnVisible ? isColumnVisible('joinDate') : true;
  const showStatus = isColumnVisible ? isColumnVisible('status') : true;
  const visibleCustomFields = sortedCustomFields.filter((field) =>
    isColumnVisible ? isColumnVisible(`custom:${field.id}`) : true,
  );

  const statusConfig = useMemo(() => {
    const configByStatus: Record<string, { label: string; cls: string }> = {};
    const statusValues = statuses.length > 0 ? statuses : ['active', 'inactive', 'on_leave'];
    for (const statusValue of statusValues) {
      const translationKey = `teachers.status.${statusValue}` as AppTranslationKey;
      const translated = t(translationKey);
      const label = translated === translationKey ? toTitleCase(statusValue) : translated;
      
      let cls: string = SEMANTIC_BADGE.muted;
      if (statusValue === 'active') cls = SEMANTIC_BADGE.success;
      else if (statusValue === 'on_leave') cls = SEMANTIC_BADGE.warning;
      else if (statusValue === 'inactive') cls = SEMANTIC_BADGE.muted;

      configByStatus[statusValue] = { label, cls };
    }
    return configByStatus;
  }, [statuses, t]);
  const [sortField, setSortField] = useState<
    'name' | 'specialization' | 'qualification' | 'status' | 'joinDate'
  >('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const sortedTeachers = [...teachers];
    sortedTeachers.sort((firstTeacher, secondTeacher) => {
      const firstSortValue = sortField === 'name'
        ? (firstTeacher.name ?? '').toLowerCase()
        : String(firstTeacher[sortField] ?? '');
      const secondSortValue = sortField === 'name'
        ? (secondTeacher.name ?? '').toLowerCase()
        : String(secondTeacher[sortField] ?? '');
      const comparison = firstSortValue.localeCompare(secondSortValue);
      return sortDir === 'asc' ? comparison : -comparison;
    });
    return sortedTeachers;
  }, [teachers, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-25" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={School}
        title={t('teachers.empty.title')}
        description={t('teachers.empty.subtitle')}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border/50">
            <tr>
               <th className="px-4 py-3 text-start">
                <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('name')}>
                  {t('teachers.field.name')} {renderSortIcon('name')}
                </Button>
              </th>
              {showSpecialization && (
                <th className="px-4 py-3 text-start hidden sm:table-cell">
                  <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('specialization')}>
                    {t('teachers.field.specialization')} {renderSortIcon('specialization')}
                  </Button>
                </th>
              )}
              {showQualification && (
                <th className="px-4 py-3 text-start hidden md:table-cell">
                  <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('qualification')}>
                    {t('teachers.field.qualification')} {renderSortIcon('qualification')}
                  </Button>
                </th>
              )}
              {showJoinDate && (
                <th className="px-4 py-3 text-start hidden md:table-cell">
                  <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('joinDate')}>
                    {t('teachers.field.joinDate')} {renderSortIcon('joinDate')}
                  </Button>
                </th>
              )}
              {showStatus && (
                <th className="px-4 py-3 text-start">
                  <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('status')}>
                    {t('teachers.field.status')} {renderSortIcon('status')}
                  </Button>
                </th>
              )}
              {visibleCustomFields.map((field) => (
                <th key={field.id} className="px-4 py-3 text-start hidden lg:table-cell">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {field.label ?? field.id}
                  </span>
                </th>
              ))}
              {canWrite && <th className="px-4 py-3 w-10" scope="col"><span className="sr-only">{t('common.actions')}</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((teacher) => {
              const displayName = teacher.name || t('teachers.contactMissing');
              return (
              <tr key={teacher.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar id={teacher.id} name={displayName} className="h-8 w-8 rounded-full text-xs font-semibold" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{displayName}</p>
                      {teacher.employeeId && (
                        <p className="text-[11px] text-muted-foreground">{teacher.employeeId}</p>
                      )}
                    </div>
                  </div>
                </td>
                {showSpecialization && (
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{teacher.specialization ?? '—'}</td>
                )}
                {showQualification && (
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{teacher.qualification ?? '—'}</td>
                )}
                {showJoinDate && (
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {teacher.joinDate ? formatDate(teacher.joinDate) : '—'}
                  </td>
                )}
                {showStatus && (
                  <td className="px-4 py-3">
                    <StatusBadge status={teacher.status} config={statusConfig} />
                  </td>
                )}
                {visibleCustomFields.map((field) => {
                  const fieldValue = (teacher as unknown as Record<string, unknown>)[field.id];
                  let displayValue = '—';
                  if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                    displayValue = typeof fieldValue === 'boolean' ? (fieldValue ? 'Yes' : 'No') : String(fieldValue);
                  }
                  return (
                    <td key={field.id} className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {displayValue}
                    </td>
                  );
                })}
                {canWrite && (
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={t('common.actions')}>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(teacher)}>
                          <Edit2 className="w-3.5 h-3.5 me-2" /> {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(String(teacher.id))}>
                          <Trash2 className="w-3.5 h-3.5 me-2" /> {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
