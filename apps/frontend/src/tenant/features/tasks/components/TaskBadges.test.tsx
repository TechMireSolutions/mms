import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TaskPriorityBadge, TaskStatusBadge } from './TaskBadges';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('TaskBadges', () => {
  it('renders priority badge correctly', () => {
    const html = renderToStaticMarkup(<TaskPriorityBadge priority="urgent" />);
    expect(html).toContain('tasks.priority.urgent');
    expect(html).toContain('text-red-600');
  });

  it('renders status badge correctly', () => {
    const html = renderToStaticMarkup(<TaskStatusBadge status="in_progress" />);
    expect(html).toContain('tasks.status.in_progress');
    expect(html).toContain('text-blue-600');
  });
});
