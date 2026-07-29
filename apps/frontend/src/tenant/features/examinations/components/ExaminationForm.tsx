import React, { useMemo, useState, useEffect } from "react";
import { BookOpen, Trophy, CheckCircle2, Clock } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";

import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { notify } from "@/lib/notify";
import { Exam } from '@/lib/data/examinationData';
import { AppTranslationKey, toTitleCase } from "@mms/shared";
import { FORM_INPUT } from "@/components/ui/formStyles";

const SUBJECT_OPTIONS: ReadonlyArray<{ value: string; labelKey: AppTranslationKey }> = [
  { value: "Tajweed", labelKey: "examinations.subjects.tajweed" },
  { value: "Hifz", labelKey: "examinations.subjects.hifz" },
  { value: "Islamic Studies", labelKey: "examinations.subjects.islamicStudies" },
  { value: "Arabic", labelKey: "examinations.subjects.arabic" },
  { value: "Aqeedah", labelKey: "examinations.subjects.aqeedah" },
  { value: "Quran Recitation", labelKey: "examinations.subjects.quranRecitation" },
  { value: "Fiqh", labelKey: "examinations.subjects.fiqh" },
];

const EMPTY: Omit<Exam, "id"> = {
  name: "",
  subject: "",
  totalMarks: 100,
  passingMarks: 50,
  date: "",
  duration: 60,
  classIds: [],
  description: "",
  status: "upcoming",
};

interface ExamFormProps {
  open?: boolean;
  exam: Exam | null;
  onClose: () => void;
  onSave: (exam: Exam) => void | Promise<void>;
}

