import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Users, GraduationCap } from "lucide-react";
import { Session, Class } from '@/lib/data/sessionsData';
import type { Teacher, AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useTeachersByIds, useTeachersPaginated } from '@/hooks/useTeachers';
import { TEACHERS_MODULE_CONTRACT } from '@mms/shared';
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
import { FormSelect } from "../../ui/FormSelect";

const GENDER_COLORS: Record<string, string> = {
  male:   "bg-info/10 text-info border-info/20",
  female: "bg-secondary/10 text-secondary border-secondary/20",
  any:    "bg-muted text-muted-foreground border-border",
};

const EMPTY_CLASS: Partial<Class> = { name: "", ageMin: 5, ageMax: 18, gender: "any", teacherId: "", capacity: 20, enrolled: 0, room: "" };

interface ClassCardProps {
  sessionClass: Class;
  teachers: Teacher[];
  onEdit: (sessionClass: Class) => void;
  onDelete: (id: string) => void;
}

function ClassCard({ sessionClass, teachers, onEdit, onDelete }: ClassCardProps) {
  const { t } = useTranslation();
  const capacityPercent = Math.round((sessionClass.enrolled / sessionClass.capacity) * 100);
  const barColor = capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success";
  const teacherLabel = teacherNameById(teachers, sessionClass.teacherId) || sessionClass.teacherName || t('sessions.classes.unassigned');

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all group"
    >
      <header className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <GraduationCap className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-foreground m-0">{sessionClass.name}</h4>
            <p className="text-[11px] text-muted-foreground m-0">{sessionClass.room || "No room"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" aria-label={`Edit ${sessionClass.name}`} onClick={() => onEdit(sessionClass)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-7 h-7">
            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${sessionClass.name}`} onClick={() => onDelete(sessionClass.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors w-7 h-7">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-medium m-0">Age Range</p>
          <p className="text-[13px] font-semibold text-foreground m-0">{sessionClass.ageMin}–{sessionClass.ageMax} yrs</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-medium m-0">Gender</p>
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full border ${GENDER_COLORS[sessionClass.gender] || GENDER_COLORS.any}`}>
            {sessionClass.gender === "any" ? "Any" : sessionClass.gender === "male" ? "♂ Male" : "♀ Female"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-3">
        <Users className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t('sessions.classes.teacher')}: <span className="font-medium text-foreground">{teacherLabel}</span></span>
      </div>

      <div aria-label={`Enrolled ${sessionClass.enrolled} out of ${sessionClass.capacity}`}>
        <div className="flex items-center justify-between mb-1" aria-hidden="true">
          <span className="text-[11px] text-muted-foreground">Capacity</span>
          <span className="text-[11px] font-semibold text-foreground">{sessionClass.enrolled}/{sessionClass.capacity}</span>
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
  onSave: (sessionClass: Class) => void;
}

