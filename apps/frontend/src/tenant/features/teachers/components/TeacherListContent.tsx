import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { TeacherCustomField } from '@mms/shared';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTranslation } from '@/hooks/useTranslation';
import type { Teacher } from '@/lib/data/teachersData';
import { TeacherListRowActions } from '@/tenant/features/teachers/components/TeacherListRowActions';
import { School } from 'lucide-react';
import type { TeacherSortField } from '@/tenant/features/teachers/components/TeacherListTypes';

interface TeacherListContentProps {
  teachers: Teacher[];
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
  showSelectColumn: boolean;
  showActionsColumn: boolean;
  showSpecialization: boolean;
  showQualification: boolean;
  showJoinDate: boolean;
  showStatus: boolean;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  visibleCustomFields: TeacherCustomField[];
  statusConfig: Record<string, StatusBadgeConfigItem>;
  sortField: TeacherSortField;
  sortDir: 'asc' | 'desc';
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onSort: (field: TeacherSortField) => void;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onRequestDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
}

function getCustomFieldValue(teacher: Teacher, field: TeacherCustomField, t: ReturnType<typeof useTranslation>['t']): string {
  const fieldValue = (teacher as unknown as Record<string, unknown>)[field.id];
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    return t('common.notSpecified');
  }
  if (typeof fieldValue === 'boolean') {
    return fieldValue ? t('common.yes') : t('common.no');
  }
  return String(fieldValue);
}

