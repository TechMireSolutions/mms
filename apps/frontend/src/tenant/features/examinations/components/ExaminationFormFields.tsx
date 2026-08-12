import React, { useMemo } from "react";
import { BookOpen, Trophy, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { Exam } from '@/lib/data/examinationData';
import { FORM_INPUT } from "@/components/ui/formStyles";
import { findDfsTab } from "@mms/shared";
import { EXAMINATION_SUBJECT_OPTIONS } from "./examinationFormConstants";
import type { useExaminationForm } from "./useExaminationForm";

type ExaminationFormFieldsProps = Pick<
  ReturnType<typeof useExaminationForm>,
  "t" | "errors" | "examDraft" | "classes" | "updateDraft" | "dfsTabs" | "getFieldError"
>;

export function ExaminationFormFields({
  t,
  errors,
  examDraft,
  classes,
  updateDraft,
  dfsTabs,
  getFieldError,
}: ExaminationFormFieldsProps): React.JSX.Element {
  const basicDfsFields = useMemo(() => findDfsTab(dfsTabs, "basic")?.fields, [dfsTabs]);
  const dfsCustomTabs = useMemo(
    () => (dfsTabs ?? []).filter((tab) => tab.enabled && tab.key !== "basic"),
    [dfsTabs],
  );

  return (
    <div className="space-y-5 text-start">
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
              options={EXAMINATION_SUBJECT_OPTIONS.map((subjectOption) => ({
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
                name="date"
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

          {/* DFS custom fields on the "basic" tab */}
          {basicDfsFields && basicDfsFields.length > 0 && (
            <>
              {basicDfsFields.filter((f) => f.enabled).map((field) => {
                const customData = (examDraft as Record<string, unknown>).customData as Record<string, unknown> | undefined;
                const rawValue = customData?.[field.key];
                const fieldId = `ex-custom-${field.key}`;
                return (
                  <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <Field id={fieldId} label={`${field.label}${field.required ? " *" : ""}`} required={field.required} error={getFieldError(field.key)}>
                      <CustomFieldInput
                        field={field}
                        value={rawValue}
                        onChange={(value) => {
                          const currentCustomData = ((examDraft as Record<string, unknown>).customData as Record<string, unknown> | undefined) ?? {};
                          updateDraft({ customData: { ...currentCustomData, [field.key]: value } } as Partial<typeof examDraft>);
                        }}
                        error={Boolean(getFieldError(field.key))}
                      />
                    </Field>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </Card>

      {/* DFS custom-field-only tabs (non-system tabs) */}
      {dfsCustomTabs.map((dfsTab) => {
        const enabledFields = (dfsTab.fields || []).filter((f) => f.enabled);
        if (enabledFields.length === 0) return null;
        return (
          <Card key={dfsTab.key} accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{dfsTab.label}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enabledFields.map((field) => {
                const customData = (examDraft as Record<string, unknown>).customData as Record<string, unknown> | undefined;
                const rawValue = customData?.[field.key];
                const fieldId = `ex-custom-${field.key}`;
                return (
                  <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <Field id={fieldId} label={`${field.label}${field.required ? " *" : ""}`} required={field.required} error={getFieldError(field.key)}>
                      <CustomFieldInput
                        field={field}
                        value={rawValue}
                        onChange={(value) => {
                          const currentCustomData = ((examDraft as Record<string, unknown>).customData as Record<string, unknown> | undefined) ?? {};
                          updateDraft({ customData: { ...currentCustomData, [field.key]: value } } as Partial<typeof examDraft>);
                        }}
                        error={Boolean(getFieldError(field.key))}
                      />
                    </Field>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
