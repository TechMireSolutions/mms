import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import type { Student } from "@mms/shared";
import {
  ModuleDrawerLoadingSkeleton,
  ModuleOverlayLoadingFallback,
} from "@/components/ui/ModuleOverlayLoadingChrome";
import { StudentsPageConfirmDialogs } from "@/tenant/features/students/components/StudentsPageConfirmDialogs";
import type { StudentsPageOverlaysProps } from "@/tenant/features/students/hooks/studentsPageOverlaysTypes";

const StudentForm = lazy(() => import("@/tenant/features/students/components/StudentForm"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const StudentDetailDrawer = lazy(() =>
  import("@/tenant/features/students/components/StudentDetailDrawer").then((m) => ({
    default: m.StudentDetailDrawer,
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
  return (
    <>
      <Suspense fallback={<ModuleOverlayLoadingFallback />}>
        <AnimatePresence>
          {showStudentForm ? (
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

      {viewStudent ? (
        <Suspense fallback={<ModuleDrawerLoadingSkeleton />}>
          <StudentDetailDrawer
            student={viewStudent}
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
