import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Edit2, Trash2, School, ChevronUp, ChevronDown,
  MessageSquare, MessageCircle, Mail, RotateCcw,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { DEFAULT_TEACHERS_SETTINGS, type AppTranslationKey, toTitleCase, formatDate } from '@mms/shared';
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';
import type { Teacher } from '@/lib/data/teachersData';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';


export interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  canWrite?: boolean;
  showDeleted?: boolean;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function TeacherList({
  teachers,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onSms,
  onWhatsApp,
  onEmail,
  canWrite = true,
  showDeleted = false,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [teachers.length, showDeleted]);

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

  const allSelected = sorted.length > 0 && selectedIds.length === sorted.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < sorted.length;
  const selectedTeachers = teachers.filter((teacher) => selectedIds.includes(String(teacher.id)));

  const handleSelectAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map((teacher) => String(teacher.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((previousSelectedIds) =>
      previousSelectedIds.includes(id)
        ? previousSelectedIds.filter((selectedId) => selectedId !== id)
        : [...previousSelectedIds, id],
    );
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/40 border-b border-border/50">
              <tr>
                {canWrite && (
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={someSelected ? 'indeterminate' : allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-3 text-start">
                  <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('name')}>
                    {t('teachers.field.name')} {renderSortIcon('name')}
                  </Button>
                </ResizableTableHead>
                {showSpecialization && (
                  <ResizableTableHead columnKey="specialization" width={getColumnWidth?.("specialization")} onResize={onColumnResize} className="px-4 py-3 text-start hidden sm:table-cell">
                    <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('specialization')}>
                      {t('teachers.field.specialization')} {renderSortIcon('specialization')}
                    </Button>
                  </ResizableTableHead>
                )}
                {showQualification && (
                  <ResizableTableHead columnKey="qualification" width={getColumnWidth?.("qualification")} onResize={onColumnResize} className="px-4 py-3 text-start hidden md:table-cell">
                    <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('qualification')}>
                      {t('teachers.field.qualification')} {renderSortIcon('qualification')}
                    </Button>
                  </ResizableTableHead>
                )}
                {showJoinDate && (
                  <ResizableTableHead columnKey="joinDate" width={getColumnWidth?.("joinDate")} onResize={onColumnResize} className="px-4 py-3 text-start hidden md:table-cell">
                    <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('joinDate')}>
                      {t('teachers.field.joinDate')} {renderSortIcon('joinDate')}
                    </Button>
                  </ResizableTableHead>
                )}
                {showStatus && (
                  <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-3 text-start">
                    <Button type="button" variant="ghost" className="h-auto p-0 hover:bg-transparent flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => handleSort('status')}>
                      {t('teachers.field.status')} {renderSortIcon('status')}
                    </Button>
                  </ResizableTableHead>
                )}
                {visibleCustomFields.map((field) => (
                  <ResizableTableHead key={field.id} columnKey={`custom:${field.id}`} width={getColumnWidth?.(`custom:${field.id}`)} onResize={onColumnResize} className="px-4 py-3 text-start hidden lg:table-cell">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {field.label ?? field.id}
                    </span>
                  </ResizableTableHead>
                ))}
                {canWrite && <th className="px-4 py-3 w-10" scope="col"><span className="sr-only">{t('common.actions')}</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sorted.map((teacher) => {
                const teacherIdStr = String(teacher.id);
                const displayName = teacher.name || t('teachers.contactMissing');
                const isSelected = selectedIds.includes(teacherIdStr);
                return (
                <tr key={teacher.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/[0.015]' : ''}`}>
                  {canWrite && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(teacherIdStr)}
                      />
                    </td>
                  )}
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
                          {showDeleted ? (
                            onRestore && (
                              <DropdownMenuItem onClick={() => onRestore(teacherIdStr)}>
                                <RotateCcw className="w-3.5 h-3.5 me-2" /> {t('teachers.restore')}
                              </DropdownMenuItem>
                            )
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(teacher)}>
                                <Edit2 className="w-3.5 h-3.5 me-2" /> {t('common.edit')}
                              </DropdownMenuItem>
                              {(onWhatsApp || onSms || onEmail) && <DropdownMenuSeparator />}
                              {onWhatsApp && (
                                <DropdownMenuItem onClick={() => onWhatsApp([teacher])}>
                                  <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> WhatsApp
                                </DropdownMenuItem>
                              )}
                              {onSms && (
                                <DropdownMenuItem onClick={() => onSms([teacher])}>
                                  <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> SMS
                                </DropdownMenuItem>
                              )}
                              {onEmail && (
                                <DropdownMenuItem onClick={() => onEmail([teacher])}>
                                  <Mail className="w-3.5 h-3.5 me-2 text-primary" /> Email
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(teacherIdStr)}>
                                <Trash2 className="w-3.5 h-3.5 me-2" /> {t('common.delete')}
                              </DropdownMenuItem>
                            </>
                          )}
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

      <AnimatePresence>
        {canWrite && selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 end-6 z-40 bg-card/95 border border-primary/20 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex items-center gap-3 border-s-4 border-s-primary"
          >
            <span className="text-xs font-bold text-foreground ps-1">
              {t('teachers.selectedCount', { count: selectedIds.length })}
            </span>
            <div className="h-4 w-px bg-border" />
            {showDeleted ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (onBulkRestore) setConfirmBulkRestoreOpen(true); }}
                className="px-3 py-1.5 rounded-lg border-primary/40 text-primary text-[11px] font-semibold hover:bg-primary/10 transition-colors h-auto flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t('teachers.bulkRestore')}
              </Button>
            ) : (
              <>
                {onWhatsApp && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onWhatsApp(selectedTeachers)}
                    className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-success" /> WhatsApp
                  </Button>
                )}
                {onSms && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSms(selectedTeachers)}
                    className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-info" /> SMS
                  </Button>
                )}
                {onEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEmail(selectedTeachers)}
                    className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" /> Email
                  </Button>
                )}
                <div className="h-4 w-px bg-border" />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => { if (onBulkDelete) setConfirmBulkDeleteOpen(true); }}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-semibold hover:bg-destructive/90 transition-colors h-auto"
                >
                  {t('common.delete')}
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmAlertDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={setConfirmBulkDeleteOpen}
        title={t('common.delete')}
        description={t('teachers.bulkDeleteConfirm', { count: selectedIds.length })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          onBulkDelete?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkDeleteOpen(false);
        }}
      />

      <ConfirmAlertDialog
        open={confirmBulkRestoreOpen}
        onOpenChange={setConfirmBulkRestoreOpen}
        title={t('teachers.bulkRestore')}
        description={t('teachers.bulkRestoreConfirm', { count: selectedIds.length })}
        confirmLabel={t('teachers.restore')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          onBulkRestore?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkRestoreOpen(false);
        }}
      />
    </div>
  );
}
