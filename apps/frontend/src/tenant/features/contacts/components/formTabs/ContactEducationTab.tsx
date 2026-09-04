import React, { useCallback } from "react";
import { GraduationCap, Building2, BookOpen, Calendar, Award } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { EditableSelect, Field, FormCheckboxCard } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactEducation } from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";

/**
 * TypeScript interface representing an individual education entry.
 */
export type EducationEntry = ContactEducation;

export interface ContactEducationTabProps extends ContactSubListTabBaseProps {
  degreeOptions: string[];
  onUpdateDegreeOptions?: (options: string[]) => void;
  defaultDegree?: string;
}

export function ContactEducationTab({
  contactDraft,
  getLocalId,
  degreeOptions,
  onUpdateDegreeOptions,
  defaultDegree,
  formInstanceId,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactEducationTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const showDegree = isFieldEnabled("education", "degree");
  const showInstitution = isFieldEnabled("education", "institution");
  const showFieldOfStudy = isFieldEnabled("education", "fieldOfStudy");
  const showYear = isFieldEnabled("education", "year");
  const showGrade = isFieldEnabled("education", "grade");
  const allowAdd = resolveSubListAllowAdd([showDegree, showInstitution, showFieldOfStudy, showYear, showGrade]);

  const educations = contactDraft.education || [];

  const emptyEducation = useCallback((): ContactEducation => ({
    degree: defaultDegree || degreeOptions[0] || "",
    institution: "",
    fieldOfStudy: "",
    year: "",
    grade: "",
    isCurrentlyEnrolled: false,
  }), [defaultDegree, degreeOptions]);

  const addEducation = useCallback(() => {
    addSubListItem("education", emptyEducation());
  }, [addSubListItem, emptyEducation]);

  const ensureEducation = useCallback(() => {
    ensureSubListItem("education", emptyEducation());
  }, [ensureSubListItem, emptyEducation]);

  const removeEducation = useCallback((idx: number) => {
    removeSubListItem("education", idx);
  }, [removeSubListItem]);

  const updateEducation = useCallback(
    (idx: number, patch: Partial<ContactEducation> & Record<string, unknown>) => {
      updateSubListItem("education", idx, patch);
    },
    [updateSubListItem],
  );

  return (
    <ContactSubListShell
      isEmpty={educations.length === 0}
      emptyIcon={GraduationCap}
      emptyMessage={t("contacts.form.noEducationYet")}
      addLabel={t("contacts.form.addEducation")}
      onAdd={addEducation}
      onEnsureRow={ensureEducation}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {educations.map((edu, idx) => {
          const institutionError = getListItemError("education", "institution", idx);
          const fieldOfStudyError = getListItemError("education", "fieldOfStudy", idx);
          const yearError = getListItemError("education", "year", idx);
          const gradeError = getListItemError("education", "grade", idx);

          return (
            <ListFieldCard
              key={getLocalId("education", idx)}
              id={getLocalId("education", idx)}
              index={idx}
              accentClass={SUB_LIST_CARD_ACCENTS.education.accent}
              label={showDegree ? `${t("contacts.fields.educationDegree")}:` : undefined}
              typeSelect={
                showDegree ? (
                  <EditableSelect
                    options={degreeOptions}
                    value={edu.degree || defaultDegree || degreeOptions[0] || ""}
                    onChange={(val) => updateEducation(idx, { degree: val })}
                    onUpdateOptions={onUpdateDegreeOptions}
                    className="w-40 @sm:w-52 min-w-0"
                    id={`cf-${formInstanceId}-education-degree-${idx}`}
                    name={`cf-${formInstanceId}-education-degree-${idx}`}
                    placeholder={t("contacts.form.educationLevelPlaceholder")}
                  />
                ) : undefined
              }
              onRemove={() => removeEducation(idx)}
              removeLabel={t("contacts.form.removeEducation", { index: idx + 1 })}
            >
              <div className="space-y-3">
                {/* 1. Institution Name */}
                {showInstitution ? (
                  <Field
                    label={t("contacts.fields.educationInstitution")}
                    required={isFieldRequired("education", "institution")}
                    error={institutionError}
                    id={`cf-${formInstanceId}-education-institution-${idx}`}
                  >
                    <LeadingIconInput
                      icon={Building2}
                      id={`cf-${formInstanceId}-education-institution-${idx}`}
                      name={`cf-${formInstanceId}-education-institution-${idx}`}
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={Boolean(institutionError)}
                      value={edu.institution || ""}
                      required={isFieldRequired("education", "institution")}
                      onChange={(e) => updateEducation(idx, { institution: e.target.value })}
                      placeholder={t("contacts.form.institutionPlaceholder")}
                      className={cn(institutionError && "border-destructive focus-visible:ring-destructive")}
                    />
                  </Field>
                ) : null}

                {/* 3. Major / Field of Study (Full Width) */}
                {showFieldOfStudy ? (
                  <Field
                    label={t("contacts.fields.educationFieldOfStudy")}
                    required={isFieldRequired("education", "fieldOfStudy")}
                    error={fieldOfStudyError}
                    id={`cf-${formInstanceId}-education-field-${idx}`}
                  >
                    <LeadingIconInput
                      icon={BookOpen}
                      id={`cf-${formInstanceId}-education-field-${idx}`}
                      name={`cf-${formInstanceId}-education-field-${idx}`}
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={Boolean(fieldOfStudyError)}
                      value={edu.fieldOfStudy || ""}
                      required={isFieldRequired("education", "fieldOfStudy")}
                      onChange={(e) => updateEducation(idx, { fieldOfStudy: e.target.value })}
                      placeholder={t("contacts.form.fieldOfStudyPlaceholder")}
                      className={cn(fieldOfStudyError && "border-destructive focus-visible:ring-destructive")}
                    />
                  </Field>
                ) : null}

                {/* 4. Passing Year & Grade / Division (2-Column Row) */}
                {showYear || showGrade ? (
                  <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                    {showYear ? (
                      <Field
                        label={t("contacts.fields.educationYear")}
                        required={!edu.isCurrentlyEnrolled && isFieldRequired("education", "year")}
                        error={yearError}
                        id={`cf-${formInstanceId}-education-year-${idx}`}
                      >
                        <LeadingIconInput
                          icon={Calendar}
                          id={`cf-${formInstanceId}-education-year-${idx}`}
                          name={`cf-${formInstanceId}-education-year-${idx}`}
                          inputMode="numeric"
                          spellCheck={false}
                          enterKeyHint="next"
                          aria-invalid={Boolean(yearError)}
                          value={
                            edu.isCurrentlyEnrolled
                              ? t("contacts.form.currentlyStudying")
                              : edu.year || ""
                          }
                          disabled={Boolean(edu.isCurrentlyEnrolled)}
                          required={!edu.isCurrentlyEnrolled && isFieldRequired("education", "year")}
                          onChange={(e) => updateEducation(idx, { year: e.target.value })}
                          placeholder={t("contacts.form.passingYearPlaceholder")}
                          className={cn(yearError && "border-destructive focus-visible:ring-destructive")}
                        />
                      </Field>
                    ) : null}

                    {showGrade ? (
                      <Field
                        label={t("contacts.fields.educationGrade")}
                        required={isFieldRequired("education", "grade")}
                        error={gradeError}
                        id={`cf-${formInstanceId}-education-grade-${idx}`}
                      >
                        <LeadingIconInput
                          icon={Award}
                          id={`cf-${formInstanceId}-education-grade-${idx}`}
                          name={`cf-${formInstanceId}-education-grade-${idx}`}
                          autoCapitalize="characters"
                          enterKeyHint="next"
                          aria-invalid={Boolean(gradeError)}
                          value={edu.grade || ""}
                          required={isFieldRequired("education", "grade")}
                          onChange={(e) => updateEducation(idx, { grade: e.target.value })}
                          placeholder={t("contacts.form.gradePlaceholder")}
                          className={cn(gradeError && "border-destructive focus-visible:ring-destructive")}
                        />
                      </Field>
                    ) : null}
                  </div>
                ) : null}

                {/* 5. Currently Enrolled Checkbox Toggle */}
                <FormCheckboxCard
                  id={`cf-${formInstanceId}-education-enrolled-${idx}`}
                  name={`cf-${formInstanceId}-education-enrolled-${idx}`}
                  checked={Boolean(edu.isCurrentlyEnrolled)}
                  onCheckedChange={(checked) =>
                    updateEducation(idx, {
                      isCurrentlyEnrolled: checked,
                      year: checked ? "" : edu.year,
                    })
                  }
                  label={t("contacts.form.currentlyStudyingHere")}
                />
              </div>
            </ListFieldCard>

          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
