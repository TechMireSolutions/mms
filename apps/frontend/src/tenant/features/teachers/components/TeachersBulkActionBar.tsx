import { Briefcase, ChevronDown, IdCard, Users } from 'lucide-react';
import { TEACHERS_MODULE_MANIFEST, type Teacher } from '@mms/shared';
import { ModuleUniversalBulkActionBar } from '@/components/ui/ModuleUniversalBulkActionBar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { TeachersSelectionTargets } from '@/tenant/features/teachers/hooks/teachersSelectionTargets';

export interface TeachersBulkActionBarProps {
  selectedIds: string[];
  selectionTargets: TeachersSelectionTargets;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging?: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  specializationOptions?: readonly string[];
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onBulkStatusChange?: (status: string) => void;
  onBulkSpecializationChange?: (specialization: string) => void;
  onBulkPrintIdCards?: () => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  canExport?: boolean;
  onBulkExport?: () => void;
  bulkActions?: readonly string[];
  /** Disables the bulk status action while the status mutation is pending. */
  statusPending?: boolean;
  specializationPending?: boolean;
}

/** Teachers Work bulk bar — delegates core actions to ModuleUniversalBulkActionBar. */
export function TeachersBulkActionBar({
  selectedIds,
  selectionTargets,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  statusConfig,
  specializationOptions,
  onSms,
  onWhatsApp,
  onEmail,
  onBulkStatusChange,
  onBulkSpecializationChange,
  onBulkPrintIdCards,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  canExport = false,
  onBulkExport,
  bulkActions = TEACHERS_MODULE_MANIFEST.work.bulkActions,
  statusPending = false,
  specializationPending = false,
}: TeachersBulkActionBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleUniversalBulkActionBar<Teacher>
      selectedCount={selectedIds.length}
      viewingDeleted={showDeleted}
      canWrite={canWrite}
      canDelete={canDelete}
      canExport={canExport}
      canWriteMessaging={canWriteMessaging}
      leadingIcon={Users}
      i18nNamespace="teachers"
      bulkActions={bulkActions}
      onClearSelection={onClearSelection}
      onRequestBulkDelete={onRequestBulkDelete}
      onRequestBulkRestore={onRequestBulkRestore}
      onBulkExport={onBulkExport}
      statusConfig={statusConfig}
      onBulkStatusChange={onBulkStatusChange}
      statusPending={statusPending}
      messagingTargets={selectionTargets}
      onWhatsApp={onWhatsApp}
      onSms={onSms}
      onEmail={onEmail}
      extraActions={
        !showDeleted && (onBulkSpecializationChange || onBulkPrintIdCards) ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {canWrite &&
              bulkActions.includes('specialization') &&
              onBulkSpecializationChange &&
              specializationOptions &&
              specializationOptions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={specializationPending}
                      className="min-h-11 gap-1.5 px-3 font-medium text-xs border-border/60 hover:bg-muted/80"
                    >
                      <Briefcase className="w-3.5 h-3.5" aria-hidden />
                      <span>{t('teachers.bulkSpecialization')}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {specializationOptions.map((spec) => (
                      <DropdownMenuItem
                        key={spec}
                        onClick={() => onBulkSpecializationChange(spec)}
                        className="text-xs"
                      >
                        {spec}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            {onBulkPrintIdCards && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBulkPrintIdCards}
                className="min-h-11 gap-1.5 px-3 font-medium text-xs border-border/60 hover:bg-muted/80"
              >
                <IdCard className="w-3.5 h-3.5" aria-hidden />
                <span>{t('teachers.idCard.print')}</span>
              </Button>
            )}
          </div>
        ) : undefined
      }
    />
  );
}
