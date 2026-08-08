import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { useTranslation } from "@/hooks/useTranslation";
import { FileText } from "lucide-react";

interface StudentDetailNotesSectionProps {
  notes: string;
}

export function StudentDetailNotesSection({ notes }: StudentDetailNotesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <DetailSectionTitle>{t("students.form.notesSection")}</DetailSectionTitle>
      <div className={`p-3.5 ${WORK_SURFACE_INNER} border-border/60 text-xs text-foreground space-y-1`}>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold uppercase">{t("students.form.notesSection")}</span>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{notes}</p>
      </div>
    </div>
  );
}
