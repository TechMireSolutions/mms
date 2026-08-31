import React from 'react';
import type { ActivityLog } from '@mms/shared';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { UsersCommandMetrics } from '@/tenant/features/users/components/UsersCommandMetrics';
import { ActivityLogs } from '@/tenant/features/users/components/ActivityLogs';
import { useActivityLogs, useUsersCollection } from '@/tenant/features/users/hooks/useUsersApi';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTranslation } from '@/hooks/useTranslation';

import PinnedWidgets from '@/components/ui/reports/PinnedWidgets';

export default function UsersReport(): React.JSX.Element {
  const { t } = useTranslation();
  const activityQuery = useActivityLogs();
  const users = useUsersCollection();

  const logs = (() => {
    if (!activityQuery.data || activityQuery.data.status !== 200) return [];
    const body = activityQuery.data.body;
    if (Array.isArray(body)) return body as ActivityLog[];
    if (body && typeof body === 'object' && 'logs' in body && Array.isArray((body as { logs: unknown }).logs)) {
      return (body as { logs: ActivityLog[] }).logs;
    }
    return [];
  })() as ActivityLog[];

  if (activityQuery.isError) {
    return (
      <ErrorState
        title={t('users.loadFailed')}
        description={t('users.loadFailedHint')}
        onRetry={() => void activityQuery.refetch()}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <UsersCommandMetrics shown={users.length} />
        <ActivityLogs logs={logs} users={users} />
        <PinnedWidgets category="users" />
      </div>
    </ErrorBoundary>
  );
}
