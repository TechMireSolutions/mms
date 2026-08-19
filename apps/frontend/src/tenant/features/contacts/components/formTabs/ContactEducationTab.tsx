import { GraduationCap, Building2, BookOpen, Calendar, Award } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { EditableSelect, Field, FormCheckboxCard } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactEducation } from "@mms/shared";


/**
 * TypeScript interface representing an individual education entry.
 */
export type EducationEntry = ContactEducation;

interface ContactEducationTabProps extends ContactSubListTabBaseProps {
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
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactEducationTabProps): JSX.Element {
  const { t } = useTranslation();
  const showDegree = isFieldEnabled("education", "degree");
  const showInstitution = isFieldEnabled("education", "institution");
  const showFieldOfStudy = isFieldEnabled("education", "fieldOfStudy");
  const showYear = isFieldEnabled("education", "year");
  const showGrade = isFieldEnabled("education", "grade");
  const allowAdd = resolveSubListAllowAdd([showDegree, showInstitution, showFieldOfStudy, showYear, showGrade]);

  const educations = contactDraft.education || [];
  const emptyEducation = (): ContactEducation => ({
    degree: defaultDegree || degreeOptions[0] || "",
    institution: "",
    fieldOfStudy: "",
    year: "",
    grade: "",
    isCurrentlyEnrolled: false,
  });

  const addEducation = () => {
    addSubListItem("education", emptyEducation());
  };

  const ensureEducation = () => {
    ensureSubListItem("education", emptyEducation());
  };

  const removeEducation = (idx: number) => removeSubListItem("education", idx);
  const updateEducation = (idx: number, patch: Partial<ContactEducation> & Record<string, unknown>) =>
    updateSubListItem("education", idx, patch);

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
          const degreeError = getListItemError("education", "degree", idx);
          const institutionError = getListItemError("education", "institution", idx);
          const fieldOfStudyError = getListItemError("education", "fieldOfStudy", idx);
          const yearError = getListItemError("education", "year", idx);
          const gradeError = getListItemError("education", "grade", idx);

          return (
            <ListFieldCard
              key={getLocalId("education", idx)}
              id={getLocalId("education", idx)}
              index={idx}
              icon={GraduationCap}
              accentClass="bg-indigo-500/80 group-hover:bg-indigo-500"
              iconClass="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500"
              label={t("contacts.form.educationNumber", { index: idx + 1 })}
              onRemove={() => removeEducation(idx)}
              removeLabel={t("contacts.form.removeEducation", { index: idx + 1 })}
            >
              <div className="space-y-3">
                {/* 1. Education Level (Full Width) */}
                {showDegree ? (
                  <Field
                    label={t("contacts.fields.educationDegree")}
                    required={isFieldRequired("education", "degree")}
                    error={degreeError}
                    id={`education-degree-${idx}`}
                  >
                    <EditableSelect
                      options={degreeOptions}
                      value={edu.degree || defaultDegree || degreeOptions[0] || ""}
                      onChange={(val) => updateEducation(idx, { degree: val })}
                      onUpdateOptions={onUpdateDegreeOptions}
                      className="w-full min-w-0"
                      id={`education-degree-${idx}`}
                      name={`education-degree-${idx}`}
                      placeholder={t("contacts.form.educationLevelPlaceholder")}
                    />
                  </Field>
                ) : null}

                {/* 2. Institution Name (Full Width) */}
                {showInstitution ? (
                  <Field
                    label={t("contacts.fields.educationInstitution")}
                    required={isFieldRequired("education", "institution")}
                    error={institutionError}
                    id={`education-institution-${idx}`}
                  >
                    <LeadingIconInput
                      icon={Building2}
                      id={`education-institution-${idx}`}
                      name={`education-institution-${idx}`}
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
                    id={`education-field-${idx}`}
                  >
                    <LeadingIconInput
                      icon={BookOpen}
                      id={`education-field-${idx}`}
                      name={`education-field-${idx}`}
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
                        id={`education-year-${idx}`}
                      >
                        <LeadingIconInput
                          icon={Calendar}
                          id={`education-year-${idx}`}
                          name={`education-year-${idx}`}
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
                        id={`education-grade-${idx}`}
                      >
                        <LeadingIconInput
                          icon={Award}
                          id={`education-grade-${idx}`}
                          name={`education-grade-${idx}`}
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
                  id={`education-enrolled-${idx}`}
                  name={`education-enrolled-${idx}`}
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