export default function ExamForm({ open = true, exam, onClose, onSave }: ExamFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sessions = useSessionsCollection();

  const [examDraft, setExamDraft] = useState<Omit<Exam, "id">>(() => {
    return exam ? { ...exam } : { ...EMPTY };
  });

  // Re-sync draft when editing another exam record
  useEffect(() => {
    if (!open) return;
    setExamDraft(exam ? { ...exam } : { ...EMPTY });
    setErrors({});
  }, [open, exam]);

  const updateDraft = (patch: Partial<typeof examDraft>) => {
    setExamDraft((prev) => ({ ...prev, ...patch }));
  };

  const classes = useMemo(
    () => sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({
        id: sessionClass.id,
        name: `${session.name} - ${sessionClass.name}`,
      })),
    ),
    [sessions],
  );

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!examDraft.name?.trim()) {
      newErrors.name = t("examinations.form.validation.nameRequired");
    }
    if (!examDraft.date) {
      newErrors.date = t("examinations.form.validation.dateRequired");
    }
    if (!examDraft.classIds || examDraft.classIds.length === 0) {
      newErrors.classIds = t("examinations.form.validation.classRequired");
    }
    if (Number(examDraft.passingMarks) > Number(examDraft.totalMarks)) {
      newErrors.passingMarks = t("examinations.form.validation.passingExceedsTotal");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("examinations.form.toast.validationError"));
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...examDraft,
        name: toTitleCase(examDraft.name || ""),
        id: exam?.id || `ex${Date.now()}`
      } as unknown as Exam);
      notify.success(exam ? t("examinations.form.toast.updated") : t("examinations.form.toast.created"));
      onClose();
    } catch (err: unknown) {
      notify.error(t("examinations.form.toast.saveFailed"), { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const valid = !!(examDraft.name && examDraft.date && examDraft.classIds && examDraft.classIds.length > 0);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={exam ? t("examinations.form.title.edit") : t("examinations.form.title.create")}
      icon={BookOpen}
      cancelLabel={t("examinations.form.cancel")}
      saveLabel={exam ? t("examinations.form.saveChanges") : t("examinations.form.create")}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!valid}
    >
      <div className="space-y-5 text-left">
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
            <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("examinations.form.section.parameters")}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label={t("examinations.form.fields.name")} required error={errors.name}>
                <div className="relative flex items-center group/input">
                  <BookOpen className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="exam-name"
                    className={`${FORM_INPUT} ps-10`}
                    value={examDraft.name || ""}
                    onChange={(event) => updateDraft({ name: event.target.value })}
                    placeholder={t("examinations.form.placeholders.name")}
                    required
                  />
                </div>
              </Field>
            </div>

            <Field label={t("examinations.form.fields.subject")}>
              <FormSelect
                id="exam-subject"
                value={examDraft.subject || ""}
                onChange={(val) => updateDraft({ subject: val })}
                placeholder={t("examinations.form.placeholders.subject")}
                options={SUBJECT_OPTIONS.map((subjectOption) => ({
                  value: subjectOption.value,
                  label: t(subjectOption.labelKey),
                }))}
              />
            </Field>

            <Field label={t("examinations.form.fields.status")}>
              <FormSelect
                id="exam-status"
                value={examDraft.status || "upcoming"}
                onChange={(val) => updateDraft({ status: val as Exam["status"] })}
                options={[
                  { value: "upcoming", label: t("examinations.status.upcoming") },
                  { value: "ongoing", label: t("examinations.status.ongoing") },
                  { value: "completed", label: t("examinations.status.completed") },
                ]}
              />
            </Field>

            <Field label={t("examinations.form.fields.totalMarks")}>
              <div className="relative flex items-center group/input">
                <Trophy className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="exam-total"
                  type="number"
                  className={`${FORM_INPUT} ps-10`}
                  value={examDraft.totalMarks ?? 100}
                  onChange={(event) => updateDraft({ totalMarks: Number(event.target.value) })}
                  min={1}
                  required
                />
              </div>
            </Field>

            <Field label={t("examinations.form.fields.passingMarks")} error={errors.passingMarks}>
              <div className="relative flex items-center group/input">
                <CheckCircle2 className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="exam-passing"
                  type="number"
                  className={`${FORM_INPUT} ps-10`}
                  value={examDraft.passingMarks ?? 50}
                  onChange={(event) => updateDraft({ passingMarks: Number(event.target.value) })}
                  min={1}
                  max={examDraft.totalMarks ?? 100}
                  required
                />
              </div>
            </Field>

            <div className="sm:col-span-2">
              <Field label={t("examinations.form.fields.durationMinutes")}>
                <div className="relative flex items-center group/input">
                  <Clock className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="exam-duration"
                    type="number"
                    className={`${FORM_INPUT} ps-10`}
                    value={examDraft.duration ?? 60}
                    onChange={(event) => updateDraft({ duration: Number(event.target.value) })}
                    min={5}
                    required
                  />
                </div>
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label={t("examinations.form.fields.examDate")} required error={errors.date}>
                <DatePicker
                  id="exam-date"
                  value={examDraft.date || ""}
                  onChange={(val) => updateDraft({ date: val })}
                  required
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label={t("examinations.form.fields.assignClasses")} required error={errors.classIds}>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("examinations.form.aria.assignClassesList")}>
                  {classes.map((sessionClass) => {
                    const active = !!(examDraft.classIds && examDraft.classIds.includes(sessionClass.id));
                    return (
                      <Button
                        key={sessionClass.id}
                        type="button"
                        onClick={() => {
                          const classIds = examDraft.classIds ? [...examDraft.classIds] : [];
                          const updatedClassIds = classIds.includes(sessionClass.id) ? classIds.filter((classId) => classId !== sessionClass.id) : [...classIds, sessionClass.id];
                          updateDraft({ classIds: updatedClassIds });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {sessionClass.name}
                      </Button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label={t("examinations.form.fields.description")}>
                <Textarea
                  id="exam-desc"
                  name="description"
                  value={examDraft.description || ""}
                  onChange={(event) => updateDraft({ description: event.target.value })}
                  placeholder={t("examinations.form.placeholders.description")}
                />
              </Field>
            </div>
          </div>
        </Card>
      </div>
    </FormModal>
  );
}
