import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DashboardWidgetDto } from '@mms/shared';
import {
  listDashboardWidgetsByWorkspace,
  upsertDashboardWidgetsForWorkspace,
  deleteDashboardWidgetById,
  reorderDashboardWidgetsForWorkspace,
  listAllDashboardWidgetsByWorkspace,
  replaceDashboardWidgetsForWorkspace,
} from '../db/repositories/dashboardWidgetsRepository.js';
import {
  getDashboardPreferencesByWorkspace,
  upsertDashboardPreferences,
  listAllDashboardPreferencesByWorkspace,
  replaceDashboardPreferencesForWorkspace,
} from '../db/repositories/dashboardPreferencesRepository.js';

const mockTx = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};


vi.mock('../db/tenant-context.js', () => ({
  withTenant: vi.fn((_subdomain: string, cb: (tx: typeof mockTx) => Promise<unknown>) =>
    cb(mockTx),
  ),
}));

describe('dashboard repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dashboardWidgetsRepository', () => {
    const sampleWidget: DashboardWidgetDto = {
      id: 'custom-1',
      title: 'Active Students',
      category: 'students',
      collection: 'students',
      operation: 'count',
      color: 'emerald',
      isPinnedToDashboard: true,
      widgetType: 'card',
      role: 'admin',
      sortOrder: 1,
      titleKey: 'dashboard.students',
      fixedSubText: 'Registered students',
    };

    it('listDashboardWidgetsByWorkspace executes tenant transaction query and orders by sortOrder', async () => {
      const dbRow = {
        id: 'custom-1',
        workspaceSubdomain: 'demo',
        widgetType: 'card',
        category: 'students',
        collection: 'students',
        role: 'admin',
        isPinnedToDashboard: true,
        title: 'Active Students',
        icon: null,
        color: 'emerald',
        operation: 'count',
        sortOrder: 1,
        config: { titleKey: 'dashboard.students', fixedSubText: 'Registered students' },
        updatedAt: new Date(),
      };

      const mockOrderBy = vi.fn().mockResolvedValue([dbRow]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockTx.select.mockReturnValue({ from: mockFrom });

      const widgets = await listDashboardWidgetsByWorkspace('demo');

      expect(widgets).toHaveLength(1);
      expect(widgets[0].id).toBe('custom-1');
      expect(widgets[0].titleKey).toBe('dashboard.students');
      expect(widgets[0].fixedSubText).toBe('Registered students');
    });

    it('listAllDashboardWidgetsByWorkspace fetches raw rows for workspace backup snapshot', async () => {
      const mockWhere = vi.fn().mockResolvedValue([{ id: 'w1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockTx.select.mockReturnValue({ from: mockFrom });

      const rows = await listAllDashboardWidgetsByWorkspace('demo');

      expect(mockTx.select).toHaveBeenCalled();
      expect(rows).toEqual([{ id: 'w1' }]);
    });

    it('upsertDashboardWidgetsForWorkspace invokes insert with onConflictDoUpdate on (workspaceSubdomain, id)', async () => {
      const mockOnConflictDoUpdate = vi.fn().mockResolvedValue([]);
      const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
      mockTx.insert.mockReturnValue({ values: mockValues });

      await upsertDashboardWidgetsForWorkspace('demo', [sampleWidget]);

      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it('deleteDashboardWidgetById executes transaction delete', async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      mockTx.delete.mockReturnValue({ where: mockWhere });

      await deleteDashboardWidgetById('demo', 'custom-1');

      expect(mockTx.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('reorderDashboardWidgetsForWorkspace updates sortOrder per widget in a transaction', async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockTx.update.mockReturnValue({ set: mockSet });

      await reorderDashboardWidgetsForWorkspace('demo', [
        { id: 'custom-1', sortOrder: 5 },
        { id: 'custom-2', sortOrder: 6 },
      ]);

      expect(mockTx.update).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenCalledTimes(2);
    });


    it('replaceDashboardWidgetsForWorkspace deletes old rows and inserts new rows during restore', async () => {
      const mockDeleteWhere = vi.fn().mockResolvedValue([]);
      mockTx.delete.mockReturnValue({ where: mockDeleteWhere });
      const mockValues = vi.fn().mockResolvedValue([]);
      mockTx.insert.mockReturnValue({ values: mockValues });

      await replaceDashboardWidgetsForWorkspace('demo', [sampleWidget as unknown as Record<string, unknown>]);

      expect(mockTx.delete).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });
  });

  describe('dashboardPreferencesRepository', () => {
    it('getDashboardPreferencesByWorkspace queries workspace singleton preferences', async () => {
      const dbRow = {
        workspaceSubdomain: 'demo',
        preferences: { gridMode: 'compact', disabledCardIds: ['card-1'] },
        updatedAt: new Date(),
      };

      const mockLimit = vi.fn().mockResolvedValue([dbRow]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockTx.select.mockReturnValue({ from: mockFrom });

      const prefs = await getDashboardPreferencesByWorkspace('demo');

      expect(prefs).toEqual({ gridMode: 'compact', disabledCardIds: ['card-1'] });
    });

    it('listAllDashboardPreferencesByWorkspace fetches all rows for backup snapshot', async () => {
      const mockWhere = vi.fn().mockResolvedValue([{ workspaceSubdomain: 'demo' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockTx.select.mockReturnValue({ from: mockFrom });

      const rows = await listAllDashboardPreferencesByWorkspace('demo');

      expect(rows).toEqual([{ workspaceSubdomain: 'demo' }]);
    });

    it('upsertDashboardPreferences inserts workspace singleton with conflict update', async () => {
      const mockOnConflictDoUpdate = vi.fn().mockResolvedValue([]);
      const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
      mockTx.insert.mockReturnValue({ values: mockValues });

      await upsertDashboardPreferences('demo', { gridMode: 'comfortable' });

      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it('replaceDashboardPreferencesForWorkspace wipes old preferences and re-inserts during backup restore', async () => {
      const mockDeleteWhere = vi.fn().mockResolvedValue([]);
      mockTx.delete.mockReturnValue({ where: mockDeleteWhere });
      const mockValues = vi.fn().mockResolvedValue([]);
      mockTx.insert.mockReturnValue({ values: mockValues });

      await replaceDashboardPreferencesForWorkspace('demo', [{ preferences: { gridMode: 'compact' } }]);

      expect(mockTx.delete).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });
  });
});
