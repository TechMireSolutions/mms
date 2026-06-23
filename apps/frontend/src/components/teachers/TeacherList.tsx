import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Edit2, Trash2, School, ChevronUp, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import useTranslation from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { formatDate } from '@/lib/db';
import { DEFAULT_TEACHERS_SETTINGS, type AppTranslationKey } from '@mms/shared';
import { useTeacherConfig } from '@/hooks/useTeacherConfig';
import type { Teacher } from '@/lib/data/teachersData';

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-info/15 text-info',
  'bg-success/15 text-success',
  'bg-warning/15 text-warning',
  'bg-secondary/15 text-secondary',
] as const;

function TeacherAvatar({ teacher, fallback }: { teacher: Teacher; fallback: string }): React.JSX.Element {
  const displayName = teacher.name || fallback;
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const colorIndex = Math.abs(displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];

  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${colorClass}`}>
      {initials}
    </div>
  );
}

export interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
  canWrite?: boolean;
  isColumnVisible?: (key: string) => boolean;
}

export default function TeacherList({
  teachers,
  onEdit,
  onDelete,
  canWrite = true,
  isColumnVisible,
}: TeacherListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, statuses } = useTeacherConfig();
  const customFields = settings.customFields ?? [];
  const sortedCustomFields = useMemo(() => {
    const order = settings.fieldOrder ?? DEFAULT_TEACHERS_SETTINGS.fieldOrder ?? [];
    const orderMap = Object.fromEntries(order.map((id, index) => [id, index]));
    return [...customFields].sort((a, b) => {
      const ai = orderMap[a.id] ?? 9999;
      const bi = orderMap[b.id] ?? 9999;
      return ai - bi;
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
    const map: Record<string, { label: string; cls: string }> = {};
    const list = statuses.length > 0 ? statuses : ['active', 'inactive', 'on_leave'];
    for (const s of list) {
      const translationKey = `teachers.status.${s}` as AppTranslationKey;
      const translated = t(translationKey);
      const label = translated === translationKey ? s.charAt(0).toUpperCase() + s.slice(1) : translated;
      
      let cls: string = SEMANTIC_BADGE.muted;
      if (s === 'active') cls = SEMANTIC_BADGE.success;
      else if (s === 'on_leave') cls = SEMANTIC_BADGE.warning;
      else if (s === 'inactive') cls = SEMANTIC_BADGE.muted;

      map[s] = { label, cls };
    }
    return map;
  }, [statuses, t]);
  const [sortField, setSortField] = useState<
    'name' | 'specialization' | 'qualification' | 'status' | 'joinDate'
  >('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const list = [...teachers];
    list.sort((a, b) => {
      const av = sortField === 'name'
        ? (a.name ?? '').toLowerCase()
        : String(a[sortField] ?? '');
      const bv = sortField === 'name'
        ? (b.name ?? '').toLowerCase()
        : String(b[sortField] ?? '');
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [teachers, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
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
                <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('name')}>
                  {t('teachers.field.name')} {renderSortIcon('name')}
                </button>
              </th>
              {showSpecialization && (
                <th className="px-4 py-3 text-start hidden sm:table-cell">
                  <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('specialization')}>
                    {t('teachers.field.specialization')} {renderSortIcon('specialization')}
                  </button>
                </th>
              )}
              {showQualification && (
                <th className="px-4 py-3 text-start hidden md:table-cell">
                  <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('qualification')}>
                    {t('teachers.field.qualification')} {renderSortIcon('qualification')}
                  </button>
                </th>
              )}
              {showJoinDate && (
                <th className="px-4 py-3 text-start hidden md:table-cell">
                  <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('joinDate')}>
                    {t('teachers.field.joinDate')} {renderSortIcon('joinDate')}
                  </button>
                </th>
              )}
              {showStatus && (
                <th className="px-4 py-3 text-start">
                  <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('status')}>
                    {t('teachers.field.status')} {renderSortIcon('status')}
                  </button>
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
                    <TeacherAvatar teacher={teacher} fallback={displayName} />
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
                  const val = (teacher as unknown as Record<string, unknown>)[field.id];
                  let displayVal = '—';
                  if (val !== undefined && val !== null && val !== '') {
                    displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
                  }
                  return (
                    <td key={field.id} className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {displayVal}
                    </td>
                  );
                })}
                {canWrite && (
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label={t('common.actions')}>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
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
