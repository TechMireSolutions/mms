import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CheckSquare } from 'lucide-react';
import { TASKS_MODULE_MANIFEST, type TaskRecord, type TaskInsert, type TaskStatus } from '@mms/shared';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { useTrashMode } from '@/hooks/useTrashMode';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import {
  useTasks,
  useTaskMetrics,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useRestoreTask,
} from '@/tenant/hooks/collections/tasks';
import { TasksWorkTab } from './components/TasksWorkTab';
import { TasksReportsTab } from './components/TasksReportsTab';
import { TasksSetupTab } from './components/TasksSetupTab';
import { TaskFormModal } from './components/TaskFormModal';

export default function TasksPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'work' | 'reports' | 'setup'>('work');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [viewingDeleted, setViewingDeleted] = useTrashMode();

  const { canRead, canWrite, canDelete, canEditSetup, canViewSetup } =
    useModulePermissions(TASKS_MODULE_MANIFEST);

  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    includeDeleted: viewingDeleted,
  });
  const { data: metrics } = useTaskMetrics({ enabled: !viewingDeleted });

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();
  const restoreTaskMutation = useRestoreTask();

  const tasks = tasksData?.tasks ?? [];

  const handleOpenCreate = () => {
    if (viewingDeleted) return;
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (task: TaskRecord) => {
    if (viewingDeleted) return;
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleSave = async (data: TaskInsert) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data });
    } else {
      await createTaskMutation.mutateAsync(data);
    }
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    if (viewingDeleted) return;
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    deleteTaskMutation.mutate(id, {
      onSuccess: () => {
        notify.archivedWithUndo(t('common.recordArchived'), () => {
          void restoreTaskMutation.mutateAsync(id);
        });
      },
      onError: (err) => {
        notify.error(err instanceof Error ? err.message : t('tasks.deleteFailed'));
      },
    });
  };

  const handleRestore = (id: string) => {
    restoreTaskMutation.mutate(id, {
      onSuccess: () => notify.success(t('tasks.restored')),
      onError: (err) => {
        notify.error(err instanceof Error ? err.message : t('tasks.restoreFailed'));
      },
    });
  };

  const pageTabs = [
    { id: 'work', label: t('nav.tasks') },
    ...(canRead ? [{ id: 'reports' as const, label: t('module.reports') }] : []),
    ...(canViewSetup ? [{ id: 'setup' as const, label: t('module.setup') }] : []),
  ];

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.tasks')}`}
      seoDescription={t('page.tasks.subtitle')}
      headerIcon={CheckSquare}
      headerTitle={t('nav.tasks')}
      headerSubtitle={t('page.tasks.subtitle')}
      metricsStrip={
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span>
            {t('tasks.metrics.total')}:{' '}
            <strong className="text-foreground">{metrics?.total ?? tasks.length}</strong>
          </span>
          <span>
            {t('tasks.metrics.inProgress')}:{' '}
            <strong className="text-foreground">{metrics?.inProgress ?? 0}</strong>
          </span>
          <span>
            {t('tasks.metrics.completed')}:{' '}
            <strong className="text-foreground">{metrics?.completed ?? 0}</strong>
          </span>
        </div>
      }
    >
      <ResponsiveAccordionTabs
        tabs={pageTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'work' | 'reports' | 'setup')}
        panelIdPrefix="tasks-tab"
      >
        <AnimatePresence mode="wait">
          <ModuleTierMotion tier={activeTab} className="space-y-4">
            {activeTab === 'work' && (
              <TasksWorkTab
                tasks={tasks}
                isLoading={tasksLoading}
                canWrite={canWrite && !viewingDeleted}
                canDelete={canDelete}
                viewingDeleted={viewingDeleted}
                onToggleTrash={setViewingDeleted}
                onAddNew={handleOpenCreate}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {activeTab === 'reports' && canRead ? <TasksReportsTab /> : null}

            {activeTab === 'setup' && canViewSetup ? (
              <TasksSetupTab canEditSetup={canEditSetup} />
            ) : null}
          </ModuleTierMotion>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editingTask}
        onSave={handleSave}
      />
    </ModulePageShell>
  );
}
