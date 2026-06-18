import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Users, GraduationCap } from "lucide-react";
import { Session, Class } from '@/lib/data/sessionsData';
import type { Teacher, AppTranslationKey } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useTeachersCollection } from '@/hooks/useTeachers';
import {
  assignClassTeacher,
  teacherNameById,
  teacherOptionsForClass,
} from '@/lib/teachers/teacherAssignment';
import FormModal from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";

const GENDER_COLORS: Record<string, string> = {
  male:   "bg-info/10 text-info border-info/20",
  female: "bg-secondary/10 text-secondary border-secondary/20",
  any:    "bg-muted text-muted-foreground border-border",
};

const EMPTY_CLASS: Partial<Class> = { name: "", ageMin: 5, ageMax: 18, gender: "any", teacherId: "", capacity: 20, enrolled: 0, room: "" };

interface ClassCardProps {
  cls: Class;
  teachers: Teacher[];
  onEdit: (cls: Class) => void;
  onDelete: (id: string) => void;
}

function ClassCard({ cls, teachers, onEdit, onDelete }: ClassCardProps) {
  const { t } = useTranslation();
  const pct = Math.round((cls.enrolled / cls.capacity) * 100);
  const barColor = pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success";
  const teacherLabel = teacherNameById(teachers, cls.teacherId) || cls.teacherName || t('sessions.classes.unassigned');

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
            <h4 className="text-[14px] font-bold text-foreground m-0">{cls.name}</h4>
            <p className="text-[11px] text-muted-foreground m-0">{cls.room || "No room"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button aria-label={`Edit ${cls.name}`} onClick={() => onEdit(cls)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button aria-label={`Delete ${cls.name}`} onClick={() => onDelete(cls.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-medium m-0">Age Range</p>
          <p className="text-[13px] font-semibold text-foreground m-0">{cls.ageMin}–{cls.ageMax} yrs</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-medium m-0">Gender</p>
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full border ${GENDER_COLORS[cls.gender] || GENDER_COLORS.any}`}>
            {cls.gender === "any" ? "Any" : cls.gender === "male" ? "♂ Male" : "♀ Female"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-3">
        <Users className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t('sessions.classes.teacher')}: <span className="font-medium text-foreground">{teacherLabel}</span></span>
      </div>

      <div aria-label={`Enrolled ${cls.enrolled} out of ${cls.capacity}`}>
        <div className="flex items-center justify-between mb-1" aria-hidden="true">
          <span className="text-[11px] text-muted-foreground">Capacity</span>
          <span className="text-[11px] font-semibold text-foreground">{cls.enrolled}/{cls.capacity}</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden" aria-hidden="true">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
    </motion.article>
  );
}

interface ClassModalProps {
  open: boolean;
  cls: Class | null;
  teachers: Teacher[];
  onClose: () => void;
  onSave: (cls: Class) => void;
}

function ClassModal({ open, cls, teachers, onClose, onSave }: ClassModalProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<Partial<Class>>(cls ? { ...cls } : { ...EMPTY_CLASS });
  const upd = <K extends keyof Class>(f: K, v: Class[K]) => setData((d) => ({ ...d, [f]: v }));

  const teacherOptions = useMemo(
    () => teacherOptionsForClass(teachers, data.teacherId || cls?.teacherId),
    [teachers, data.teacherId, cls?.teacherId],
  );

  const handleTeacher = (id: string) => {
    setData((d) => ({ ...d, ...assignClassTeacher(id) }));
  };

  React.useEffect(() => {
    if (open) {
      const base = cls ? { ...cls } : { ...EMPTY_CLASS };
      setData(base.teacherId ? { ...base, ...assignClassTeacher(String(base.teacherId)) } : base);
    }
  }, [open, cls]);

  const handleSave = () => {
    const teacherFields = data.teacherId
      ? assignClassTeacher(String(data.teacherId))
      : { teacherId: '' };
    onSave({
      ...data,
      ...teacherFields,
      id: cls?.id || `c${Date.now()}`,
    } as Class);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={cls ? "Edit Class" : "Add Class"}
      icon={GraduationCap}
      cancelLabel="Cancel"
      saveLabel="Save Class"
      onSave={handleSave}
      saveDisabled={!data.name}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="class-name">Class Name *</label>
          <input id="class-name" className={FORM_INPUT} value={data.name || ""} onChange={(e) => upd("name", e.target.value)} placeholder="e.g. Hifz A" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="class-min-age">Min Age</label>
            <input id="class-min-age" type="number" className={FORM_INPUT} value={data.ageMin || ""} onChange={(e) => upd("ageMin", +e.target.value)} min={1} max={100} />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="class-max-age">Max Age</label>
            <input id="class-max-age" type="number" className={FORM_INPUT} value={data.ageMax || ""} onChange={(e) => upd("ageMax", +e.target.value)} min={1} max={100} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="class-gender">Gender</label>
            <select id="class-gender" className={`${FORM_INPUT} cursor-pointer`} value={data.gender || "any"} onChange={(e) => upd("gender", e.target.value as Class["gender"])}>
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="class-capacity">Capacity</label>
            <input id="class-capacity" type="number" className={FORM_INPUT} value={data.capacity || ""} onChange={(e) => upd("capacity", +e.target.value)} min={1} />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="class-teacher">{t('sessions.classes.teacher')}</label>
          <select id="class-teacher" className={`${FORM_INPUT} cursor-pointer`} value={data.teacherId || ""} onChange={(e) => handleTeacher(e.target.value)}>
            <option value="">{t('sessions.classes.unassigned')}</option>
            {teacherOptions.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
                {teacher.specialization ? ` · ${teacher.specialization}` : ''}
                {teacher.status !== 'active' ? ` (${t(`teachers.status.${teacher.status}` as AppTranslationKey)})` : ''}
              </option>
            ))}
          </select>
          {teacherOptions.length === 0 && (
            <p className="text-[11px] text-muted-foreground mt-1.5">{t('sessions.classes.noTeachersHint')}</p>
          )}
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="class-room">Room</label>
          <input id="class-room" className={FORM_INPUT} value={data.room || ""} onChange={(e) => upd("room", e.target.value)} placeholder="e.g. Room A" />
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
export default function ClassesTab({ session, onUpdate }: ClassesTabProps) {
  const teachers = useTeachersCollection();
  const [showModal, setShowModal] = useState(false);
  const [editCls, setEditCls] = useState<Class | null>(null);

  const handleSave = (cls: Class) => {
    const teacherFields = cls.teacherId
      ? assignClassTeacher(String(cls.teacherId))
      : { teacherId: '' };
    const synced = { ...cls, ...teacherFields };

    const classes = session.classes || [];
    const existing = classes.find((c) => c.id === synced.id);
    const updated = existing ? classes.map((c) => c.id === synced.id ? synced : c) : [...classes, synced];
    onUpdate({ ...session, classes: updated });
    setShowModal(false);
    setEditCls(null);
  };

  const handleDelete = (id: string) => onUpdate({ ...session, classes: session.classes.filter((c) => c.id !== id) });

  const handleEdit = (cls: Class) => { setEditCls(cls); setShowModal(true); };

  return (
    <section aria-label="Session Classes" className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{session.classes?.length || 0} class{session.classes?.length !== 1 ? "es" : ""}</p>
        <button
          onClick={() => { setEditCls(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Class
        </button>
      </header>

      {(!session.classes || session.classes.length === 0) ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No classes yet</p>
          <p className="text-xs text-muted-foreground mt-0.5 m-0">Add your first class to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {session.classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} teachers={teachers} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ClassModal
        open={showModal}
        cls={editCls}
        teachers={teachers}
        onClose={() => { setShowModal(false); setEditCls(null); }}
        onSave={handleSave}
      />
    </section>
  );
}
