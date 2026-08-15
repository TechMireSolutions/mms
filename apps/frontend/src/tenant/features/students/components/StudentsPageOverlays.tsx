import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import type { Student } from "@mms/shared";
import {
  ModuleDrawerLoadingSkeleton,
  ModuleOverlayLoadingFallback,
} from "@/components/ui/ModuleOverlayLoadingChrome";
import { useStudentFieldConfigQuery } from "@/tenant/features/students/hooks/useStudentSetupConfig";
import { StudentsPageConfirmDialogs } from "@/tenant/features/students/components/StudentsPageConfirmDialogs";
import type { StudentsPageOverlaysProps } from "@/tenant/features/students/hooks/studentsPageOverlaysTypes";

const StudentForm = lazy(() => import("@/tenant/features/students/components/StudentForm"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const StudentDetail = lazy(() =>
  import("@/tenant/features/students/components/StudentDetail").then((m) => ({
    default: m.default,
  })),
);

/** Page-owned form / drawer / composer / confirms for Students (Contacts-shaped). */
export function StudentsPageOverlays({
  showStudentForm,
  editStudent,
  onCloseForm,
  onSave,
  viewStudent,
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
}: StudentsPageOverlaysProps): React.JSX.Element {
  const { isPending: configPending } = useStudentFieldConfigQuery();
  const formNeedsTabs = showStudentForm || Boolean(viewStudent);
  const tabsPending = formNeedsTabs && configPending;

  return (
    <>
      {tabsPending ? <ModuleOverlayLoadingFallback /> : null}

      <Suspense fallback={<ModuleOverlayLoadingFallback />}>
        <AnimatePresence>
          {showStudentForm && !configPending ? (
            <StudentForm
              student={editStudent as unknown as Partial<Student> | null}
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

      <Suspense fallback={<ModuleDrawerLoadingSkeleton />}>
        <AnimatePresence>
          {viewStudent && !configPending ? (
            <StudentDetail
              student={viewStudent}
              canDelete={canDelete}
              onClose={onCloseView}
              onEdit={canWrite ? onEditFromDrawer : undefined}
              onRestore={onRestoreFromDrawer}
              openComposer={openComposer}
              canWriteMessaging={canWriteMessaging}
            />
          ) : null}
        </AnimatePresence>
      </Suspense>

      <StudentsPageConfirmDialogs
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
