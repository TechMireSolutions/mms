import React, { useState, useMemo } from "react";
import { Plus, GraduationCap } from "lucide-react";
import { Session, Class } from '@/lib/data/sessionsData';
import { useTranslation } from '@/hooks/useTranslation';
import { useTeachersByIds } from '@/tenant/hooks/collections/teachers';
import { collectTeacherIdsFromClasses } from '@/lib/registryResolve';
import { assignClassTeacher } from '@/lib/teachers/teacherAssignment';
import { Button } from "@/components/ui/button";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ClassCard } from "@/tenant/features/sessions/components/tabs/ClassCard";
import { ClassModal } from "@/tenant/features/sessions/components/tabs/ClassModal";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

interface ClassesTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

/**
 * ClassesTab Component
 *
 * Renders the classes tab for a session, allowing managing individual classes.
 */
export function ClassesTab({ session, onUpdate, canWrite }: ClassesTabProps) {
  const { t } = useTranslation();
  const teacherIds = useMemo(
    () => collectTeacherIdsFromClasses(session.classes),
    [session.classes],
  );
  const { data: teachers = [] } = useTeachersByIds(teacherIds);
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const [showModal, setShowModal] = useState(false);
  const [classBeingEdited, setClassBeingEdited] = useState<Class | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = React.useRef(false);

  const handleClassMessage = (channel: 'sms' | 'whatsapp' | 'email', sessionClass: Class) => {
    const teacher = teachers.find((t) => t.id === sessionClass.teacherId);
    const recipientName = (teacher ? teacher.name : sessionClass.teacherName || sessionClass.name) || t("sessions.classes.fallbackName");
    const teacherObj = teacher as unknown as { phone?: string; email?: string } | undefined;
    const phoneStr: string = teacherObj?.phone ?? "";
    const emailStr: string | undefined = teacherObj?.email ?? undefined;
    openComposer(channel, [{ id: sessionClass.id, name: recipientName, phone: phoneStr, email: emailStr }]);
  };

  const handleSave = async (sessionClass: Class) => {
    const teacherFields = sessionClass.teacherId
      ? assignClassTeacher(String(sessionClass.teacherId))
      : { teacherId: '' };
    const classWithTeacher = { ...sessionClass, ...teacherFields };

    const classes = session.classes || [];
    const existing = classes.find((classItem) => classItem.id === classWithTeacher.id);
    const updatedClasses = existing
      ? classes.map((classItem) => classItem.id === classWithTeacher.id ? classWithTeacher : classItem)
      : [...classes, classWithTeacher];
    setSaving(true);
    try {
      await onUpdate({ ...session, classes: updatedClasses });
      setShowModal(false);
      setClassBeingEdited(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deletePendingRef.current = true;
    try {
      await onUpdate({ ...session, classes: session.classes.filter((classItem) => classItem.id !== deleteTarget.id) });
      setDeleteTarget(null);
    } finally {
      deletePendingRef.current = false;
    }
  };

  const handleEdit = (sessionClass: Class) => { setClassBeingEdited(sessionClass); setShowModal(true); };

  return (
    <section aria-label={t("sessions.classes.ariaLabel")} className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 min-w-0 text-sm font-semibold text-foreground">{t("sessions.classes.count", { count: session.classes?.length || 0 })}</p>
        {canWrite && <Button
          onClick={() => { setClassBeingEdited(null); setShowModal(true); }}
          className="flex h-auto w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.classes.add")}
        </Button>}
      </header>

      {(!session.classes || session.classes.length === 0) ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">{t("sessions.classes.emptyTitle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5 m-0">{t("sessions.classes.emptySubtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {session.classes.map((sessionClass) => (
            <ClassCard key={sessionClass.id} sessionClass={sessionClass} teachers={teachers} onEdit={handleEdit} onDelete={() => setDeleteTarget(sessionClass)} onMessage={handleClassMessage} canWrite={canWrite} />
          ))}
        </div>
      )}

      <ClassModal
        open={showModal}
        sessionClass={classBeingEdited}
        onClose={() => { if (!saving) { setShowModal(false); setClassBeingEdited(null); } }}
        onSave={handleSave}
        saving={saving}
      />

      {canWrite && messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deletePendingRef.current) setDeleteTarget(null); }}
        title={t("sessions.classes.confirmDeleteTitle")}
        description={t("sessions.classes.confirmDeleteDescription", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </section>
  );
}
