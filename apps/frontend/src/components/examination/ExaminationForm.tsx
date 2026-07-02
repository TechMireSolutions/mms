import React, { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { DatePicker } from "../ui/DatePicker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { useSessionsCollection } from "@/hooks/useSessions";
import { notify } from "@/lib/notify";
import { Exam } from '@/lib/data/examinationData';
import { toTitleCase } from "@mms/shared";
import { FORM_INPUT, FORM_TEXTAREA } from "@/components/ui/formStyles";

const SUBJECTS = ["Tajweed", "Hifz", "Islamic Studies", "Arabic", "Aqeedah", "Quran Recitation", "Fiqh"];

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
  onSave: (exam: Exam) => void;
}

export default function ExamForm({ open = true, exam, onClose, onSave }: ExamFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sessions = useSessionsCollection();

  const [examDraft, setExamDraft] = useState<Omit<Exam, "id">>(() => {
    return exam ? { ...exam } : { ...EMPTY };
  });

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
      newErrors.name = "Exam Name is required.";
    }
    if (!examDraft.date) {
      newErrors.date = "Exam Date is required.";
    }
    if (!examDraft.classIds || examDraft.classIds.length === 0) {
      newErrors.classIds = "At least one Class must be assigned.";
    }
    if (Number(examDraft.passingMarks) > Number(examDraft.totalMarks)) {
      newErrors.passingMarks = "Passing Marks cannot exceed Total Marks.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix validation errors");
      return;
    }

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      onSave({
        ...examDraft,
        name: toTitleCase(examDraft.name || ""),
        id: exam?.id || `ex${Date.now()}`
      } as unknown as Exam);
      notify.success(exam ? "Exam updated successfully" : "Exam created successfully");
      onClose();
    } catch (err: any) {
      notify.error("Failed to save exam", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const valid = !!(examDraft.name && examDraft.date && examDraft.classIds && examDraft.classIds.length > 0);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={exam ? "Edit Exam" : "Create Exam"}
      icon={BookOpen}
      cancelLabel="Cancel"
      saveLabel={exam ? "Save Changes" : "Create Exam"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!valid}
    >
      <div className="space-y-5 text-left">
        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Exam Name" required error={errors.name}>
                <Input
                  id="exam-name"
                  className={FORM_INPUT}
                  value={examDraft.name || ""}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder="e.g. Tajweed Mid-Term"
                  required
                />
              </Field>
            </div>

            <Field label="Subject">
              <FormSelect
                id="exam-subject"
                value={examDraft.subject || ""}
                onChange={(val) => updateDraft({ subject: val })}
                placeholder="Select subject…"
                options={SUBJECTS}
              />
            </Field>

            <Field label="Status">
              <FormSelect
                id="exam-status"
                value={examDraft.status || "upcoming"}
                onChange={(val) => updateDraft({ status: val as any })}
                options={[
                  { value: "upcoming", label: "Upcoming" },
                  { value: "ongoing", label: "Ongoing" },
                  { value: "completed", label: "Completed" },
                ]}
              />
            </Field>

            <Field label="Total Marks">
              <Input
                id="exam-total"
                type="number"
                className={FORM_INPUT}
                value={examDraft.totalMarks ?? 100}
                onChange={(e) => updateDraft({ totalMarks: Number(e.target.value) })}
                min={1}
                required
              />
            </Field>

            <Field label="Passing Marks" error={errors.passingMarks}>
              <Input
                id="exam-passing"
                type="number"
                className={FORM_INPUT}
                value={examDraft.passingMarks ?? 50}
                onChange={(e) => updateDraft({ passingMarks: Number(e.target.value) })}
                min={1}
                max={examDraft.totalMarks ?? 100}
                required
              />
            </Field>

            <Field label="Duration (min)">
              <Input
                id="exam-duration"
                type="number"
                className={FORM_INPUT}
                value={examDraft.duration ?? 60}
                onChange={(e) => updateDraft({ duration: Number(e.target.value) })}
                min={5}
                required
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Exam Date" required error={errors.date}>
                <DatePicker
                  id="exam-date"
                  value={examDraft.date || ""}
                  onChange={(val) => updateDraft({ date: val })}
                  required
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Assign to Classes" required error={errors.classIds}>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Assign to classes list">
                  {classes.map((sessionClass) => {
                    const active = !!(examDraft.classIds && examDraft.classIds.includes(sessionClass.id));
                    return (
                      <Button
                        key={sessionClass.id}
                        type="button"
                        onClick={() => {
                          const classIds = examDraft.classIds ? [...examDraft.classIds] : [];
                          const nextClassIds = classIds.includes(sessionClass.id) ? classIds.filter((id) => id !== sessionClass.id) : [...classIds, sessionClass.id];
                          updateDraft({ classIds: nextClassIds });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
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
              <Field label="Description">
                <textarea
                  id="exam-desc"
                  className={FORM_TEXTAREA}
                  rows={2}
                  value={examDraft.description || ""}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                  placeholder="Optional notes about this exam…"
                />
              </Field>
            </div>
          </div>
        </section>
      </div>
    </FormModal>
  );
}
