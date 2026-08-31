import { getTeacherAssignedClasses } from "@/lib/teachers/teacherAssignment";

import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ModuleDrawerLoadingSkeleton,
  ModuleOverlayLoadingFallback,
} from "@/components/ui/ModuleOverlayLoadingChrome";
import { useSessions } from "@/tenant/hooks/collections/sessions";
import { TeachersPageConfirmDialogs } from "@/tenant/features/teachers/components/TeachersPageConfirmDialogs";
import type { TeachersPageOverlaysProps } from "@/tenant/features/teachers/hooks/teachersPageOverlaysTypes";
import React from "react";

const TeacherForm = lazy(() =>
  import("@/tenant/features/teachers/components/TeacherForm").then((m) => ({
    default: m.TeacherForm,
  })),
);
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const TeacherDetail = lazy(() =>
  import("@/tenant/features/teachers/components/TeacherDetail").then((m) => ({
    default: m.default,
  })),
);
const TeacherIdCardModal = lazy(() =>
  import("@/tenant/features/teachers/components/TeacherIdCardModal").then((m) => ({
    default: m.TeacherIdCardModal,
  })),
);

export const TeachersPageOverlays = (function TeachersPageOverlays({
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
  idCardTeachers = [],
  onCloseIdCards,
  onPrintIdCard,
}: TeachersPageOverlaysProps): React.JSX.Element {
  const configPending = false;
  const sessionsQuery = useSessions();
  const sessions = (() => sessionsQuery.data ?? [])();

  const idCardItems = (() => {
    return idCardTeachers.map((teacher) => {
      const assignedClasses = teacher.id
        ? getTeacherAssignedClasses(teacher.id, sessions)
        : [];
        
      return {
        teacher,
        assignedClasses: assignedClasses.map(cls => `${cls.className} (${cls.sessionName})`),
        qualification: teacher.qualification,
        emergencyPhone: teacher.phone ? String(teacher.phone) : undefined,
      };
    });
  })();

  return (
    <>
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

          <Suspense fallback={<ModuleDrawerLoadingSkeleton />}>
            <AnimatePresence>
              {viewTeacher && !configPending ? (
                <TeacherDetail
                  teacher={viewTeacher}
                  canDelete={canDelete}
                  onClose={onCloseView}
                  onEdit={canWrite ? onEditFromDrawer : undefined}
                  onRestore={onRestoreFromDrawer}
                  onPrintIdCard={onPrintIdCard}
                  openComposer={openComposer}
                  canWriteMessaging={canWriteMessaging}
                />
              ) : null}
            </AnimatePresence>
          </Suspense>

          {idCardTeachers.length > 0 && onCloseIdCards ? (
            <Suspense fallback={null}>
              <TeacherIdCardModal
                open={idCardTeachers.length > 0}
                onClose={onCloseIdCards}
                items={idCardItems}
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
    });
