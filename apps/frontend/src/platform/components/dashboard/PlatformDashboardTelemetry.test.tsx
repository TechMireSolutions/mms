import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlatformDashboardTelemetry } from './PlatformDashboardTelemetry';

let mockTelemetryData = {
  dbPool: {
    utilizationRate: 25,
    activeCount: 5,
    totalCount: 20,
  },
  latencyMs: 42,
  memory: {
    rssMb: 128,
  },
  tenantDb: undefined as
    | {
        activeTenantsCount: number;
        totalTenantTransactions: number;
      }
    | undefined,
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return `${key}:${JSON.stringify(params)}`;
      }
      return key;
    },
  }),
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('@/platform/hooks/usePlatformTelemetry', () => ({
  usePlatformTelemetry: () => ({
    isLoading: false,
    data: mockTelemetryData,
  }),
}));

describe('PlatformDashboardTelemetry Component', () => {
  it('renders telemetry metrics grid with pool utilization, latency, and memory', () => {
    mockTelemetryData.tenantDb = undefined;
    const html = renderToStaticMarkup(<PlatformDashboardTelemetry />);

    expect(html).toContain('25%');
    expect(html).toContain('42ms');
    expect(html).toContain('128MB');
    expect(html).toContain('platform.telemetry.dbPoolLoad');
    expect(html).toContain('platform.telemetry.apiLatency');
    expect(html).toContain('platform.telemetry.clusterMemory');
    expect(html).toContain('platform.telemetry.rls100');
  });

  it('renders tenant metrics when tenantDb details are present', () => {
    mockTelemetryData = {
      ...mockTelemetryData,
      tenantDb: {
        activeTenantsCount: 4,
        totalTenantTransactions: 7,
      },
    };
    const html = renderToStaticMarkup(<PlatformDashboardTelemetry />);

    expect(html).toContain('4 Tenants');
    expect(html).toContain('7 active tx · RLS 100%');
  });
});
