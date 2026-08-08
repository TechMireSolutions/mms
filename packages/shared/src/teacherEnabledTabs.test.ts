import { describe, expect, it } from 'vitest';
import {
  defaultTeacherEnabledTabIds,
  resolveTeacherEnabledTabIds,
} from './teacherEnabledTabs.js';
import type { TabDefinition } from './contactFieldSchemaTypes.js';

describe('resolveTeacherEnabledTabIds', () => {
  it('falls back to registry defaults when settings are absent or empty', () => {
    expect(resolveTeacherEnabledTabIds()).toEqual(defaultTeacherEnabledTabIds());
    expect(resolveTeacherEnabledTabIds(null)).toEqual(defaultTeacherEnabledTabIds());
    expect(resolveTeacherEnabledTabIds({})).toEqual(defaultTeacherEnabledTabIds());
    expect(resolveTeacherEnabledTabIds({ enabledTabs: [] })).toEqual(
      defaultTeacherEnabledTabIds(),
    );
  });

  it('uses non-empty enabledTabs when formTabs are absent and always includes locked basic', () => {
    expect(resolveTeacherEnabledTabIds({ enabledTabs: ['employment'] })).toEqual(
      expect.arrayContaining(['basic', 'employment']),
    );
    expect(
      resolveTeacherEnabledTabIds({ enabledTabs: ['basic', 'employment'] }),
    ).toEqual(expect.arrayContaining(['basic', 'employment']));
  });

  it('prefers formTabs.enabled over enabledTabs when formTabs are present', () => {
    const formTabs: TabDefinition[] = [
      { key: 'basic', label: 'Basic', enabled: true, order: 0 },
      { key: 'employment', label: 'Employment', enabled: false, order: 1 },
      { key: 'custom_house', label: 'House', enabled: true, order: 2 },
    ];
    const resolved = resolveTeacherEnabledTabIds({
      formTabs,
      enabledTabs: ['basic', 'employment'],
    });
    expect(resolved).toEqual(expect.arrayContaining(['basic', 'custom_house']));
    expect(resolved).not.toContain('employment');
  });

  it('always includes locked basic even when formTabs omit or disable it', () => {
    const formTabs: TabDefinition[] = [
      { key: 'basic', label: 'Basic', enabled: false, order: 0 },
      { key: 'employment', label: 'Employment', enabled: true, order: 1 },
    ];
    expect(resolveTeacherEnabledTabIds({ formTabs })).toEqual(
      expect.arrayContaining(['basic', 'employment']),
    );
  });
});
