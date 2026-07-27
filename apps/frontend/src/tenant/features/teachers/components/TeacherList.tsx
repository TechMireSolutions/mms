import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Edit2, Trash2, School, ChevronUp, ChevronDown,
  MessageSquare, MessageCircle, Mail, RotateCcw, Eye, Tag,
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
import TeacherDetail from '@/tenant/features/teachers/components/TeacherDetail';

export type TeacherSortField = 'name' | 'specialization' | 'qualification' | 'status' | 'joinDate';

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
  onBulkStatusChange?: (ids: string[], status: string) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  selectionResetKey?: string | number;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  sortField?: TeacherSortField;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
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
  onBulkStatusChange,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  selectionResetKey,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  sortField: controlledSortField,
  sortDir: controlledSortDir,
  onSortChange,
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

  const [localSortField, setLocalSortField] = useState<TeacherSortField>('name');
  const [localSortDir, setLocalSortDir] = useState<'asc' | 'desc'>('asc');
  const sortField = controlledSortField ?? localSortField;
  const sortDir = controlledSortDir ?? localSortDir;
  const serverSorted = Boolean(onSortChange);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectionResetKey, showDeleted]);

  const sorted = useMemo(() => {
    if (serverSorted) return teachers;
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
  }, [teachers, sortField, sortDir, serverSorted]);

  const handleSort = (field: TeacherSortField) => {
    const resolvedDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
    if (onSortChange) {
      onSortChange(field, resolvedDir);
      return;
    }
    if (sortField === field) {
      setLocalSortDir(resolvedDir);
    } else {
      setLocalSortField(field);
      setLocalSortDir('asc');
    }
  };

  const renderSortIcon = (field: TeacherSortField) => {
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

  const showSelectColumn = canWrite || canDelete;
  const showActionsColumn = canWrite || canDelete || !showDeleted;

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
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/40 border-b border-border/50">
              <tr>
                {showSelectColumn && (
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
                {showActionsColumn && <th className="px-4 py-3 w-10" scope="col"><span className="sr-only">{t('common.actions')}</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sorted.map((teacher) => {
                const teacherIdStr = String(teacher.id);
                const displayName = teacher.name || t('teachers.contactMissing');
                const isSelected = selectedIds.includes(teacherIdStr);
                return (
                <tr key={teacher.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/[0.015]' : ''}`}>
                  {showSelectColumn && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(teacherIdStr)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto flex items-center gap-3 min-w-0 text-start w-full p-0 shadow-none hover:bg-transparent"
                      onClick={() => setViewTeacher(teacher)}
                    >
                      <UserAvatar id={teacher.id} name={displayName} className="h-8 w-8 rounded-full text-xs font-semibold" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate hover:text-primary transition-colors">{displayName}</p>
                        {teacher.employeeId && (
                          <p className="text-[11px] text-muted-foreground">{teacher.employeeId}</p>
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
                  {visibleCustomFields.map((field) => {
                    const fieldValue = (teacher as unknown as Record<string, unknown>)[field.id];
                    let displayValue = t('common.notSpecified');
                    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                      displayValue = typeof fieldValue === 'boolean'
                        ? (fieldValue ? t('common.yes') : t('common.no'))
                        : String(fieldValue);
                    }
                    return (
                      <td key={field.id} className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {displayValue}
                      </td>
                    );
                  })}
                  {showActionsColumn && (
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={t('common.actions')}>
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {showDeleted ? (
                            canDelete && onRestore && (
                              <DropdownMenuItem onClick={() => onRestore(teacherIdStr)}>
                                <RotateCcw className="w-3.5 h-3.5 me-2" /> {t('teachers.restore')}
                              </DropdownMenuItem>
                            )
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => setViewTeacher(teacher)}>
                                <Eye className="w-3.5 h-3.5 me-2" /> {t('teachers.list.viewDetails')}
                              </DropdownMenuItem>
                              {canWrite && (
                                <DropdownMenuItem onClick={() => onEdit(teacher)}>
                                  <Edit2 className="w-3.5 h-3.5 me-2" /> {t('common.edit')}
                                </DropdownMenuItem>
                              )}
                              {(onWhatsApp || onSms || onEmail) && <DropdownMenuSeparator />}
                              {onWhatsApp && (
                                <DropdownMenuItem onClick={() => onWhatsApp([teacher])}>
                                  <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> {t('teachers.list.actionWhatsApp')}
                                </DropdownMenuItem>
                              )}
                              {onSms && (
                                <DropdownMenuItem onClick={() => onSms([teacher])}>
                                  <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> {t('teachers.list.actionSms')}
                                </DropdownMenuItem>
                              )}
                              {onEmail && (
                                <DropdownMenuItem onClick={() => onEmail([teacher])}>
                                  <Mail className="w-3.5 h-3.5 me-2 text-primary" /> {t('teachers.list.actionEmail')}
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPendingDeleteId(teacherIdStr)}>
                                    <Trash2 className="w-3.5 h-3.5 me-2" /> {t('common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
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
        {showSelectColumn && selectedIds.length > 0 && (
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
              canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { if (onBulkRestore) setConfirmBulkRestoreOpen(true); }}
                  className="px-3 py-1.5 rounded-lg border-primary/40 text-primary text-[11px] font-semibold hover:bg-primary/10 transition-colors h-auto flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t('teachers.bulkRestore')}
                </Button>
              )
            ) : (
              <>
                {onWhatsApp && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onWhatsApp(selectedTeachers)}
                    className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-success" /> {t('teachers.list.actionWhatsApp')}
                  </Button>
                )}
                {onSms && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSms(selectedTeachers)}
                    className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-info" /> {t('teachers.list.actionSms')}
                  </Button>
                )}
                {onEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEmail(selectedTeachers)}
                    className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" /> {t('teachers.list.actionEmail')}
                  </Button>
                )}
                {canWrite && onBulkStatusChange && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
                      >
                        <Tag className="w-3.5 h-3.5 text-primary" /> {t('teachers.bulkStatus')} <ChevronDown className="w-3 h-3 ms-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {Object.keys(statusConfig).map((statusVal) => (
                        <DropdownMenuItem
                          key={statusVal}
                          onClick={() => {
                            onBulkStatusChange(selectedIds, statusVal);
                            setSelectedIds([]);
                          }}
                        >
                          <StatusBadge status={statusVal} config={statusConfig} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {canDelete && (
                  <>
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

      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title={t('teachers.confirmDeleteTitle')}
        description={t('teachers.confirmDeleteDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (pendingDeleteId) onDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />

      <AnimatePresence>
        {viewTeacher && (
          <TeacherDetail
            teacher={viewTeacher}
            onClose={() => setViewTeacher(null)}
            onEdit={canWrite && !showDeleted ? (teacherToEdit) => {
              setViewTeacher(null);
              onEdit(teacherToEdit);
            } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
