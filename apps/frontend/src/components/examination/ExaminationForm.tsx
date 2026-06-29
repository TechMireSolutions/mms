import React, { useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { BookOpen } from "lucide-react";
import { MmsDynamicForm } from "@/components/ui/MmsDynamicForm";
import { useMmsForm } from "@/hooks/useMmsForm";
import { Exam } from '@/lib/data/examinationData';
import { useSessionsCollection } from "@/hooks/useSessions";
import { toTitleCase } from "@mms/shared";
import { useExaminationConfig } from "@/hooks/useExaminationConfig";
import { DatePicker } from "../ui/DatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_TEXTAREA } from "@/components/ui/formStyles";
import {
  type FieldDefinition,
  buildCustomFieldSchema,
  getDefaultFieldValue,
} from '@mms/shared';

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

interface ExamFormData {
  name: string;
  subject: string;
  status: string;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  date: string;
  classIds: string[];
  description: string;
  [key: string]: unknown;
}

export default function ExamForm({ open = true, exam, onClose, onSave }: ExamFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { fields, customFields, orderedFields } = useExaminationConfig();
  const [saving, setSaving] = useState(false);
  const sessions = useSessionsCollection();

  // Map configuration fields into FieldDefinitions
  const fieldsList = useMemo<FieldDefinition[]>(() => {
    return orderedFields.map((field, index) => {
      const isEnabled = fields[field.id]?.enabled !== false;
      return {
        key: field.id,
        label: field.label,
        type: (field.type || "text") as any,
        required: !!field.required,
        enabled: isEnabled,
        order: index,
        placeholder: field.placeholder,
        options: field.options,
      };
    });
  }, [orderedFields, fields]);

  const fieldsByTab = useMemo<Record<string, FieldDefinition[]>>(() => {
    return {
      basic: fieldsList,
    };
  }, [fieldsList]);

  const initialValues = useMemo<ExamFormData>(() => {
    const initial: any = exam ? { ...exam } : { ...EMPTY };

    fieldsList.forEach((field) => {
      if (!["name", "subject", "status", "totalMarks", "passingMarks", "duration", "date", "classIds", "description"].includes(field.key)) {
        if (initial[field.key] === undefined) {
          initial[field.key] = getDefaultFieldValue(field) ?? "";
        }
      }
    });

    if (!initial.classIds) {
      initial.classIds = [];
    }

    return initial as ExamFormData;
  }, [exam, fieldsList]);

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {
      name: z.string().min(1, "Exam Name is required."),
      subject: z.string().optional().nullable(),
      status: z.string().optional().nullable(),
      totalMarks: z.coerce.number().min(1, "Total Marks must be at least 1."),
      passingMarks: z.coerce.number().min(1, "Passing Marks must be at least 1."),
      duration: z.coerce.number().min(5, "Duration must be at least 5 minutes."),
      date: z.string().min(1, "Exam Date is required."),
      classIds: z.array(z.string()).min(1, "At least one Class must be assigned."),
      description: z.string().optional().nullable(),
    };

    // Override field required checks from config
    fieldsList.forEach((field) => {
      if (field.required && shape[field.key]) {
        shape[field.key] = (shape[field.key] as any).min(1, `${field.label} is required.`);
      }

      // Dynamic custom fields validation
      if (!["name", "subject", "status", "totalMarks", "passingMarks", "duration", "date", "classIds", "description"].includes(field.key)) {
        shape[field.key] = buildCustomFieldSchema(field);
      }
    });

    return z.object(shape).passthrough().refine(
      (formData: any) => formData.passingMarks <= formData.totalMarks,
      {
        message: "Passing Marks cannot exceed Total Marks.",
        path: ["passingMarks"],
      }
    );
  }, [fieldsList]);

  const {
    form,
    tab,
    errors,
    handleSave,
  } = useMmsForm<ExamFormData>({
    schema,
    fields: fieldsByTab,
    initialData: initialValues,
    t,
  });

  const formValues = form.watch();
  const setValue = form.setValue;

  const completeness = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    fieldsList.forEach((field) => {
      if (!field.enabled) return;
      
      // Skip booleans and ai_summary fields from completeness score
      if (field.type === "boolean" || field.type === "ai_summary") {
        return;
      }

      const isRequired = !!field.required;
      const fieldValue = formValues[field.key];
      const isFilled = fieldValue !== undefined && fieldValue !== null && fieldValue !== "" && (!Array.isArray(fieldValue) || fieldValue.length > 0);

      if (isRequired) {
        totalRequired++;
        if (isFilled) filledRequired++;
      } else {
        totalOptional++;
        if (isFilled) filledOptional++;
      }
    });

    const requiredRatio = totalRequired === 0 ? 0 : filledRequired / totalRequired;
    const optionalRatio = totalOptional === 0 ? 0 : filledOptional / totalOptional;
    const progress = (requiredRatio * 0.7) + (optionalRatio * 0.3);

    return Math.round(progress * 100);
  }, [formValues, fieldsList]);

  const onSubmit = useCallback(async (formData: ExamFormData) => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    onSave({
      ...formData,
      name: toTitleCase(formData.name || ""),
      id: exam?.id || `ex${Date.now()}`
    } as unknown as Exam);
    setSaving(false);
    onClose();
  }, [exam, onSave, onClose]);

  const classes = useMemo(
    () => sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({
        id: sessionClass.id,
        name: `${session.name} - ${sessionClass.name}`,
      })),
    ),
    [sessions],
  );

  const renderFieldByKey = (field: FieldDefinition): React.ReactNode => {
    if (!field.enabled) return null;

    const fieldError = errors.find((error) => error.fieldId === field.key);

    if (field.key === "name") {
      return (
        <div key="name" className="sm:col-span-2">
          <Field label="Exam Name" required={field.required} error={fieldError?.message}>
            <Input
              id="exam-name"
              className={FORM_INPUT}
              value={formValues.name || ""}
              onChange={(event) => setValue("name", event.target.value, { shouldValidate: true, shouldDirty: true })}
              placeholder="e.g. Tajweed Mid-Term"
              required
            />
          </Field>
        </div>
      );
    }

    if (field.key === "subject") {
      return (
        <div key="subject">
          <Field label="Subject" required={field.required} error={fieldError?.message}>
            <FormSelect
              id="exam-subject"
              value={formValues.subject || ""}
              onChange={(value: any) => setValue("subject", value, { shouldValidate: true, shouldDirty: true })}
              placeholder="Select subject…"
              options={SUBJECTS}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "status") {
      return (
        <div key="status">
          <Field label="Status" required={field.required} error={fieldError?.message}>
            <FormSelect
              id="exam-status"
              value={formValues.status || "upcoming"}
              onChange={(value: any) => setValue("status", value, { shouldValidate: true, shouldDirty: true })}
              options={[
                { value: "upcoming", label: "Upcoming" },
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "totalMarks") {
      return (
        <div key="totalMarks">
          <Field label="Total Marks" required={field.required} error={fieldError?.message}>
            <Input
              id="exam-total"
              type="number"
              className={FORM_INPUT}
              value={formValues.totalMarks ?? 100}
              onChange={(event) => setValue("totalMarks", event.target.value === "" ? 0 : +event.target.value, { shouldValidate: true, shouldDirty: true })}
              min={1}
              required={field.required}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "passingMarks") {
      return (
        <div key="passingMarks">
          <Field label="Passing Marks" required={field.required} error={fieldError?.message}>
            <Input
              id="exam-passing"
              type="number"
              className={FORM_INPUT}
              value={formValues.passingMarks ?? 50}
              onChange={(event) => setValue("passingMarks", event.target.value === "" ? 0 : +event.target.value, { shouldValidate: true, shouldDirty: true })}
              min={1}
              max={formValues.totalMarks ?? 100}
              required={field.required}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "duration") {
      return (
        <div key="duration">
          <Field label="Duration (min)" required={field.required} error={fieldError?.message}>
            <Input
              id="exam-duration"
              type="number"
              className={FORM_INPUT}
              value={formValues.duration ?? 60}
              onChange={(event) => setValue("duration", event.target.value === "" ? 0 : +event.target.value, { shouldValidate: true, shouldDirty: true })}
              min={5}
              required={field.required}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "date") {
      return (
        <div key="date" className="sm:col-span-2">
          <Field label="Exam Date" required={field.required} error={fieldError?.message}>
            <DatePicker
              id="exam-date"
              value={formValues.date || ""}
              onChange={(value) => setValue("date", value, { shouldValidate: true, shouldDirty: true })}
              required
            />
          </Field>
        </div>
      );
    }

    if (field.key === "classIds") {
      return (
        <div key="classIds" className="sm:col-span-2">
          <Field label="Assign to Classes" required={field.required} error={fieldError?.message}>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Assign to classes list">
              {classes.map((sessionClass) => {
                const active = !!(formValues.classIds && (formValues.classIds as string[]).includes(sessionClass.id));
                return (
                  <Button
                    key={sessionClass.id}
                    type="button"
                    onClick={() => {
                      const classIds = formValues.classIds ? [...(formValues.classIds as string[])] : [];
                      const nextClassIds = classIds.includes(sessionClass.id) ? classIds.filter((classId) => classId !== sessionClass.id) : [...classIds, sessionClass.id];
                      setValue("classIds", nextClassIds, { shouldValidate: true, shouldDirty: true });
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
      );
    }

    if (field.key === "description") {
      return (
        <div key="description" className="sm:col-span-2">
          <Field label="Description" required={field.required} error={fieldError?.message}>
            <textarea
              id="exam-desc"
              className={FORM_TEXTAREA}
              rows={2}
              value={formValues.description || ""}
              onChange={(event) => setValue("description", event.target.value, { shouldValidate: true, shouldDirty: true })}
              placeholder="Optional notes about this exam…"
              required={field.required}
            />
          </Field>
        </div>
      );
    }

    // Default custom field rendering
    const value = formValues[field.key] ?? getDefaultFieldValue(field);
    return (
      <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
        <Field label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(next) => setValue(field.key as any, next, { shouldValidate: true, shouldDirty: true })}
            error={!!fieldError}
          />
        </Field>
      </div>
    );
  };

  const renderBasicContent = () => {
    return (
      <div className="space-y-5 text-left">
        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldsList.map((field) => renderFieldByKey(field))}
          </div>
        </section>
      </div>
    );
  };

  const valid = !!(formValues.name && formValues.date && formValues.classIds && (formValues.classIds as string[]).length > 0);

  return (
    <MmsDynamicForm
      open={open}
      onClose={onClose}
      title={exam ? "Edit Exam" : "Create Exam"}
      icon={BookOpen}
      progress={completeness}
      progressLabel="Progress"
      showBuilderToggle={false}
      isBuilderMode={false}
      builderPanel={null}
      tabs={[]}
      activeTab={tab}
      error={errors.map((error) => error.message)}
      cancelLabel="Cancel"
      saveLabel={exam ? "Save Changes" : "Create Exam"}
      onSave={() => void handleSave(onSubmit)()}
      saving={saving}
      saveDisabled={!valid}
      fields={fieldsList}
      data={formValues}
      setValue={(key, value, options) => setValue(key as any, value, options)}
      errors={errors}
      renderField={renderFieldByKey}
      renderBasicContent={renderBasicContent}
    />
  );
}
