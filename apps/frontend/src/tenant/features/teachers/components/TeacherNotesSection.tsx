import type React from "react";
import { FileText } from "lucide-react";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import type { FieldDefinition, Teacher } from "@mms/shared";
import { resolveTeacherFieldLabel } from "@/tenant/features/teachers/components/TeacherFormSectionShared";

interface TeacherNotesSectionProps {
  notes?: string;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
}

export function TeacherNotesSection({
  notes,
  fields,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: TeacherNotesSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!isFieldEnabled("notes")) {
    return null;
  }

  const notesLabel = resolveTeacherFieldLabel(fields, "employment", "notes", t);
  const notesRequired = isFieldRequired("notes");

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("teachers.form.notesSection")}
        subtitle={t("teachers.form.notesSectionDesc")}
        icon={FileText}
        accentColor="emerald"
      >
        <Field label={notesLabel} required={notesRequired}>
          <Textarea
            required={notesRequired}
            value={notes || ""}
            onChange={(event) => onDraftChange({ notes: event.target.value })}
            placeholder={t("teachers.form.notesPlaceholder")}
            className="min-h-30"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
