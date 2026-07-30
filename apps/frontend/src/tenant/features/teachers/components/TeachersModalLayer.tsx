import React from "react";
import { AnimatePresence } from "framer-motion";
import { TeacherForm } from "@/tenant/features/teachers/components/TeacherForm";
import type { MessagingTarget } from "@/hooks/useMessageComposerState";
import type { Teacher } from "@/lib/data/teachersData";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

interface TeachersModalLayerProps {
  showForm: boolean;
  canWrite: boolean;
  editTeacher: Teacher | null;
  messagingTarget: MessagingTarget | null;
  onCloseForm: () => void;
  onSaveTeacher: (teacher: Teacher) => Promise<void>;
  onCloseComposer: () => void;
}

export function TeachersModalLayer({
  showForm,
  canWrite,
  editTeacher,
  messagingTarget,
  onCloseForm,
  onSaveTeacher,
  onCloseComposer,
}: TeachersModalLayerProps): React.JSX.Element {
  return (
    <>
      <AnimatePresence>
        {showForm && canWrite && (
          <TeacherForm
            teacher={editTeacher ?? undefined}
            onClose={onCloseForm}
            onSave={onSaveTeacher}
          />
        )}
      </AnimatePresence>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={onCloseComposer}
          />
        </React.Suspense>
      )}
    </>
  );
}
