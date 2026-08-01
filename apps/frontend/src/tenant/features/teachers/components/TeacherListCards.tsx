import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { TeacherListRowActions } from "@/tenant/features/teachers/components/TeacherListRowActions";
import {
  getTeacherCustomFieldValue,
  type TeacherListContentProps,
} from "@/tenant/features/teachers/components/teacherListContentShared";

type TeacherListCardsProps = Omit<
  TeacherListContentProps,
  "allSelected" | "someSelected" | "sortField" | "sortDir" | "getColumnWidth" | "onColumnResize" | "onSort" | "onSelectAll"
>;

export function TeacherListCards(props: TeacherListCardsProps): React.JSX.Element {
  const {
    teachers,
    selectedIds,
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
    onSelectOne,
    onView,
    onEdit,
    onRequestDelete,
    onRestore,
    onSms,
    onWhatsApp,
    onEmail,
  } = props;
  const { t } = useTranslation();

  return (
      <div className="space-y-3 p-3">
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
                    <dd className="text-foreground">{getTeacherCustomFieldValue(teacher, field, t)}</dd>
                  </div>
                ))}
              </dl>
            </motion.article>
          );
        })}
      </div>
  );
}
