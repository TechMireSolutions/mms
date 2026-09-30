import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

export interface FacultyDetailNotesSectionProps {
  notes: string;
}

export function FacultyDetailNotesSection({
  notes,
}: FacultyDetailNotesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <DetailSectionTitle>{t("faculty.detail.notesSection")}</DetailSectionTitle>
      <div className={cn("p-3.5 border-border/60 text-xs text-foreground space-y-1", WORK_SURFACE_INNER)}>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold uppercase">{t("faculty.detail.notesSection")}</span>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{notes}</p>
      </div>
    </div>
  );
}

