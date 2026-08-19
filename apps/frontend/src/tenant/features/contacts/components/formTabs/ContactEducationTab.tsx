import { GraduationCap, School } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EditableSelect, FieldErrorMessage, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactEducation } from "@mms/shared";

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
          const institutionError = getListItemError("education", "institution", idx);
          const degreeError = getListItemError("education", "degree", idx);
          const fieldOfStudyError = getListItemError("education", "fieldOfStudy", idx);
          const yearError = getListItemError("education", "year", idx);
          const gradeError = getListItemError("education", "grade", idx);

          return (
            <ListFieldCard
              key={getLocalId("education", idx)}
              id={getLocalId("education", idx)}
              index={idx}
              icon={GraduationCap}
              accentClass="bg-primary/60 group-hover:bg-primary"
              iconClass="text-primary/70 group-hover:text-primary"
              label={`${t("contacts.fields.educationDegree")}:`}
              typeSelect={
                showDegree ? (
                  <EditableSelect
                    options={degreeOptions}
                    value={edu.degree || ""}
                    onChange={(val) => updateEducation(idx, { degree: val })}
                    onUpdateOptions={onUpdateDegreeOptions}
                    className={TYPE_SELECT_WIDTH}
                    id={`education-degree-${idx}`}
                    name={`education-degree-${idx}`}
                    placeholder={t("contacts.fields.educationDegree")}
                  />
                ) : undefined
              }
              onRemove={() => removeEducation(idx)}
              removeLabel={t("contacts.form.removeEducation", { index: idx + 1 })}
            >
              <div className="space-y-3">
                {showInstitution ? (
                  <div>
                    <LeadingIconInput
                      icon={School}
                      id={`education-institution-${idx}`}
                      name={`education-institution-${idx}`}
                      value={edu.institution || ""}
                      required={isFieldRequired("education", "institution")}
                      onChange={(e) => updateEducation(idx, { institution: e.target.value })}
                      placeholder={t("contacts.fields.educationInstitution")}
                      className={cn(institutionError && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldErrorMessage message={institutionError} />
                  </div>
                ) : null}

                {showFieldOfStudy || showYear || showGrade ? (
                  <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-3">
                    {showFieldOfStudy ? (
                      <div>
                        <Input
                          id={`education-field-${idx}`}
                          name={`education-field-${idx}`}
                          value={edu.fieldOfStudy || ""}
                          required={isFieldRequired("education", "fieldOfStudy")}
                          onChange={(e) => updateEducation(idx, { fieldOfStudy: e.target.value })}
                          placeholder={t("contacts.fields.educationFieldOfStudy")}
                          className={cn(fieldOfStudyError && "border-destructive focus-visible:ring-destructive")}
                        />
                        <FieldErrorMessage message={fieldOfStudyError} />
                      </div>
                    ) : null}

                    {showYear ? (
                      <div>
                        <Input
                          id={`education-year-${idx}`}
                          name={`education-year-${idx}`}
                          value={edu.year || ""}
                          required={isFieldRequired("education", "year")}
                          onChange={(e) => updateEducation(idx, { year: e.target.value })}
                          placeholder={t("contacts.fields.educationYear")}
                          className={cn(yearError && "border-destructive focus-visible:ring-destructive")}
                        />
                        <FieldErrorMessage message={yearError} />
                      </div>
                    ) : null}

                    {showGrade ? (
                      <div>
                        <Input
                          id={`education-grade-${idx}`}
                          name={`education-grade-${idx}`}
                          value={edu.grade || ""}
                          required={isFieldRequired("education", "grade")}
                          onChange={(e) => updateEducation(idx, { grade: e.target.value })}
                          placeholder={t("contacts.fields.educationGrade")}
                          className={cn(gradeError && "border-destructive focus-visible:ring-destructive")}
                        />
                        <FieldErrorMessage message={gradeError} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {degreeError ? <FieldErrorMessage message={degreeError} /> : null}
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
