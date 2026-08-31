import type { UserExportColumn, UsersListQuery } from '@mms/shared';
import { startServerUsersCsvExport } from '@/lib/backgroundJobs/startServerUsersCsvExport';
import { useModuleServerCsvExportActions } from '@/lib/backgroundJobs/useModuleServerCsvExportActions';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

type ExportAuditScope = 'all' | 'filtered' | 'selection';

export interface UseUsersExportActionsOptions {
  tableColumns: UserExportColumn[];
  canExport: boolean;
  search: string;
  roleFilter: string;
  statusFilter: string;
  viewingDeleted: boolean;
  selectedIds: string[];
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: ExportAuditScope;
    }) => Promise<unknown>;
  };
}

/** Server CSV export actions for Users Work. */
export function useUsersExportActions({
  tableColumns,
  canExport,
  search,
  roleFilter,
  statusFilter,
  viewingDeleted,
  selectedIds,
  logExportAudit,
}: UseUsersExportActionsOptions) {
  const { t } = useTranslation();

  const buildFilteredQuery = ((): UsersListQuery => ({
      search: search.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
    }));

  const onError = ((err: unknown) => {
      notify.error(t('users.exportFailed'), {
        description: err instanceof Error ? err.message : String(err),
      });
    });

  return useModuleServerCsvExportActions<UserExportColumn, UsersListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds,
    columns: tableColumns,
    filename: t('users.exportFilename'),
    label: t('users.jobs.exportLabelServer'),
    successMessage: t('users.exportSuccess'),
    auditScope: 'users.export_audit',
    filteredErrorScope: 'users.server_export_csv',
    selectionErrorScope: 'users.server_export_csv_selection',
    buildFilteredQuery,
    startExport: startServerUsersCsvExport,
    logExportAudit,
    onError,
  });
}

/** Default Work export columns. */
export function defaultUsersExportColumns(
  t: (
    key:
      | 'users.colUser'
      | 'users.fieldContactEmail'
      | 'users.colRole'
      | 'users.colStatus'
      | 'users.fieldPhone'
      | 'users.colLastLogin'
      | 'users.colCreated'
      | 'users.col2fa',
  ) => string,
): UserExportColumn[] {
  return [
    { id: 'name', label: t('users.colUser') },
    { id: 'email', label: t('users.fieldContactEmail') },
    { id: 'role', label: t('users.colRole') },
    { id: 'status', label: t('users.colStatus') },
    { id: 'phone', label: t('users.fieldPhone') },
    { id: 'lastLogin', label: t('users.colLastLogin') },
    { id: 'createdDate', label: t('users.colCreated') },
    { id: 'twoFactorEnabled', label: t('users.col2fa') },
  ];
}
