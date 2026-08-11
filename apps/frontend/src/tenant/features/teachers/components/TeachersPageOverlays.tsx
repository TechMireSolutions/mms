import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ModuleDrawerLoadingSkeleton,
  ModuleOverlayLoadingFallback,
} from "@/components/ui/ModuleOverlayLoadingChrome";
import { useTeacherFieldConfigQuery } from "@/tenant/features/teachers/hooks/useTeacherSetupConfig";
import { TeachersPageConfirmDialogs } from "@/tenant/features/teachers/components/TeachersPageConfirmDialogs";
import type { TeachersPageOverlaysProps } from "@/tenant/features/teachers/hooks/teachersPageOverlaysTypes";

const TeacherForm = lazy(() =>
  import("@/tenant/features/teachers/components/TeacherForm").then((m) => ({
    default: m.TeacherForm,
  })),
);
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const TeacherDetailDrawer = lazy(() =>
  import("@/tenant/features/teachers/components/TeacherDetailDrawer").then((m) => ({
    default: m.TeacherDetailDrawer,
  })),
);

/** Page-owned form / drawer / composer / confirms for Teachers (Contacts-shaped). */
export function TeachersPageOverlays({
  showForm,
  editTeacher,
  onCloseForm,
  onSave,
  viewTeacher,
  onCloseView,
  onEditFromDrawer,
  onRestoreFromDrawer,
  messagingTarget,
  onCloseComposer,
  openComposer,
  canWriteMessaging,
  canWrite,
  canDelete,
  bulkDeleteOpen,
  onBulkDeleteOpenChange,
  selectedCount,
  onConfirmBulkDelete,
  deleteTarget,
  onDeleteTargetOpenChange,
  onConfirmSingleDelete,
  bulkRestoreOpen,
  onBulkRestoreOpenChange,
  onConfirmBulkRestore,
}: TeachersPageOverlaysProps): React.JSX.Element {
  const { isPending: configPending } = useTeacherFieldConfigQuery();
  const formNeedsTabs = showForm || Boolean(viewTeacher);
  const tabsPending = formNeedsTabs && configPending;

  return (
    <>
      {tabsPending ? <ModuleOverlayLoadingFallback /> : null}

      <Suspense fallback={<ModuleOverlayLoadingFallback />}>
        <AnimatePresence>
          {showForm && canWrite && !configPending ? (
            <TeacherForm
              teacher={editTeacher ?? undefined}
              onClose={onCloseForm}
              onSave={onSave}
            />
          ) : null}
          {messagingTarget ? (
            <MessageComposer
              channel={messagingTarget.channel}
              recipients={messagingTarget.recipients}
              onClose={onCloseComposer}
            />
          ) : null}
        </AnimatePresence>
      </Suspense>

      {viewTeacher && !configPending ? (
        <Suspense fallback={<ModuleDrawerLoadingSkeleton />}>
          <TeacherDetailDrawer
            teacher={viewTeacher}
            canWrite={canWrite}
            canDelete={canDelete}
            onClose={onCloseView}
            onEdit={onEditFromDrawer}
            onRestore={onRestoreFromDrawer}
            openComposer={openComposer}
            canWriteMessaging={canWriteMessaging}
          />
        </Suspense>
      ) : null}

      <TeachersPageConfirmDialogs
        bulkDeleteOpen={bulkDeleteOpen}
        onBulkDeleteOpenChange={onBulkDeleteOpenChange}
        selectedCount={selectedCount}
        onConfirmBulkDelete={onConfirmBulkDelete}
        deleteTarget={deleteTarget}
        onDeleteTargetOpenChange={onDeleteTargetOpenChange}
        onConfirmSingleDelete={onConfirmSingleDelete}
        bulkRestoreOpen={bulkRestoreOpen}
        onBulkRestoreOpenChange={onBulkRestoreOpenChange}
        onConfirmBulkRestore={onConfirmBulkRestore}
      />
    </>
  );
}
