import React from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, type ActivityLog } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActivityActionBadge } from '@/tenant/features/users/components/UserBadges';
import { Button } from '@/components/ui/button';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';

export interface ActivityLogsListProps {
  paginated: ActivityLog[];
  filteredCount: number;
  page: number;
  totalPages: number;
  onPageChange: (updater: (currentPage: number) => number) => void;
  userNameFor: (log: ActivityLog) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function ActivityLogsList({
  paginated,
  filteredCount,
  page,
  totalPages,
  onPageChange,
  userNameFor,
  getColumnWidth,
  onColumnResize,
}: ActivityLogsListProps): React.JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const fmtTs = (ts: string): string => formatDate(ts, globalSettings.dateFormat, false);

  if (paginated.length === 0) {
    return (
      <EmptyState variant="dashed" title={t('users.activityEmpty')} icon={Activity} compact />
    );
  }

  return (
    <>
      <Card accentColor="primary" className="p-0 overflow-hidden">
        <div className="space-y-3 p-3 md:hidden">
          {paginated.map((log) => (
            <article
              key={log.id}
              className="space-y-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{userNameFor(log)}</p>
                  <p className="text-xs text-muted-foreground">{fmtTs(log.ts)}</p>
                </div>
                <ActivityActionBadge action={log.action} />
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t('users.activityColDetail')}</dt>
                  <dd className="text-xs text-muted-foreground">{log.detail}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t('users.activityColIp')}</dt>
                  <dd className="font-mono text-xs text-muted-foreground">{log.ip}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm table-fixed">
            <thead className="border-b border-border bg-muted/60">
              <tr>
                <ResizableTableHead columnKey="time" width={getColumnWidth?.('time')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                  {t('users.activityColTime')}
                </ResizableTableHead>
                <ResizableTableHead columnKey="user" width={getColumnWidth?.('user')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                  {t('users.activityColUser')}
                </ResizableTableHead>
                <ResizableTableHead columnKey="action" width={getColumnWidth?.('action')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                  {t('users.activityColAction')}
                </ResizableTableHead>
                <ResizableTableHead columnKey="detail" width={getColumnWidth?.('detail')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                  {t('users.activityColDetail')}
                </ResizableTableHead>
                <ResizableTableHead columnKey="ip" width={getColumnWidth?.('ip')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                  {t('users.activityColIp')}
                </ResizableTableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{fmtTs(log.ts)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-foreground">{userNameFor(log)}</td>
                  <td className="px-3 py-2.5">
                    <ActivityActionBadge action={log.action} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{log.detail}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0">{t('users.activityPageInfo', { page, total: totalPages, count: filteredCount })}</span>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => onPageChange((currentPage) => currentPage - 1)}
            className="rounded-lg border border-border disabled:opacity-40 shadow-none"
            aria-label={t('users.activityPrev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => onPageChange((currentPage) => currentPage + 1)}
            className="rounded-lg border border-border disabled:opacity-40 shadow-none"
            aria-label={t('users.activityNext')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
