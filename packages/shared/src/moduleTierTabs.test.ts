import { describe, expect, it } from 'vitest';
import {
  normalizeModuleTierTabId,
  refreshModuleTierTabKeys,
  refreshModuleTierTabLabels,
} from './moduleTierTabs.js';
import { DEFAULT_PAGE_TABS } from './contactTypes.js';

describe('moduleTierTabs', () => {
  it('normalizes legacy tier tab ids', () => {
    expect(normalizeModuleTierTabId('operations')).toBe('work');
    expect(normalizeModuleTierTabId('analytics')).toBe('reports');
    expect(normalizeModuleTierTabId('configuration')).toBe('setup');
    expect(normalizeModuleTierTabId('work')).toBe('work');
  });

  it('upgrades legacy keys and English labels', () => {
    const tabs = [
      { key: 'operations', label: 'Operations', enabled: true, order: 0, isSystem: true },
      { key: 'analytics', label: 'Analytics', enabled: true, order: 1, isSystem: true },
      { key: 'configuration', label: 'Configuration', enabled: true, order: 2, isSystem: true },
    ];
    const next = refreshModuleTierTabLabels(refreshModuleTierTabKeys(tabs));
    expect(next.map((t) => t.key)).toEqual(['work', 'reports', 'setup']);
    expect(next.map((t) => t.label)).toEqual(['Work', 'Reports', 'Setup']);
  });

  it('matches DEFAULT_PAGE_TABS ids and labels', () => {
    expect(DEFAULT_PAGE_TABS.map((t) => t.key)).toEqual(['work', 'reports', 'setup']);
    expect(DEFAULT_PAGE_TABS.map((t) => t.label)).toEqual(['Work', 'Reports', 'Setup']);
  });
});
