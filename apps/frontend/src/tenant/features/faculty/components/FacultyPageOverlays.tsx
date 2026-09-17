import { getTeacherAssignedClasses } from "@/lib/faculty/facultyAssignment";

import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ModuleDrawerLoadingSkeleton,
  ModuleOverlayLoadingFallback,
} from "@/components/ui/ModuleOverlayLoadingChrome";
import { useSessions } from "@/tenant/hooks/collections/sessions";
import { FacultyPageConfirmDialogs } from "@/tenant/features/faculty/components/FacultyPageConfirmDialogs";
import type { FacultyPageOverlaysProps, TeachersPageOverlaysProps } from "@/tenant/features/faculty/hooks/facultyPageOverlaysTypes";
import React from "react";

const FacultyForm = lazy(() =>
  import("@/tenant/features/faculty/components/FacultyForm").then((m) => ({
    default: m.FacultyForm,
  })),
);
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const FacultyDetail = lazy(() =>
  import("@/tenant/features/faculty/components/FacultyDetail").then((m) => ({
    default: m.FacultyDetail,
  })),
);
const FacultyIdCardModal = lazy(() =>
  import("@/tenant/features/faculty/components/FacultyIdCardModal").then((m) => ({
    default: m.FacultyIdCardModal,
  })),
);

export const FacultyPageOverlays = (function FacultyPageOverlays({
  showForm,
  editTeacher,
  editFaculty,
  onCloseForm,
  onSave,
  viewTeacher,
  viewFaculty,
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
  idCardFaculty,
  onCloseIdCards,
  onPrintIdCard,
}: FacultyPageOverlaysProps): React.JSX.Element {
  const configPending = false;
  const sessionsQuery = useSessions();
  const sessions = (() => sessionsQuery.data ?? [])();
  const effectiveEdit = editFaculty ?? editTeacher;
  const effectiveView = viewFaculty ?? viewTeacher;
  const effectiveIdCards = idCardFaculty ?? idCardTeachers;

  const idCardItems = (() => {
    return effectiveIdCards.map((teacher) => {
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
            <FacultyForm
              faculty={effectiveEdit ?? undefined}
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
          {effectiveView && !configPending ? (
            <FacultyDetail
              faculty={effectiveView}
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

      {effectiveIdCards.length > 0 && onCloseIdCards ? (
        <Suspense fallback={null}>
          <FacultyIdCardModal
            open={effectiveIdCards.length > 0}
            onClose={onCloseIdCards}
            items={idCardItems}
          />
        </Suspense>
      ) : null}

      <FacultyPageConfirmDialogs
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

export const TeachersPageOverlays = FacultyPageOverlays;
export type { FacultyPageOverlaysProps, TeachersPageOverlaysProps };

