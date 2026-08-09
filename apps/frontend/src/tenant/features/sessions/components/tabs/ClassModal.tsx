import React, { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { type AppTranslationKey, type Teacher, TEACHERS_MODULE_MANIFEST } from "@mms/shared";

import { FormModal } from "@/components/ui/FormModal";
import { RequiredMark } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeachersByIds, useTeachersPaginated } from "@/tenant/hooks/collections/teachers";
import type { Class } from "@/lib/data/sessionsData";
import {
  assignClassTeacher,
  teacherOptionsForClass,
} from "@/lib/teachers/teacherAssignment";

const EMPTY_CLASS: Partial<Class> = { name: "", ageMin: 5, ageMax: 18, gender: "any", teacherId: "", capacity: 20, enrolled: 0, room: "" };

interface ClassModalProps {
  open: boolean;
  sessionClass: Class | null;
  onClose: () => void;
  onSave: (sessionClass: Class) => void | Promise<void>;
  saving: boolean;
}

export function ClassModal({ open, sessionClass, onClose, onSave, saving }: ClassModalProps) {
  const { t } = useTranslation();
  const [classDraft, setClassDraft] = useState<Partial<Class>>(sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS });
  const updateClassDraft = <K extends keyof Class>(field: K, value: Class[K]) => setClassDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  const { data: activeTeachersPage } = useTeachersPaginated({
    page: 1,
    limit: TEACHERS_MODULE_MANIFEST.maxPageSize,
    status: "active",
    enabled: open,
  });

  const currentTeacherId = classDraft.teacherId || sessionClass?.teacherId;
  const activeTeachers = useMemo(() => (activeTeachersPage?.teachers ?? []) as Teacher[], [activeTeachersPage?.teachers]);
  const needsCurrentResolve = Boolean(
    currentTeacherId
    && !activeTeachers.some((teacher) => String(teacher.id) === String(currentTeacherId)),
  );
  const { data: extraTeachers = [] } = useTeachersByIds(needsCurrentResolve ? [String(currentTeacherId)] : []);

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
      : { teacherId: "" };
    await onSave({
      ...classDraft,
      ...teacherFields,
      id: sessionClass?.id || `c${crypto.randomUUID()}`,
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
          <label className={FORM_LABEL} htmlFor="class-name">{t("sessions.classes.form.name")}<RequiredMark /></label>
          <Input id="class-name" value={classDraft.name || ""} onChange={(event) => updateClassDraft("name", event.target.value)} placeholder={t("sessions.classes.form.namePlaceholder")} required />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={FORM_LABEL} htmlFor="class-min-age">{t("sessions.classes.form.minAge")}</label>
            <Input id="class-min-age" type="number" value={classDraft.ageMin || 0} onChange={(event) => updateClassDraft("ageMin", +event.target.value)} min={1} max={100} />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="class-max-age">{t("sessions.classes.form.maxAge")}</label>
            <Input id="class-max-age" type="number" value={classDraft.ageMax || 0} onChange={(event) => updateClassDraft("ageMax", +event.target.value)} min={1} max={100} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <label className={FORM_LABEL} htmlFor="class-teacher">{t("sessions.classes.teacher")}</label>
          <FormSelect
            id="class-teacher"
            value={classDraft.teacherId || ""}
            onChange={handleTeacher}
            options={[
              { value: "", label: t("sessions.classes.unassigned") },
              ...teacherOptions.map((teacher) => {
                const spec = teacher.specialization ? ` · ${teacher.specialization}` : "";
                const statusSuffix = teacher.status !== "active" ? ` (${t(`teachers.status.${teacher.status}` as AppTranslationKey)})` : "";
                return { value: teacher.id, label: `${teacher.name}${spec}${statusSuffix}` };
              }),
            ]}
            className="w-full"
          />
          {teacherOptions.length === 0 && <p className="mt-1.5 text-xs text-muted-foreground">{t("sessions.classes.noTeachersHint")}</p>}
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="class-room">{t("sessions.classes.form.room")}</label>
          <Input id="class-room" value={classDraft.room || ""} onChange={(event) => updateClassDraft("room", event.target.value)} placeholder={t("sessions.classes.form.roomPlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}
