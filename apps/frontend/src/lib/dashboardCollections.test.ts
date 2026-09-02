import { describe, expect, it } from 'vitest';
import {
  filterDashboardCardWidgets,
  isDashboardWidgetModuleEnabled,
  resolveDashboardTrendMetric,
  isWidgetActiveForDashboard,
  filterDashboardWidgetsByCollection,
  getRequiredDashboardCollections,
  getActiveCustomCardIds,
  getPinnedDashboardWidgetCount,
} from '@/lib/dashboardCollections';

const cardWidget = (overrides: Record<string, unknown> = {}): any => ({
  id: 'w1',
  widgetType: 'card',
  role: 'admin',
  collection: 'students',
  isPinnedToDashboard: false,
  ...overrides,
});

describe('filterDashboardCardWidgets', () => {
  it('keeps only card-type widgets matching the dashboard role', () => {
    const widgets = [
      cardWidget({ id: 'a', role: 'admin' }),
      cardWidget({ id: 'b', role: 'teacher' }),
      { ...cardWidget({ id: 'c', role: 'admin' }), widgetType: 'chart' },
    ];
    const result = filterDashboardCardWidgets(widgets as never, 'admin');
    expect(result.map((w) => w.id)).toEqual(['a']);
  });
});

describe('isDashboardWidgetModuleEnabled', () => {
  it('returns true when the module is not disabled', () => {
    expect(isDashboardWidgetModuleEnabled(cardWidget({ collection: 'students' }), {})).toBe(true);
  });

  it('returns false when the module is disabled', () => {
    expect(
      isDashboardWidgetModuleEnabled(cardWidget({ collection: 'students' }), { students: false }),
    ).toBe(false);
  });

  it('returns true for unknown collections', () => {
    expect(isDashboardWidgetModuleEnabled(cardWidget({ collection: 'unknown' }), {})).toBe(true);
  });
});

describe('resolveDashboardTrendMetric', () => {
  it('uses id heuristics for custom cards', () => {
    expect(resolveDashboardTrendMetric('attendance-rate')).toBe('attendance');
    expect(resolveDashboardTrendMetric('fees-collected')).toBe('fees');
    expect(resolveDashboardTrendMetric('outstanding-balance')).toBe('outstanding');
    expect(resolveDashboardTrendMetric('hasanat-points')).toBe('hasanat');
    expect(resolveDashboardTrendMetric('sessions-count')).toBe('sessions');
  });

  it('returns undefined for unrecognized ids', () => {
    expect(resolveDashboardTrendMetric('random')).toBeUndefined();
  });
});

describe('isWidgetActiveForDashboard', () => {
  it('is active when pinned or a role-matching card', () => {
    expect(isWidgetActiveForDashboard(cardWidget({ isPinnedToDashboard: true }), 'admin')).toBe(true);
    expect(isWidgetActiveForDashboard(cardWidget({ role: 'admin' }), 'admin')).toBe(true);
    expect(isWidgetActiveForDashboard(cardWidget({ role: 'teacher' }), 'admin')).toBe(false);
  });
});

describe('filterDashboardWidgetsByCollection', () => {
  it('filters by collection and active state', () => {
    const widgets = [
      cardWidget({ id: 'a', collection: 'students', role: 'admin' }),
      cardWidget({ id: 'b', collection: 'students', role: 'teacher' }),
      cardWidget({ id: 'c', collection: 'teachers', role: 'admin' }),
    ];
    const result = filterDashboardWidgetsByCollection(widgets as never, 'students', 'admin');
    expect(result.map((w) => w.id)).toEqual(['a']);
  });
});

describe('getRequiredDashboardCollections', () => {
  it('collects collections from active widgets', () => {
    const widgets = [
      cardWidget({ id: 'a', collection: 'students', role: 'admin' }),
      cardWidget({ id: 'b', collection: 'teachers', role: 'teacher' }),
    ];
    const required = getRequiredDashboardCollections(widgets as never, 'admin');
    expect(required.has('students')).toBe(true);
    expect(required.has('teachers')).toBe(false);
  });
});

describe('getActiveCustomCardIds', () => {
  it('returns non-seeded active card ids', () => {
    const widgets = [
      cardWidget({ id: 'custom-1', role: 'admin' }),
      cardWidget({ id: 'def-card-1', role: 'admin' }),
    ];
    const ids = getActiveCustomCardIds(widgets as never, 'admin');
    expect(ids).toEqual(['custom-1']);
  });
});

describe('getPinnedDashboardWidgetCount', () => {
  it('counts pinned non-card widgets', () => {
    const widgets = [
      { isPinnedToDashboard: true, widgetType: 'chart' },
      { isPinnedToDashboard: true, widgetType: 'card' },
      { isPinnedToDashboard: false, widgetType: 'chart' },
    ];
    expect(getPinnedDashboardWidgetCount(widgets as never)).toBe(1);
  });
});
