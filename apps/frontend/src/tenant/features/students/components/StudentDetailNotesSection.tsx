import { Card } from "@/components/ui/card";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { useTranslation } from "@/hooks/useTranslation";
import { FileText } from "lucide-react";

export interface StudentDetailNotesSectionProps {
  notes: string;
}

export function StudentDetailNotesSection({ notes }: StudentDetailNotesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <DetailSectionTitle>{t("students.form.notesSection")}</DetailSectionTitle>
      <Card accentColor="amber" className="p-4 bg-muted/20 border-border/60">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <FileText className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-bold uppercase">{t("students.form.notesSection")}</span>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground mt-2">{notes}</p>
      </Card>
    </div>
  );
}
