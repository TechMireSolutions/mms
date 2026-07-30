import type React from "react";
import { FileText } from "lucide-react";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import type { Student } from "@mms/shared";

interface StudentNotesSectionProps {
  enabled: boolean;
  notes?: string;
  onDraftChange: (patch: Partial<Student>) => void;
}

export function StudentNotesSection({
  enabled,
  notes,
  onDraftChange,
}: StudentNotesSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!enabled) return null;

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.notesSection")}
        icon={FileText}
        accentColor="emerald"
      >
        <Field label={t("students.form.notesSection")}>
          <Textarea
            value={notes || ""}
            onChange={(event) => onDraftChange({ notes: event.target.value })}
            placeholder={t("students.form.notesPlaceholder")}
            className="min-h-[7.5rem] bg-background"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
