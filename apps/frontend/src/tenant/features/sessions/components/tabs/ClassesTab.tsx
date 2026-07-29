import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Users, GraduationCap, MessageCircle, MessageSquare } from "lucide-react";
import { Session, Class } from '@/lib/data/sessionsData';
import type { Teacher, AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useTeachersByIds, useTeachersPaginated } from '@/tenant/hooks/collections/teachers';
import { TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { collectTeacherIdsFromClasses } from '@/lib/registryResolve';
import {
  assignClassTeacher,
  teacherNameById,
  teacherOptionsForClass,
} from '@/lib/teachers/teacherAssignment';
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

const EMPTY_CLASS: Partial<Class> = { name: "", ageMin: 5, ageMax: 18, gender: "any", teacherId: "", capacity: 20, enrolled: 0, room: "" };

interface ClassCardProps {
  sessionClass: Class;
  teachers: Teacher[];
  onEdit: (sessionClass: Class) => void;
  onDelete: (id: string) => void;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', sessionClass: Class) => void;
  canWrite: boolean;
}

function ClassCard({ sessionClass, teachers, onEdit, onDelete, onMessage, canWrite }: ClassCardProps) {
  const { t } = useTranslation();
  const capacityPercent = Math.round((sessionClass.enrolled / sessionClass.capacity) * 100);
  const barColor = capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success";
  const teacherLabel = teacherNameById(teachers, sessionClass.teacherId) || sessionClass.teacherName || t('sessions.classes.unassigned');
  const genderConfig: Record<string, StatusBadgeConfigItem> = {
    male: { label: t("sessions.classes.gender.male"), cls: SEMANTIC_BADGE.info },
    female: { label: t("sessions.classes.gender.female"), cls: SEMANTIC_BADGE.secondary },
    any: { label: t("sessions.classes.gender.any"), cls: SEMANTIC_BADGE.muted },
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all group"
    >
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
            <GraduationCap className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
          </div>
          <div className="min-w-0">
            <h4 className="m-0 truncate text-sm font-bold text-foreground">{sessionClass.name}</h4>
            <p className="m-0 truncate text-xs text-muted-foreground">{sessionClass.room || t("sessions.classes.noRoom")}</p>
          </div>
        </div>
        {canWrite && <div className="flex shrink-0 items-center gap-1 self-end opacity-100 transition-opacity sm:self-start md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })}
            onClick={() => onMessage?.("whatsapp", sessionClass)}
            className="rounded-lg hover:bg-muted text-success hover:text-success transition-colors"
            title={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })}
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("sessions.classes.messageSms", { name: sessionClass.name })}
            onClick={() => onMessage?.("sms", sessionClass)}
            className="rounded-lg hover:bg-muted text-info hover:text-info transition-colors"
            title={t("sessions.classes.messageSms", { name: sessionClass.name })}
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("sessions.classes.editNamed", { name: sessionClass.name })} onClick={() => onEdit(sessionClass)} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("sessions.classes.deleteNamed", { name: sessionClass.name })} onClick={() => onDelete(sessionClass.id)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground font-medium m-0">{t("sessions.classes.ageRange")}</p>
          <p className="text-sm font-semibold text-foreground m-0">{t("sessions.classes.ageYears", { min: sessionClass.ageMin, max: sessionClass.ageMax })}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground font-medium m-0">{t("sessions.classes.form.gender")}</p>
          <StatusBadge status={sessionClass.gender || "any"} config={genderConfig} size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Users className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t('sessions.classes.teacher')}: <span className="font-medium text-foreground">{teacherLabel}</span></span>
      </div>

      <div aria-label={t("sessions.classes.enrolledCapacity", { enrolled: sessionClass.enrolled, capacity: sessionClass.capacity })}>
        <div className="flex items-center justify-between mb-1" aria-hidden="true">
          <span className="text-xs text-muted-foreground">{t("sessions.classes.form.capacity")}</span>
          <span className="text-xs font-semibold text-foreground">{sessionClass.enrolled}/{sessionClass.capacity}</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden" aria-hidden="true">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
        </div>
      </div>
    </motion.article>
  );
}

interface ClassModalProps {
  open: boolean;
  sessionClass: Class | null;
  onClose: () => void;
  onSave: (sessionClass: Class) => void | Promise<void>;
  saving: boolean;
}

