import React, { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL, FORM_SELECT, FORM_TEXTAREA } from "@/components/ui/formStyles";
import { calculateModuleFieldsCompleteness } from "@/lib/formCompleteness";
import { Exam } from '@/lib/data/examinationData';
import { useSessionsCollection } from "@/hooks/useSessions";
import { toTitleCase } from "@mms/shared";
import { getObject } from "../../lib/db";
import {
  type ExaminationsSettings,
  DEFAULT_EXAMINATIONS_SETTINGS,
  DEFAULT_EXAMINATIONS_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { DatePicker } from "../ui/DatePicker";

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

/**
 * Modal form dialog for creating or updating exam records.
 */
export default function ExamForm({ open = true, exam, onClose, onSave }: ExamFormProps): React.ReactElement {
  const [data, setData] = useState<Partial<Exam>>(() => {
    return exam ? { ...exam } : { ...EMPTY };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sessions = useSessionsCollection();

  const settings = useMemo(() => getObject<ExaminationsSettings>("examinations_settings", DEFAULT_EXAMINATIONS_SETTINGS), []);
  const fields = settings.fields || DEFAULT_EXAMINATIONS_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_EXAMINATIONS_SETTINGS.fieldOrder || [];

  const orderedFields = useMemo(() => {
    return getSortedFields(DEFAULT_EXAMINATIONS_FIELD_DEFS, fieldOrder, fields, customFields);
  }, [fieldOrder, fields, customFields]);

  const completeness = useMemo(
    () => calculateModuleFieldsCompleteness(data as Record<string, unknown>, orderedFields, fields),
    [data, orderedFields, fields],
  );

  const upd = <K extends keyof Exam>(f: K, v: Exam[K]) => setData((d: Partial<Exam>) => ({ ...d, [f]: v }));
  const toggleClass = (id: string) =>
    setData((d: Partial<Exam>) => {
      const classIds = d.classIds ? [...d.classIds] : [];
      return {
        ...d,
        classIds: classIds.includes(id) ? classIds.filter((x) => x !== id) : [...classIds, id],
      };
    });

  const handleSave = async () => {
    setError("");
    if (!data.name) {
      setError("Exam Name is required.");
      return;
    }
    if (!data.date) {
      setError("Exam Date is required.");
      return;
    }
    if (!data.classIds || data.classIds.length === 0) {
      setError("At least one Class must be assigned.");
      return;
    }

    // Validate default required fields
    for (const key of Object.keys(fields)) {
      if (fields[key].required && (data[key as keyof Exam] === undefined || data[key as keyof Exam] === "")) {
        setError(`${key.charAt(0).toUpperCase() + key.slice(1)} is required.`);
        return;
      }
    }

    // Validate custom required fields
    for (const cf of customFields) {
      if (cf.required && !(data as Record<string, unknown>)[cf.id]) {
        setError(`"${cf.label}" is required.`);
        return;
      }
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave({
      ...data,
      name: toTitleCase(data.name || ""),
      id: exam?.id || `ex${Date.now()}`
    } as Exam);
    setSaving(false);
  };

  const valid = !!(data.name && data.date && data.classIds && data.classIds.length > 0);
  const classes = useMemo(
    () => sessions.flatMap((session) =>
      (session.classes || []).map((cls) => ({
        id: cls.id,
        name: `${session.name} - ${cls.name}`,
      })),
    ),
    [sessions],
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={exam ? "Edit Exam" : "Create Exam"}
      icon={BookOpen}
      progress={completeness}
      progressLabel="Progress"
      error={error}
      cancelLabel="Cancel"
      saveLabel={exam ? "Save Changes" : "Create Exam"}
      onSave={() => void handleSave()}
      saving={saving}
      saveDisabled={!valid}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {orderedFields.map((field) => {
              const isEnabled = fields[field.id]?.enabled !== false;
              if (!isEnabled) return null;

              if (field.id === "name") {
                return (
                  <div key="name" className="sm:col-span-2">
                    <label htmlFor="exam-name" className={FORM_LABEL}>Exam Name *</label>
                    <input
                      id="exam-name"
                      className={FORM_INPUT}
                      value={data.name || ""}
                      onChange={(e) => upd("name", e.target.value)}
                      placeholder="e.g. Tajweed Mid-Term"
                      required
                    />
                  </div>
                );
              }

              if (field.id === "subject") {
                return (
                  <div key="subject">
                    <label htmlFor="exam-subject" className={FORM_LABEL}>Subject {field.required ? "*" : ""}</label>
                    <select
                      id="exam-subject"
                      className={FORM_SELECT}
                      value={data.subject || ""}
                      onChange={(e) => upd("subject", e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select subject…</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                );
              }

              if (field.id === "status") {
                return (
                  <div key="status">
                    <label htmlFor="exam-status" className={FORM_LABEL}>Status {field.required ? "*" : ""}</label>
                    <select
                      id="exam-status"
                      className={FORM_SELECT}
                      value={data.status || "upcoming"}
                      onChange={(e) => upd("status", e.target.value as Exam["status"])}
                      required={field.required}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                );
              }

              if (field.id === "totalMarks") {
                return (
                  <div key="totalMarks">
                    <label htmlFor="exam-total" className={FORM_LABEL}>Total Marks {field.required ? "*" : ""}</label>
                    <input
                      id="exam-total"
                      type="number"
                      className={FORM_INPUT}
                      value={data.totalMarks ?? 100}
                      onChange={(e) => upd("totalMarks", +e.target.value)}
                      min={1}
                      required={field.required}
                    />
                  </div>
                );
              }

              if (field.id === "passingMarks") {
                return (
                  <div key="passingMarks">
                    <label htmlFor="exam-passing" className={FORM_LABEL}>Passing Marks {field.required ? "*" : ""}</label>
                    <input
                      id="exam-passing"
                      type="number"
                      className={FORM_INPUT}
                      value={data.passingMarks ?? 50}
                      onChange={(e) => upd("passingMarks", +e.target.value)}
                      min={1}
                      max={data.totalMarks ?? 100}
                      required={field.required}
                    />
                  </div>
                );
              }

              if (field.id === "duration") {
                return (
                  <div key="duration">
                    <label htmlFor="exam-duration" className={FORM_LABEL}>Duration (min) {field.required ? "*" : ""}</label>
                    <input
                      id="exam-duration"
                      type="number"
                      className={FORM_INPUT}
                      value={data.duration ?? 60}
                      onChange={(e) => upd("duration", +e.target.value)}
                      min={5}
                      required={field.required}
                    />
                  </div>
                );
              }

              if (field.id === "date") {
                return (
                  <div key="date" className="sm:col-span-2">
                    <label htmlFor="exam-date" className={FORM_LABEL}>Exam Date *</label>
                    <DatePicker
                      id="exam-date"
                      value={data.date || ""}
                      onChange={(val) => upd("date", val)}
                      required
                    />
                  </div>
                );
              }

              if (field.id === "classIds") {
                return (
                  <div key="classIds" className="sm:col-span-2">
                    <span className={FORM_LABEL}>Assign to Classes *</span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Assign to classes list">
                      {classes.map((cls) => {
                        const active = !!(data.classIds && data.classIds.includes(cls.id));
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => toggleClass(cls.id)}
                            className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border bg-muted hover:bg-muted/80 text-foreground"
                            }`}
                          >
                            {cls.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (field.id === "description") {
                return (
                  <div key="description" className="sm:col-span-2">
                    <label htmlFor="exam-desc" className={FORM_LABEL}>Description {field.required ? "*" : ""}</label>
                    <textarea
                      id="exam-desc"
                      className={FORM_TEXTAREA}
                      rows={2}
                      value={data.description || ""}
                      onChange={(e) => upd("description", e.target.value)}
                      placeholder="Optional notes about this exam…"
                      required={field.required}
                    />
                  </div>
                );
              }

              // Custom field
              if (!["name", "subject", "status", "totalMarks", "passingMarks", "duration", "date", "classIds", "description"].includes(field.id)) {
                const val = (data as Record<string, unknown>)[field.id] ?? "";
                return (
                  <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className={FORM_LABEL}>
                      {field.label} {field.required ? "*" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        className={FORM_TEXTAREA}
                        value={val as string}
                        onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className={FORM_SELECT}
                        value={val as string}
                        onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                        required={field.required}
                      >
                        <option value="">Select option…</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "boolean" ? (
                      <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!val}
                          onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.checked }))}
                          className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-medium text-foreground">{field.label}</span>
                      </label>
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        className={FORM_INPUT}
                        value={val as number}
                        onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                        placeholder={field.placeholder || `Enter number…`}
                        required={field.required}
                      />
                    ) : field.type === "date" ? (
                      <DatePicker
                        value={val as string}
                        onChange={(val) => setData((d) => ({ ...d, [field.id]: val }))}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                        className={FORM_INPUT}
                        value={val as string}
                        onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                        required={field.required}
                      />
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
    </FormModal>
  );
}
