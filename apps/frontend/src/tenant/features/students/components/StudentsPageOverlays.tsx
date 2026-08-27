import { lazy, Suspense, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import type { Student } from "@mms/shared";
import {
  ModuleDrawerLoadingSkeleton,
  ModuleOverlayLoadingFallback,
} from "@/components/ui/ModuleOverlayLoadingChrome";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { StudentsPageConfirmDialogs } from "@/tenant/features/students/components/StudentsPageConfirmDialogs";
import type { StudentsPageOverlaysProps } from "@/tenant/features/students/hooks/studentsPageOverlaysTypes";
import React from "react";

const StudentForm = lazy(() => import("@/tenant/features/students/components/StudentForm"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const StudentDetail = lazy(() =>
  import("@/tenant/features/students/components/StudentDetail").then((m) => ({
    default: m.default,
  })),
);
const StudentIdCardModal = lazy(() =>
  import("@/tenant/features/students/components/StudentIdCardModal").then((m) => ({
    default: m.StudentIdCardModal,
  })),
);

export const StudentsPageOverlays = React.memo(function StudentsPageOverlays({
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
  idCardStudents = [],
  onCloseIdCards,
  onPrintIdCard,
  onViewStudent,
  onViewContact,
}: StudentsPageOverlaysProps): React.JSX.Element {
  const configPending = false;
  const sessions = useSessionsCollection();
  const formNeedsTabs = showStudentForm || Boolean(viewStudent);
  const tabsPending = false;

  const idCardItems = useMemo(() => {
    return idCardStudents.map((student) => {
      const sessionNames = sessions
        .filter((sess) => student.enrolledSessions?.includes(sess.id))
        .map((sess) => sess.name);
      return {
        student,
        sessionNames,
        guardianName: student.fatherName,
        emergencyPhone: student.phone,
      };
    });
  }, [idCardStudents, sessions]);

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
              onPrintIdCard={onPrintIdCard}
              onViewStudent={onViewStudent}
              onViewContact={onViewContact}
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

      {idCardStudents.length > 0 && onCloseIdCards ? (
        <Suspense fallback={null}>
          <StudentIdCardModal
            open={idCardStudents.length > 0}
            onClose={onCloseIdCards}
            items={idCardItems}
          />
        </Suspense>
      ) : null}
    </>
  );
});

