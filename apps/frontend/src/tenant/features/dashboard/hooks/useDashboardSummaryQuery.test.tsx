import React, { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchDashboardSummaryAsync = vi.hoisted(() => vi.fn());

vi.mock('./dashboardApi', () => ({ fetchDashboardSummaryAsync }));
vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));
vi.mock('@/lib/api', () => ({ tsrClient: {} }));

import {
  DASHBOARD_SUMMARY_QUERY_KEY,
  useDashboardSummaryQuery,
} from './useDashboardSetupConfig';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('useDashboardSummaryQuery', () => {
  beforeEach(() => {
    fetchDashboardSummaryAsync.mockReset();
  });

  it('retains the last successful snapshot when a background refresh fails', async () => {
    const firstSummary = { students: { total: 1441 } };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queryKey = DASHBOARD_SUMMARY_QUERY_KEY('2026-08-31', 'admin');
    queryClient.setQueryData(queryKey, firstSummary);
    const container = document.createElement('div');
    const root = createRoot(container);
    let currentSummary: Record<string, unknown> | undefined;
    let isError = false;

    function Probe(): React.JSX.Element {
      const query = useDashboardSummaryQuery('2026-08-31', 'admin', {
        refetchInterval: 3_600_000,
      });
      currentSummary = query.summary;
      isError = query.isError;
      return <div>{String((query.summary?.students as { total?: number } | undefined)?.total ?? '')}</div>;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Probe />
        </QueryClientProvider>,
      );
    });
    expect(container.textContent).toBe('1441');

    fetchDashboardSummaryAsync.mockRejectedValueOnce(new Error('temporary gateway failure'));
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey,
      });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(currentSummary).toEqual(firstSummary);
    expect(container.textContent).toBe('1441');
    expect(isError).toBe(true);

    await act(async () => {
      root.unmount();
    });
    queryClient.clear();
  });
});
