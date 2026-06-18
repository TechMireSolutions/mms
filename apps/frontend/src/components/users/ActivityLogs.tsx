import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import {
  ACTIVITY_ACTION_VALUES,
  formatDate,
  type ActivityLog,
  type SystemUser,
} from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import useGlobalSettings from '@/hooks/useGlobalSettings';
import { DatePicker } from '../ui/DatePicker';
import { ActivityActionBadge } from '@/components/users/UserBadges';

const PAGE_SIZE = 15;

export interface ActivityLogsProps {
  logs: ActivityLog[];
  users: SystemUser[];
}

export default function ActivityLogs({ logs, users }: ActivityLogsProps): React.JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const [search, setSearch] = useState('');
  const [userFilter, setUser] = useState('all');
  const [actionFilter, setAct] = useState('all');
  const [dateFrom, setFrom] = useState('');
  const [dateTo, setTo] = useState('');
  const [page, setPage] = useState(1);

  const userNameFor = (log: ActivityLog): string =>
    log.userName ?? users.find((u) => u.id === log.userId)?.name ?? log.userId;

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (userFilter !== 'all' && l.userId !== userFilter) return false;
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (dateFrom && l.ts < dateFrom) return false;
      if (dateTo && l.ts > `${dateTo}T23:59:59`) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!userNameFor(l).toLowerCase().includes(q) && !l.detail.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, userFilter, actionFilter, dateFrom, dateTo, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmtTs = (ts: string): string => formatDate(ts, globalSettings.dateFormat, false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('users.activitySearch')}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={userFilter}
          onChange={(e) => setUser(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          aria-label={t('users.activityFilterUser')}
        >
          <option value="all">{t('users.activityAllUsers')}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setAct(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          aria-label={t('users.activityFilterAction')}
        >
          <option value="all">{t('users.activityAllActions')}</option>
          {ACTIVITY_ACTION_VALUES.map((a) => (
            <option key={a} value={a}>
              {t(`users.action.${a === 'login_failed' ? 'loginFailed' : a === 'role_change' ? 'roleChange' : a}`)}
            </option>
          ))}
        </select>
        <DatePicker value={dateFrom} onChange={setFrom} className="text-sm" />
        <DatePicker value={dateTo} onChange={setTo} className="text-sm" />
      </div>

      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
          <Activity className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{t('users.activityEmpty')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/60">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                  {t('users.activityColTime')}
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                  {t('users.activityColUser')}
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                  {t('users.activityColAction')}
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                  {t('users.activityColDetail')}
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                  {t('users.activityColIp')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((l) => (
                <tr key={l.id} className="hover:bg-muted/20">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{fmtTs(l.ts)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-foreground">{userNameFor(l)}</td>
                  <td className="px-3 py-2.5">
                    <ActivityActionBadge action={l.action} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{l.detail}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('users.activityPageInfo', { page, total: totalPages, count: filtered.length })}</span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border p-1.5 disabled:opacity-40"
            aria-label={t('users.activityPrev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border p-1.5 disabled:opacity-40"
            aria-label={t('users.activityNext')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