function ClassModal({ open, sessionClass, onClose, onSave }: ClassModalProps) {
  const { t } = useTranslation();
  const [classDraft, setClassDraft] = useState<Partial<Class>>(sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS });
  const updateClassDraft = <K extends keyof Class>(field: K, value: Class[K]) => setClassDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  const { data: activeTeachersPage } = useTeachersPaginated({
    page: 1,
    limit: TEACHERS_MODULE_CONTRACT.maxPageSize,
    status: 'active',
    enabled: open,
  });

  const currentTeacherId = classDraft.teacherId || sessionClass?.teacherId;
  const activeTeachers = (activeTeachersPage?.teachers ?? []) as Teacher[];
  const needsCurrentResolve = Boolean(
    currentTeacherId
    && !activeTeachers.some((teacher) => String(teacher.id) === String(currentTeacherId)),
  );
  const { data: extraTeachers = [] } = useTeachersByIds(
    needsCurrentResolve ? [String(currentTeacherId)] : [],
  );

  const teachers = useMemo(() => {
    const map = new Map<string, Teacher>();
    for (const teacher of activeTeachers) map.set(String(teacher.id), teacher);
    for (const teacher of extraTeachers) map.set(String(teacher.id), teacher);
    return [...map.values()];
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

  const handleSave = () => {
    const teacherFields = classDraft.teacherId
      ? assignClassTeacher(String(classDraft.teacherId))
      : { teacherId: '' };
    onSave({
      ...classDraft,
      ...teacherFields,
      id: sessionClass?.id || `c${Date.now()}`,
    } as Class);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={sessionClass ? "Edit Class" : "Add Class"}
      icon={GraduationCap}
      cancelLabel="Cancel"
      saveLabel="Save Class"
      onSave={handleSave}
      saveDisabled={!classDraft.name}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="class-name">Class Name *</label>
          <Input id="class-name" value={classDraft.name || ""} onChange={(event) => updateClassDraft("name", event.target.value)} placeholder="e.g. Hifz A" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="class-min-age">Min Age</label>
            <Input id="class-min-age" type="number" value={classDraft.ageMin || 0} onChange={(event) => updateClassDraft("ageMin", +event.target.value)} min={1} max={100} />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="class-max-age">Max Age</label>
            <Input id="class-max-age" type="number" value={classDraft.ageMax || 0} onChange={(event) => updateClassDraft("ageMax", +event.target.value)} min={1} max={100} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="class-gender">Gender</label>
            <FormSelect
              id="class-gender"
              value={classDraft.gender || "any"}
              onChange={(value) => updateClassDraft("gender", value as Class["gender"])}
              options={[
                { value: "any", label: "Any" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="class-capacity">Capacity</label>
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
            <p className="text-[11px] text-muted-foreground mt-1.5">{t('sessions.classes.noTeachersHint')}</p>
          )}
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="class-room">Room</label>
            <Input id="class-room" value={classDraft.room || ""} onChange={(event) => updateClassDraft("room", event.target.value)} placeholder="e.g. Room A" />
        </div>
      </div>
    </FormModal>
  );
}

interface ClassesTabProps {
  session: Session;
  onUpdate: (session: Session) => void;
}

/**
 * ClassesTab Component
 *
 * Renders the classes tab for a session, allowing managing individual classes.
 */
export function ClassesTab({ session, onUpdate }: ClassesTabProps) {
  const teacherIds = useMemo(
    () => collectTeacherIdsFromClasses(session.classes),
    [session.classes],
  );
  const { data: teachers = [] } = useTeachersByIds(teacherIds);
  const [showModal, setShowModal] = useState(false);
  const [classBeingEdited, setClassBeingEdited] = useState<Class | null>(null);

  const handleSave = (sessionClass: Class) => {
    const teacherFields = sessionClass.teacherId
      ? assignClassTeacher(String(sessionClass.teacherId))
      : { teacherId: '' };
    const classWithTeacher = { ...sessionClass, ...teacherFields };

    const classes = session.classes || [];
    const existing = classes.find((classItem) => classItem.id === classWithTeacher.id);
    const updatedClasses = existing
      ? classes.map((classItem) => classItem.id === classWithTeacher.id ? classWithTeacher : classItem)
      : [...classes, classWithTeacher];
    onUpdate({ ...session, classes: updatedClasses });
    setShowModal(false);
    setClassBeingEdited(null);
  };

  const handleDelete = (id: string) => onUpdate({ ...session, classes: session.classes.filter((classItem) => classItem.id !== id) });

  const handleEdit = (sessionClass: Class) => { setClassBeingEdited(sessionClass); setShowModal(true); };

  return (
    <section aria-label="Session Classes" className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{session.classes?.length || 0} class{session.classes?.length !== 1 ? "es" : ""}</p>
        <Button
          onClick={() => { setClassBeingEdited(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors h-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Class
        </Button>
      </header>

      {(!session.classes || session.classes.length === 0) ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No classes yet</p>
          <p className="text-xs text-muted-foreground mt-0.5 m-0">Add your first class to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {session.classes.map((sessionClass) => (
            <ClassCard key={sessionClass.id} sessionClass={sessionClass} teachers={teachers} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ClassModal
        open={showModal}
        sessionClass={classBeingEdited}
        onClose={() => { setShowModal(false); setClassBeingEdited(null); }}
        onSave={handleSave}
      />
    </section>
  );
}
