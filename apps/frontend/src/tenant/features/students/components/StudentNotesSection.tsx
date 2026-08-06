import type React from "react";
import { FileText } from "lucide-react";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { FORM_TEXTAREA } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import type { FieldDefinition, Student } from "@mms/shared";
import { resolveStudentFieldLabel } from "@/tenant/features/students/components/StudentFormSectionShared";

interface StudentNotesSectionProps {
  notes?: string;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Student>) => void;
}

export function StudentNotesSection({
  notes,
  fields,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: StudentNotesSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!isFieldEnabled("notes")) {
    return null;
  }

  const notesLabel = resolveStudentFieldLabel(fields, "registration", "notes", "students.form.notesLabel", t);
  const notesRequired = isFieldRequired("notes");

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.notesSection")}
        subtitle={t("students.form.notesSectionDesc")}
        icon={FileText}
        accentColor="emerald"
      >
        <Field label={notesLabel} required={notesRequired}>
          <Textarea
            required={notesRequired}
            value={notes || ""}
            onChange={(event) => onDraftChange({ notes: event.target.value })}
            placeholder={t("students.form.notesPlaceholder")}
            className={`${FORM_TEXTAREA} min-h-30`}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