export function TeacherListContent({
  teachers,
  selectedIds,
  allSelected,
  someSelected,
  showSelectColumn,
  showActionsColumn,
  showSpecialization,
  showQualification,
  showJoinDate,
  showStatus,
  showDeleted,
  canWrite,
  canDelete,
  visibleCustomFields,
  statusConfig,
  sortField,
  sortDir,
  getColumnWidth,
  onColumnResize,
  onSort,
  onSelectAll,
  onSelectOne,
  onView,
  onEdit,
  onRequestDelete,
  onRestore,
  onSms,
  onWhatsApp,
  onEmail,
}: TeacherListContentProps): React.JSX.Element {
  const { t } = useTranslation();

  const renderSortIcon = (field: TeacherSortField) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-25" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={School}
        title={showDeleted ? t('teachers.empty.trashTitle') : t('teachers.empty.title')}
        description={showDeleted ? t('teachers.empty.trashSubtitle') : t('teachers.empty.subtitle')}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
      <div className="space-y-3 p-3 md:hidden">
        {teachers.map((teacher, index) => {
          const teacherIdStr = String(teacher.id);
          const displayName = teacher.name || t('teachers.contactMissing');
          const isSelected = selectedIds.includes(teacherIdStr);
          return (
            <motion.article
              key={teacher.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`space-y-3 rounded-xl border border-border bg-card p-3 ${isSelected ? 'ring-1 ring-primary/20' : ''}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  {showSelectColumn && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectOne(teacherIdStr)}
                      aria-label={t('teachers.field.name')}
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto min-w-0 flex-1 items-center gap-2.5 p-0 text-start shadow-none hover:bg-transparent"
                    onClick={() => onView(teacher)}
                  >
                    <UserAvatar id={teacher.id} name={displayName} className="h-8 w-8 shrink-0 rounded-full text-xs font-semibold" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                      {teacher.employeeId && (
                        <p className="truncate text-xs text-muted-foreground">{teacher.employeeId}</p>
                      )}
                    </div>
                  </Button>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {showStatus && <StatusBadge status={teacher.status} config={statusConfig} size="sm" />}
                  {showActionsColumn && (
                    <TeacherListRowActions
                      teacher={teacher}
                      teacherId={teacherIdStr}
                      showDeleted={showDeleted}
                      canWrite={canWrite}
                      canDelete={canDelete}
                      onEdit={onEdit}
                      onRequestDelete={onRequestDelete}
                      onView={onView}
                      onRestore={onRestore}
                      onSms={onSms}
                      onWhatsApp={onWhatsApp}
                      onEmail={onEmail}
                    />
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {showSpecialization && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('teachers.field.specialization')}</dt>
                    <dd className="text-foreground">{teacher.specialization ?? t('common.notSpecified')}</dd>
                  </div>
                )}
                {showQualification && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('teachers.field.qualification')}</dt>
                    <dd className="text-foreground">{teacher.qualification ?? t('common.notSpecified')}</dd>
                  </div>
                )}
                {showJoinDate && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('teachers.field.joinDate')}</dt>
                    <dd className="text-foreground">
                      {teacher.joinDate ? formatDate(teacher.joinDate) : t('common.notSpecified')}
                    </dd>
                  </div>
                )}
                {visibleCustomFields.map((field) => (
                  <div key={field.id}>
                    <dt className="text-xs font-semibold text-muted-foreground">{field.label ?? field.id}</dt>
                    <dd className="text-foreground">{getCustomFieldValue(teacher, field, t)}</dd>
                  </div>
                ))}
              </dl>
            </motion.article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-muted/40 border-b border-border/50">
            <tr>
              {showSelectColumn && (
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={onSelectAll}
                  />
                </th>
              )}
              <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-3 text-start">
                <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort('name')}>
                  {t('teachers.field.name')} {renderSortIcon('name')}
                </Button>
              </ResizableTableHead>
              {showSpecialization && (
                <ResizableTableHead columnKey="specialization" width={getColumnWidth?.("specialization")} onResize={onColumnResize} className="px-4 py-3 text-start hidden sm:table-cell">
                  <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort('specialization')}>
                    {t('teachers.field.specialization')} {renderSortIcon('specialization')}
                  </Button>
                </ResizableTableHead>
              )}
              {showQualification && (
                <ResizableTableHead columnKey="qualification" width={getColumnWidth?.("qualification")} onResize={onColumnResize} className="px-4 py-3 text-start hidden md:table-cell">
                  <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort('qualification')}>
                    {t('teachers.field.qualification')} {renderSortIcon('qualification')}
                  </Button>
                </ResizableTableHead>
              )}
              {showJoinDate && (
                <ResizableTableHead columnKey="joinDate" width={getColumnWidth?.("joinDate")} onResize={onColumnResize} className="px-4 py-3 text-start hidden md:table-cell">
                  <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort('joinDate')}>
                    {t('teachers.field.joinDate')} {renderSortIcon('joinDate')}
                  </Button>
                </ResizableTableHead>
              )}
              {showStatus && (
                <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-3 text-start">
                  <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort('status')}>
                    {t('teachers.field.status')} {renderSortIcon('status')}
                  </Button>
                </ResizableTableHead>
              )}
              {visibleCustomFields.map((field) => (
                <ResizableTableHead key={field.id} columnKey={`custom:${field.id}`} width={getColumnWidth?.(`custom:${field.id}`)} onResize={onColumnResize} className="px-4 py-3 text-start hidden lg:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {field.label ?? field.id}
                  </span>
                </ResizableTableHead>
              ))}
              {showActionsColumn && <th className="px-4 py-3 w-10" scope="col"><span className="sr-only">{t('common.actions')}</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {teachers.map((teacher) => {
              const teacherIdStr = String(teacher.id);
              const displayName = teacher.name || t('teachers.contactMissing');
              const isSelected = selectedIds.includes(teacherIdStr);
              return (
                <tr key={teacher.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/[0.015]' : ''}`}>
                  {showSelectColumn && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelectOne(teacherIdStr)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto flex items-center gap-3 min-w-0 text-start w-full p-0 shadow-none hover:bg-transparent"
                      onClick={() => onView(teacher)}
                    >
                      <UserAvatar id={teacher.id} name={displayName} className="h-8 w-8 rounded-full text-xs font-semibold" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate hover:text-primary transition-colors">{displayName}</p>
                        {teacher.employeeId && (
                          <p className="text-xs text-muted-foreground">{teacher.employeeId}</p>
                        )}
                      </div>
                    </Button>
                  </td>
                  {showSpecialization && (
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{teacher.specialization ?? t('common.notSpecified')}</td>
                  )}
                  {showQualification && (
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{teacher.qualification ?? t('common.notSpecified')}</td>
                  )}
                  {showJoinDate && (
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {teacher.joinDate ? formatDate(teacher.joinDate) : t('common.notSpecified')}
                    </td>
                  )}
                  {showStatus && (
                    <td className="px-4 py-3">
                      <StatusBadge status={teacher.status} config={statusConfig} />
                    </td>
                  )}
                  {visibleCustomFields.map((field) => (
                    <td key={field.id} className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {getCustomFieldValue(teacher, field, t)}
                    </td>
                  ))}
                  {showActionsColumn && (
                    <td className="px-4 py-3">
                      <TeacherListRowActions
                        teacher={teacher}
                        teacherId={teacherIdStr}
                        showDeleted={showDeleted}
                        canWrite={canWrite}
                        canDelete={canDelete}
                        onEdit={onEdit}
                        onRequestDelete={onRequestDelete}
                        onView={onView}
                        onRestore={onRestore}
                        onSms={onSms}
                        onWhatsApp={onWhatsApp}
                        onEmail={onEmail}
                      />
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
