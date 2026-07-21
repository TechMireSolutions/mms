import React from 'react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders default label for active status', () => {
    const badge = StatusBadge({ status: 'active' });
    expect(badge.props.children[1]).toBe('Active');
    expect(badge.props.className).toContain('font-bold');
  });

  it('renders custom config mapping when supplied', () => {
    const customConfig = {
      enrolled: { label: 'Enrolled in Hifz', cls: 'bg-emerald-50 text-emerald-700' },
    };

    const badge = StatusBadge({ status: 'enrolled', config: customConfig });
    expect(badge.props.children[1]).toBe('Enrolled in Hifz');
    expect(badge.props.className).toContain('bg-emerald-50');
  });

  it('falls back gracefully to status string for unknown status', () => {
    const badge = StatusBadge({ status: 'unknown_status' });
    expect(badge.props.children[1]).toBe('unknown_status');
  });

  it('applies small size styling when size is sm', () => {
    const badge = StatusBadge({ status: 'active', size: 'sm' });
    expect(badge.props.className).toContain('text-[9px]');
  });
});
