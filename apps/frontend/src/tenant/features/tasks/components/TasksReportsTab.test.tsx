import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TasksReportsTab } from './TasksReportsTab';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/tenant/features/tasks/hooks/useTasksApi', () => ({
  useTaskMetrics: () => ({
    data: {
      total: 10,
      todo: 3,
      inProgress: 4,
      inReview: 1,
      blocked: 0,
      completed: 2,
      cancelled: 0,
      overdue: 1,
      completionRate: 20,
      byPriority: { low: 2, medium: 5, high: 2, urgent: 1 },
      byStatus: { todo: 3, in_progress: 4, review: 1, completed: 2, cancelled: 0 },
    },
    isLoading: false,
  }),
}));

describe('TasksReportsTab', () => {
  it('renders report cards and metrics', () => {
    const html = renderToStaticMarkup(<TasksReportsTab />);
    expect(html).toContain('tasks.metrics.total');
    expect(html).toContain('tasks.metrics.completed');
    expect(html).toContain('tasks.metrics.overdue');
    expect(html).toContain('20%');
  });
});
