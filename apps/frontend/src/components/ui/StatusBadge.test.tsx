import React from 'react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders default label for active status', () => {
    const badge = StatusBadge({ status: 'active' });
    const props = badge.props as any;
    expect(props.children[1]).toBe('Active');
    expect(props.className).toContain('font-bold');
  });

  it('renders custom config mapping when supplied', () => {
    const customConfig = {
      enrolled: { label: 'Enrolled in Hifz', cls: 'bg-emerald-50 text-emerald-700' },
    };

    const badge = StatusBadge({ status: 'enrolled', config: customConfig });
    const props = badge.props as any;
    expect(props.children[1]).toBe('Enrolled in Hifz');
    expect(props.className).toContain('bg-emerald-50');
  });

  it('falls back gracefully to status string for unknown status', () => {
    const badge = StatusBadge({ status: 'unknown_status' });
    const props = badge.props as any;
    expect(props.children[1]).toBe('unknown_status');
  });

  it('applies small size styling when size is sm', () => {
    const badge = StatusBadge({ status: 'active', size: 'sm' });
    const props = badge.props as any;
    expect(props.className).toContain('text-[9px]');
  });
});
