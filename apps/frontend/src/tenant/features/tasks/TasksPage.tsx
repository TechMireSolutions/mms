import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CheckSquare } from 'lucide-react';
import { TASKS_MODULE_MANIFEST, type TaskRecord, type TaskInsert, type TaskStatus } from '@mms/shared';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import {
  useTasks,
  useTaskMetrics,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
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

  const { canWrite, canDelete, canEditSetup } = useModulePermissions(TASKS_MODULE_MANIFEST);

  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: metrics } = useTaskMetrics();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  const tasks = tasksData?.tasks ?? [];

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (task: TaskRecord) => {
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
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(id);
    }
  };

  const pageTabs = [
    { id: 'work', label: t('nav.tasks') },
    { id: 'reports', label: 'Reports' },
    { id: 'setup', label: 'Setup' },
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
          <span>Total: <strong className="text-foreground">{metrics?.total ?? tasks.length}</strong></span>
          <span>In Progress: <strong className="text-foreground">{metrics?.inProgress ?? 0}</strong></span>
          <span>Completed: <strong className="text-foreground">{metrics?.completed ?? 0}</strong></span>
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
                canWrite={canWrite}
                canDelete={canDelete}
                onAddNew={handleOpenCreate}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {activeTab === 'reports' && <TasksReportsTab />}

            {activeTab === 'setup' && (
              <TasksSetupTab canEditSetup={canEditSetup} />
            )}
          </ModuleTierMotion>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <TaskFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        initialData={editingTask}
        onSave={handleSave}
        saving={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </ModulePageShell>
  );
}

export { TasksPage };
