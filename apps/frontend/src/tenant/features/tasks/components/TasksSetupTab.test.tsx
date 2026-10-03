import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TasksSetupTab } from './TasksSetupTab';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/tenant/hooks/collections/tasks', () => ({
  useTaskSettings: () => ({
    data: {
      defaultPriority: 'medium',
      delegationScope: 'descendants',
      allowSelfAssignment: true,
      allowDirectDelegation: true,
    },
    isLoading: false,
  }),
  useUpdateTaskSettings: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('TasksSetupTab', () => {
  it('renders task settings configuration controls', () => {
    const html = renderToStaticMarkup(<TasksSetupTab />);
    expect(html).toContain('tasks.setup.delegationScope');
    expect(html).toContain('tasks.setup.descendants');
    expect(html).toContain('tasks.setup.directReports');
    expect(html).toContain('tasks.setup.allowSelfAssignment');
  });
});
