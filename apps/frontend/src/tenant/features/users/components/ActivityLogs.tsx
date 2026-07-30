import React, { useState, useMemo, useCallback } from 'react';
import {
  type ActivityLog,
  type SystemUser,
} from '@mms/shared';
import { useLocalPagination } from '@/hooks/useLocalPagination';
import { ActivityLogsFilters } from '@/tenant/features/users/components/ActivityLogsFilters';
import { ActivityLogsList } from '@/tenant/features/users/components/ActivityLogsList';

const PAGE_SIZE = 15;

export interface ActivityLogsProps {
  logs: ActivityLog[];
  users: SystemUser[];
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function ActivityLogs({
  logs,
  users,
  getColumnWidth,
  onColumnResize,
}: ActivityLogsProps): React.JSX.Element {
  const [userFilter, setUser] = useState('all');
  const [actionFilter, setAct] = useState('all');
  const [dateFrom, setFrom] = useState('');
  const [dateTo, setTo] = useState('');

  const userNameFor = useCallback((log: ActivityLog): string =>
    log.userName ?? users.find((user) => user.id === log.userId)?.name ?? log.userId, [users]);

  const baseFilteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (userFilter !== 'all' && log.userId !== userFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (dateFrom && log.ts < dateFrom) return false;
      if (dateTo && log.ts > `${dateTo}T23:59:59`) return false;
      return true;
    });
  }, [logs, userFilter, actionFilter, dateFrom, dateTo]);

  const {
    searchQuery: search,
    setSearchQuery: setSearch,
    currentPage: page,
    setCurrentPage: setPage,
    paginatedItems: paginated,
    filteredItems: filtered,
    totalPages,
  } = useLocalPagination({
    items: baseFilteredLogs,
    pageSize: PAGE_SIZE,
    searchFields: (log) => [userNameFor(log), log.detail],
  });

  return (
    <div className="space-y-4">
      <ActivityLogsFilters
        search={search}
        onSearchChange={setSearch}
        userFilter={userFilter}
        onUserFilterChange={setUser}
        actionFilter={actionFilter}
        onActionFilterChange={setAct}
        dateFrom={dateFrom}
        onDateFromChange={setFrom}
        dateTo={dateTo}
        onDateToChange={setTo}
        users={users}
      />

      <ActivityLogsList
        paginated={paginated}
        filteredCount={filtered.length}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        userNameFor={userNameFor}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
      />
    </div>
  );
}
