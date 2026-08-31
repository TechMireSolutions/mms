import React from 'react';
import { Activity } from 'lucide-react';
import { formatDate, type ActivityLog } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportDataGridContainer } from '@/tenant/components/moduleReports';
import { ActivityActionBadge } from '@/tenant/features/users/components/UserBadges';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WORK_SURFACE, WORK_SURFACE_INNER } from '@/components/ui/formStyles';
import { StatGrid, StatRow } from '@/components/ui/StatGrid';

export interface ActivityLogsListProps {
  paginated: ActivityLog[];
  filteredCount: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  userNameFor: (log: ActivityLog) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function ActivityLogsList({
  paginated,
  filteredCount,
  page,
  pageSize = 15,
  onPageChange,
  userNameFor,
  getColumnWidth,
  onColumnResize,
}: ActivityLogsListProps): React.JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const fmtTs = (ts: string): string => formatDate(ts, globalSettings.dateFormat, false);

  const exportColumns = (() => [
    { key: 'time', header: t('users.activityColTime') },
    { key: 'user', header: t('users.activityColUser') },
    { key: 'action', header: t('users.activityColAction') },
    { key: 'detail', header: t('users.activityColDetail') },
    { key: 'ip', header: t('users.activityColIp') },
  ])();

  const exportRows = (() => paginated.map((log) => ({
    time: fmtTs(log.ts),
    user: userNameFor(log),
    action: log.action,
    detail: log.detail,
    ip: log.ip,
  })))();

  if (paginated.length === 0) {
    return (
      <EmptyState variant="dashed" title={t('users.activityEmpty')} icon={Activity} compact />
    );
  }

  return (
    <ReportDataGridContainer
      title={t('users.activity')}
      columns={exportColumns}
      rows={exportRows}
      moduleId="users"
      page={page}
      total={filteredCount}
      limit={pageSize}
      onPageChange={onPageChange}
      i18nNamespace="users"
      paginationVariant="range"
    >
      <div className={WORK_SURFACE}>
        <div className="space-y-3 p-3 md:hidden">
          {paginated.map((log) => (
            <article
              key={log.id}
              className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{userNameFor(log)}</p>
                  <p className="text-xs text-muted-foreground">{fmtTs(log.ts)}</p>
                </div>
                <ActivityActionBadge action={log.action} />
              </div>
              <StatGrid columns="1">
                <StatRow
                  label={t('users.activityColDetail')}
                  value={log.detail}
                  ddClassName="text-xs text-muted-foreground"
                />
                <StatRow
                  label={t('users.activityColIp')}
                  value={log.ip}
                  ddClassName="font-mono text-xs text-muted-foreground"
                />
              </StatGrid>
            </article>
          ))}
        </div>
        <div className="hidden md:block">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="border-b border-border/60 hover:bg-muted/30">
                <ModuleTableHeaderCell columnKey="time" width={getColumnWidth?.('time')} onResize={onColumnResize} className="px-3 py-2.5">
                  {t('users.activityColTime')}
                </ModuleTableHeaderCell>
                <ModuleTableHeaderCell columnKey="user" width={getColumnWidth?.('user')} onResize={onColumnResize} className="px-3 py-2.5">
                  {t('users.activityColUser')}
                </ModuleTableHeaderCell>
                <ModuleTableHeaderCell columnKey="action" width={getColumnWidth?.('action')} onResize={onColumnResize} className="px-3 py-2.5">
                  {t('users.activityColAction')}
                </ModuleTableHeaderCell>
                <ModuleTableHeaderCell columnKey="detail" width={getColumnWidth?.('detail')} onResize={onColumnResize} className="px-3 py-2.5">
                  {t('users.activityColDetail')}
                </ModuleTableHeaderCell>
                <ModuleTableHeaderCell columnKey="ip" width={getColumnWidth?.('ip')} onResize={onColumnResize} className="px-3 py-2.5">
                  {t('users.activityColIp')}
                </ModuleTableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {paginated.map((log) => (
                <TableRow key={log.id} className="transition-colors hover:bg-muted/20">
                  <TableCell className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{fmtTs(log.ts)}</TableCell>
                  <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">{userNameFor(log)}</TableCell>
                  <TableCell className="px-3 py-2.5">
                    <ActivityActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{log.detail}</TableCell>
                  <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ReportDataGridContainer>
  );
}
