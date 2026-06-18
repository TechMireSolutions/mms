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
  const idx = teacher.id.charCodeAt(teacher.id.length - 1) % AVATAR_COLORS.length;
  return (
    <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[idx]} flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
  canWrite?: boolean;
}

export default function TeacherList({
  teachers,
  onEdit,
  onDelete,
  canWrite = true,
}: TeacherListProps): React.JSX.Element {
  const { t } = useTranslation();
  const statusConfig = useMemo(() => ({
    active: { label: t('teachers.status.active'), cls: SEMANTIC_BADGE.success },
    inactive: { label: t('teachers.status.inactive'), cls: SEMANTIC_BADGE.muted },
    on_leave: { label: t('teachers.status.on_leave'), cls: SEMANTIC_BADGE.warning },
  }), [t]);
  const [sortField, setSortField] = useState<'name' | 'specialization' | 'status' | 'joinDate'>('name');
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
              <th className="px-4 py-3 text-start hidden sm:table-cell">
                <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('specialization')}>
                  {t('teachers.field.specialization')} {renderSortIcon('specialization')}
                </button>
              </th>
              <th className="px-4 py-3 text-start hidden md:table-cell">
                <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('joinDate')}>
                  {t('teachers.field.joinDate')} {renderSortIcon('joinDate')}
                </button>
              </th>
              <th className="px-4 py-3 text-start">
                <button type="button" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => handleSort('status')}>
                  {t('teachers.field.status')} {renderSortIcon('status')}
                </button>
              </th>
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
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{teacher.specialization ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {teacher.joinDate ? formatDate(teacher.joinDate) : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={teacher.status} config={statusConfig} />
                </td>
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
