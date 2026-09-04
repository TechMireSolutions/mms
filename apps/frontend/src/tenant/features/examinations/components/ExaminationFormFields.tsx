import React from "react";
import { BookOpen, Trophy, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { EXAMINATION_SUBJECT_OPTIONS } from "./examinationFormConstants";
import type { useExaminationForm } from "./useExaminationForm";
import type { Exam } from "@/lib/data/examinationData";

export type ExaminationFormFieldsProps = Pick<
  ReturnType<typeof useExaminationForm>,
  "t" | "errors" | "examDraft" | "classes" | "updateDraft" | "getFieldError"
>;

export const ExaminationFormFields = (function ExaminationFormFields({
  t,
  errors,
  examDraft,
  classes,
  updateDraft,
  getFieldError,
}: ExaminationFormFieldsProps): React.JSX.Element {

      return (
        <div className="space-y-5 text-start">
          <SectionCard
            accentColor="primary"
            icon={BookOpen}
            title={t("examinations.form.section.parameters")}
            className="shadow-sm"
          >

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
                    {(() => {
                      const classIdSet = new Set(examDraft.classIds ?? []);
                      return classes.map((sessionClass) => {
                        const active = classIdSet.has(sessionClass.id);
                        return (
                          <Button
                            key={sessionClass.id}
                            type="button"
                            onClick={() => {
                              const next = new Set(examDraft.classIds ?? []);
                              if (next.has(sessionClass.id)) { next.delete(sessionClass.id); } else { next.add(sessionClass.id); }
                              updateDraft({ classIds: [...next] });
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
                      });
                    })()}
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
          </SectionCard>
        </div>
      );
    });
