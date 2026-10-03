import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TaskRecord } from '@mms/shared';
import { TasksWorkTab } from './TasksWorkTab';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { count?: number }) =>
      params?.count !== undefined ? `${key}:${params.count}` : key,
  }),
}));

vi.mock('./TasksListDesktopTable', () => ({
  TasksListDesktopTable: ({
    tasks,
    emptyAction,
  }: {
    tasks: TaskRecord[];
    emptyAction?: React.ReactNode;
  }) => (
    <div data-testid="tasks-table">
      {tasks.map((task) => (
        <div key={task.id}>
          {task.title}
          <span>{`tasks.priority.${task.priority}`}</span>
          <span>{`tasks.status.${task.status}`}</span>
        </div>
      ))}
      {tasks.length === 0 ? <div>tasks.emptyTitle</div> : null}
      {emptyAction}
    </div>
  ),
}));

vi.mock('./TaskDetailDrawer', () => ({
  TaskDetailDrawer: () => null,
}));

vi.mock('@/components/common/work/WorkTaskToolbar', () => ({
  WorkTaskToolbar: ({
    primaryAction,
    regionLabel,
  }: {
    primaryAction?: React.ReactNode;
    regionLabel: string;
  }) => (
    <div>
      <span>{regionLabel}</span>
      {primaryAction}
    </div>
  ),
}));

const mockTask: TaskRecord = {
  id: 'a0000000-0000-0000-0000-000000000001',
  workspaceSubdomain: 'test',
  title: 'Review Midterm Exams',
  description: 'Grading evaluation',
  status: 'in_progress',
  priority: 'urgent',
  dueAt: null,
  createdById: null,
  creatorName: 'Admin',
  parentTaskId: null,
  assignees: [],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  deletedAt: null,
};

describe('TasksWorkTab', () => {
  it('renders tasks table with correct title and priority', () => {
    const html = renderToStaticMarkup(
      <TasksWorkTab
        tasks={[mockTask]}
        isLoading={false}
        canWrite={true}
        canDelete={true}
        selectedIds={[]}
        onToggleSelected={vi.fn()}
        onToggleSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onAddNew={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onUpdateStatus={vi.fn()}
      />,
    );
    expect(html).toContain('Review Midterm Exams');
    expect(html).toContain('tasks.priority.urgent');
    expect(html).toContain('tasks.status.in_progress');
  });

  it('renders empty state when tasks list is empty', () => {
    const html = renderToStaticMarkup(
      <TasksWorkTab
        tasks={[]}
        isLoading={false}
        canWrite={true}
        canDelete={true}
        selectedIds={[]}
        onToggleSelected={vi.fn()}
        onToggleSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onAddNew={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onUpdateStatus={vi.fn()}
      />,
    );
    expect(html).toContain('tasks.emptyTitle');
  });
});
