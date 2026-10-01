import type React from "react";
import { FileText } from "lucide-react";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { FORM_TEXTAREA } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultyMember, FieldDefinition } from "@mms/shared";
import { resolveFacultyFieldLabel } from "@/tenant/features/faculty/components/FacultyFormSectionShared";

export interface FacultyNotesSectionProps {
  notes?: string;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  error?: string;
}

export function FacultyNotesSection({
  notes,
  fields,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
  error,
}: FacultyNotesSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!isFieldEnabled("notes")) {
    return null;
  }

  const notesLabel = resolveFacultyFieldLabel(fields, "employment", "notes", t);
  const notesRequired = isFieldRequired("notes");

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("faculty.form.notesSection")}
        subtitle={t("faculty.form.notesSectionDesc")}
        icon={FileText}
        accentColor="emerald"
      >
        <Field label={notesLabel} id="notes" required={notesRequired} error={error}>
          <Textarea
            id="notes"
            name="notes"
            required={notesRequired}
            value={notes || ""}
            onChange={(event) => onDraftChange({ notes: event.target.value })}
            placeholder={t("faculty.form.notesPlaceholder")}
            className={cn(FORM_TEXTAREA, "min-h-30")}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