function ClassModal({ open, sessionClass, onClose, onSave, saving }: ClassModalProps) {
  const { t } = useTranslation();
  const [classDraft, setClassDraft] = useState<Partial<Class>>(sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS });
  const updateClassDraft = <K extends keyof Class>(field: K, value: Class[K]) => setClassDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  const { data: activeTeachersPage } = useTeachersPaginated({
    page: 1,
    limit: TEACHERS_MODULE_MANIFEST.maxPageSize,
    status: 'active',
    enabled: open,
  });

  const currentTeacherId = classDraft.teacherId || sessionClass?.teacherId;
  const activeTeachers = useMemo(() => {
    return (activeTeachersPage?.teachers ?? []) as Teacher[];
  }, [activeTeachersPage?.teachers]);
  const needsCurrentResolve = Boolean(
    currentTeacherId
    && !activeTeachers.some((teacher) => String(teacher.id) === String(currentTeacherId)),
  );
  const { data: extraTeachers = [] } = useTeachersByIds(
    needsCurrentResolve ? [String(currentTeacherId)] : [],
  );

  const teachers = useMemo(() => {
    const teacherById = new Map<string, Teacher>();
    for (const teacher of activeTeachers) teacherById.set(String(teacher.id), teacher);
    for (const teacher of extraTeachers) teacherById.set(String(teacher.id), teacher);
    return [...teacherById.values()];
  }, [activeTeachers, extraTeachers]);

  const teacherOptions = useMemo(
    () => teacherOptionsForClass(teachers, classDraft.teacherId || sessionClass?.teacherId),
    [teachers, classDraft.teacherId, sessionClass?.teacherId],
  );

  const handleTeacher = (id: string) => {
    setClassDraft((currentDraft) => ({ ...currentDraft, ...assignClassTeacher(id) }));
  };

  React.useEffect(() => {
    if (open) {
      const baseClass = sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS };
      setClassDraft(baseClass.teacherId ? { ...baseClass, ...assignClassTeacher(String(baseClass.teacherId)) } : baseClass);
    }
  }, [open, sessionClass]);

  const handleSave = async () => {
    const teacherFields = classDraft.teacherId
      ? assignClassTeacher(String(classDraft.teacherId))
      : { teacherId: '' };
    await onSave({
      ...classDraft,
      ...teacherFields,
      id: sessionClass?.id || `c${Date.now()}`,
    } as Class);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={sessionClass ? t("sessions.classes.edit") : t("sessions.classes.add")}
      icon={GraduationCap}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!classDraft.name}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="class-name">{t("sessions.classes.form.name")} *</label>
          <Input id="class-name" value={classDraft.name || ""} onChange={(event) => updateClassDraft("name", event.target.value)} placeholder={t("sessions.classes.form.namePlaceholder")} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="class-min-age">{t("sessions.classes.form.minAge")}</label>
            <Input id="class-min-age" type="number" value={classDraft.ageMin || 0} onChange={(event) => updateClassDraft("ageMin", +event.target.value)} min={1} max={100} />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="class-max-age">{t("sessions.classes.form.maxAge")}</label>
            <Input id="class-max-age" type="number" value={classDraft.ageMax || 0} onChange={(event) => updateClassDraft("ageMax", +event.target.value)} min={1} max={100} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="class-gender">{t("sessions.classes.form.gender")}</label>
            <FormSelect
              id="class-gender"
              value={classDraft.gender || "any"}
              onChange={(value) => updateClassDraft("gender", value as Class["gender"])}
              options={[
                { value: "any", label: t("sessions.classes.gender.any") },
                { value: "male", label: t("sessions.classes.gender.male") },
                { value: "female", label: t("sessions.classes.gender.female") },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="class-capacity">{t("sessions.classes.form.capacity")}</label>
            <Input id="class-capacity" type="number" value={classDraft.capacity || 0} onChange={(event) => updateClassDraft("capacity", +event.target.value)} min={1} />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="class-teacher">{t('sessions.classes.teacher')}</label>
          <FormSelect
            id="class-teacher"
            value={classDraft.teacherId || ""}
            onChange={handleTeacher}
            options={[
              { value: "", label: t('sessions.classes.unassigned') },
              ...teacherOptions.map((teacher) => {
                const spec = teacher.specialization ? ` · ${teacher.specialization}` : '';
                const statusSuffix = teacher.status !== 'active' ? ` (${t(`teachers.status.${teacher.status}` as AppTranslationKey)})` : '';
                return {
                  value: teacher.id,
                  label: `${teacher.name}${spec}${statusSuffix}`
                };
              })
            ]}
            className="w-full"
          />
          {teacherOptions.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">{t('sessions.classes.noTeachersHint')}</p>
          )}
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="class-room">{t("sessions.classes.form.room")}</label>
            <Input id="class-room" value={classDraft.room || ""} onChange={(event) => updateClassDraft("room", event.target.value)} placeholder={t("sessions.classes.form.roomPlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}

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
